import asyncio
import json
import logging
from typing import Any, Dict, List

import httpx

from backend.app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def clean_json_response(raw_text: str) -> str:
    """Remove optional markdown fences and isolate the JSON object."""
    text = (raw_text or "").strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text[:-3]
    start, end = text.find("{"), text.rfind("}")
    if start >= 0 and end > start:
        return text[start:end + 1].strip()
    return text


class GeminiService:
    """Gemini REST client with round-robin keys and per-request failover."""

    PER_KEY_TIMEOUT_SECONDS = 15.0
    TOTAL_REQUEST_TIMEOUT_SECONDS = 35.0

    def __init__(self) -> None:
        self.model = settings.GEMINI_MODEL
        self.fast_model = settings.GEMINI_FAST_MODEL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"
        self._keys = self._load_keys()
        self._next_key = 0
        self._key_lock = asyncio.Lock()

    @staticmethod
    def _load_keys() -> List[str]:
        # Supports GEMINI_API_KEYS as a comma-separated list, plus the
        # explicit numbered variables and the original GEMINI_API_KEY.
        # Prefer numbered variables when both formats are populated so the
        # four explicit slots are the ones used by default.
        candidates = [
            getattr(settings, "GEMINI_API_KEY", ""),
            getattr(settings, "GEMINI_API_KEY_2", ""),
            getattr(settings, "GEMINI_API_KEY_3", ""),
            getattr(settings, "GEMINI_API_KEY_4", ""),
            getattr(settings, "GEMINI_API_KEYS", ""),
        ]
        keys: List[str] = []
        for candidate in candidates:
            for key in str(candidate or "").split(","):
                key = key.strip()
                if key and key not in keys:
                    keys.append(key)
        return keys

    async def _key_order(self) -> List[str]:
        if not self._keys:
            raise RuntimeError(
                "No Gemini API keys are configured. Add GEMINI_API_KEY (and optionally "
                "GEMINI_API_KEY_2 through GEMINI_API_KEY_4) to backend/.env."
            )
        async with self._key_lock:
            start = self._next_key
            self._next_key = (self._next_key + 1) % len(self._keys)
        return self._keys[start:] + self._keys[:start]

    async def generate_structured_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        model: str | None = None,
    ) -> Dict[str, Any]:
        prompt = (
            f"{system_prompt}\n\n"
            "Return only one valid JSON object. Do not include markdown fences or text outside JSON."
        )
        payload = {
            "systemInstruction": {"parts": [{"text": prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                "responseMimeType": "application/json",
            },
        }
        request_model = model or self.model
        key_order = await self._key_order()
        errors: List[str] = []
        loop = asyncio.get_running_loop()
        deadline = loop.time() + self.TOTAL_REQUEST_TIMEOUT_SECONDS
        async with httpx.AsyncClient(timeout=self.PER_KEY_TIMEOUT_SECONDS) as client:
            for index, key in enumerate(key_order):
                remaining = deadline - loop.time()
                if remaining <= 0:
                    errors.append("overall request deadline reached")
                    break
                url = f"{self.base_url}/{request_model}:generateContent"
                try:
                    response = await client.post(
                        url,
                        json=payload,
                        headers={"x-goog-api-key": key},
                        timeout=min(self.PER_KEY_TIMEOUT_SECONDS, remaining),
                    )
                    response.raise_for_status()
                    data = response.json()
                    parts = (
                        data.get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [])
                    )
                    raw_text = "".join(
                        part.get("text", "") for part in parts
                        if isinstance(part, dict)
                    )
                    parsed = json.loads(clean_json_response(raw_text))
                    if not isinstance(parsed, dict):
                        raise ValueError("Gemini returned JSON that was not an object.")
                    logger.info(
                        "Gemini request succeeded using key slot %d and model %s.",
                        index + 1,
                        request_model,
                    )
                    return parsed
                except (httpx.HTTPError, json.JSONDecodeError, ValueError, KeyError, IndexError) as error:
                    # Never log the key or provider URL with its credential.
                    status = (
                        f"HTTP {error.response.status_code}"
                        if isinstance(error, httpx.HTTPStatusError)
                        else type(error).__name__
                    )
                    errors.append(f"key slot {index + 1}: {status}")
                    logger.warning(
                        "Gemini request failed with key slot %d (%s); trying the next configured key.",
                        index + 1,
                        status,
                    )
                    if index + 1 < len(key_order):
                        await asyncio.sleep(0.25)

        logger.error("All configured Gemini keys failed: %s", ", ".join(errors))
        raise RuntimeError(
            "Gemini could not generate a response with the configured API keys "
            f"({', '.join(errors)}). Check key validity, model access, and quota."
        )


gemini_service = GeminiService()
