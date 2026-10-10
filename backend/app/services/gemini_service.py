import asyncio
import json
import logging
import re
from typing import Dict, Any

import httpx

from backend.app.core.config import get_settings


logger = logging.getLogger(__name__)

settings = get_settings()


# ============================================================
# GROQ REQUEST PACER
# ============================================================

class GroqRequestPacer:
    """
    Controls the frequency of requests sent to Groq.
    This helps avoid hitting RPM limits.
    """

    def __init__(self, requests_per_minute: int = 10):
        self.requests_per_minute = max(
            1,
            requests_per_minute
        )

        self.interval_seconds = (
            60.0 / self.requests_per_minute
        )

        self.next_request_at = 0.0
        self.lock = asyncio.Lock()

    async def wait_turn(self) -> None:
        loop = asyncio.get_running_loop()

        async with self.lock:
            now = loop.time()

            wait_seconds = max(
                0.0,
                self.next_request_at - now
            )

            if wait_seconds > 0:
                logger.info(
                    "Waiting %.1f seconds before Groq request.",
                    wait_seconds
                )

                await asyncio.sleep(
                    wait_seconds
                )

            self.next_request_at = (
                loop.time()
                + self.interval_seconds
            )


# ============================================================
# CLEAN JSON RESPONSE
# ============================================================

def clean_json_response(raw_text: str) -> str:
    """
    Cleans markdown/code fences and extracts JSON object.
    """

    if not raw_text:
        raise ValueError(
            "Groq returned an empty response."
        )

    text = raw_text.strip()

    # Remove ```json
    if text.startswith("```json"):
        text = text[7:]

    # Remove ```
    elif text.startswith("```"):
        text = text[3:]

    # Remove ending ```
    if text.endswith("```"):
        text = text[:-3]

    text = text.strip()

    # Find first JSON object
    start = text.find("{")

    # Find last JSON object
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:
        text = text[start:end + 1]

    return text.strip()


# ============================================================
# EXTRACT RETRY TIME FROM GROQ ERROR
# ============================================================

def extract_retry_seconds(
    error_message: str,
) -> float:
    """
    Extract retry time from messages such as:

    Please try again in 2.0775s.
    """

    if not error_message:
        return 5.0

    patterns = [
        r"try again in\s+([0-9]+(?:\.[0-9]+)?)s",
        r"retry.*?([0-9]+(?:\.[0-9]+)?)s",
    ]

    for pattern in patterns:
        match = re.search(
            pattern,
            error_message,
            re.IGNORECASE
        )

        if match:
            try:
                seconds = float(
                    match.group(1)
                )

                # Add a small safety buffer.
                return max(
                    3.0,
                    seconds + 1.0
                )

            except ValueError:
                pass

    # Safe fallback
    return 5.0


# ============================================================
# GROQ AI SERVICE
# ============================================================

class GeminiService:
    """
    Compatibility class.

    Existing application code uses GeminiService and
    gemini_service, so we keep those names.

    Internally this service uses Groq.
    """

    def __init__(self):

        # ----------------------------------------------------
        # API KEY
        # ----------------------------------------------------

        self.api_key = getattr(
            settings,
            "GROQ_API_KEY",
            "",
        )

        # ----------------------------------------------------
        # MODEL
        # ----------------------------------------------------

        self.model = getattr(
            settings,
            "GROQ_MODEL",
            "openai/gpt-oss-20b",
        )

        # ----------------------------------------------------
        # GROQ ENDPOINT
        # ----------------------------------------------------

        self.base_url = (
            "https://api.groq.com/openai/v1/chat/completions"
        )

        # ----------------------------------------------------
        # REQUEST PACER
        # ----------------------------------------------------

        self.request_pacer = GroqRequestPacer(
            getattr(
                settings,
                "GROQ_RPM_LIMIT",
                10,
            )
        )

        # ----------------------------------------------------
        # Keep output smaller to reduce TPM usage.
        # ----------------------------------------------------

        self.max_completion_tokens = 2500

    # ========================================================
    # PUBLIC METHOD
    # ========================================================

    async def generate_structured_json(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
    ) -> Dict[str, Any]:

        return await self._generate_with_model(
            model=self.model,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
        )

    # ========================================================
    # MAIN GROQ REQUEST
    # ========================================================

    async def _generate_with_model(
        self,
        model: str,
        system_prompt: str,
        user_prompt: str,
        temperature: float,
    ) -> Dict[str, Any]:

        # ----------------------------------------------------
        # API KEY CHECK
        # ----------------------------------------------------

        if not self.api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not set. "
                "Please configure GROQ_API_KEY in backend/.env."
            )

        # ----------------------------------------------------
        # FORCE JSON RESPONSE
        # ----------------------------------------------------

        json_system_prompt = f"""
{system_prompt}

IMPORTANT OUTPUT FORMAT:

Return ONLY a valid JSON object.

Do NOT return:
- Markdown
- ```json
- ```
- explanations
- comments
- text before JSON
- text after JSON

The complete response must be a single valid JSON object.
""".strip()

        # ----------------------------------------------------
        # GROQ PAYLOAD
        # ----------------------------------------------------

        payload = {
            "model": model,

            "messages": [
                {
                    "role": "system",
                    "content": json_system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],

            # Keep temperature low for structured output
            "temperature": temperature,

            # JSON Object Mode
            "response_format": {
                "type": "json_object"
            },

            # GPT-OSS:
            # Disable visible reasoning so the response
            # contains only the requested JSON.
            "include_reasoning": False,

            # Reduce token consumption while giving
            # enough room for structured interview JSON.
            "max_completion_tokens": (
                self.max_completion_tokens
            ),
        }

        # ====================================================
        # HTTP CLIENT
        # ====================================================

        async with httpx.AsyncClient(
            timeout=60.0
        ) as client:

            # Maximum two attempts.
            #
            # We don't want repeated 429 requests to
            # consume more TPM.

            for attempt in range(2):

                try:

                    # ----------------------------------------
                    # RPM protection
                    # ----------------------------------------

                    await self.request_pacer.wait_turn()

                    # ----------------------------------------
                    # SEND REQUEST
                    # ----------------------------------------

                    response = await client.post(
                        self.base_url,
                        json=payload,
                        headers={
                            "Authorization": (
                                f"Bearer {self.api_key}"
                            ),
                            "Content-Type": (
                                "application/json"
                            ),
                        },
                    )

                    # ----------------------------------------
                    # SUCCESS
                    # ----------------------------------------

                    response.raise_for_status()

                    # ----------------------------------------
                    # PARSE RESPONSE
                    # ----------------------------------------

                    data = response.json()

                    choices = data.get(
                        "choices",
                        []
                    )

                    if not choices:
                        raise RuntimeError(
                            "Groq returned no choices."
                        )

                    message = choices[0].get(
                        "message",
                        {}
                    )

                    raw_text = message.get(
                        "content",
                        ""
                    )

                    if not raw_text:
                        raise RuntimeError(
                            "Groq returned an empty response."
                        )

                    # ----------------------------------------
                    # CLEAN JSON
                    # ----------------------------------------

                    cleaned = clean_json_response(
                        raw_text
                    )

                    # ----------------------------------------
                    # PARSE JSON
                    # ----------------------------------------

                    try:

                        parsed = json.loads(
                            cleaned
                        )

                    except json.JSONDecodeError as json_error:

                        logger.error(
                            "Groq returned invalid JSON."
                        )

                        logger.error(
                            "Raw response: %s",
                            raw_text[:1000]
                        )

                        # Try one more extraction
                        start = cleaned.find("{")
                        end = cleaned.rfind("}")

                        if (
                            start != -1
                            and end != -1
                            and end > start
                        ):

                            possible_json = (
                                cleaned[
                                    start:end + 1
                                ]
                            )

                            try:

                                parsed = json.loads(
                                    possible_json
                                )

                            except json.JSONDecodeError:

                                raise RuntimeError(
                                    "Groq returned invalid JSON."
                                ) from json_error

                        else:

                            raise RuntimeError(
                                "Groq returned invalid JSON."
                            ) from json_error

                    # ----------------------------------------
                    # CHECK OBJECT
                    # ----------------------------------------

                    if not isinstance(
                        parsed,
                        dict
                    ):
                        raise RuntimeError(
                            "Groq response is not a JSON object."
                        )

                    # ----------------------------------------
                    # SUCCESS
                    # ----------------------------------------

                    logger.info(
                        "Groq request successful using model %s.",
                        model
                    )

                    return parsed

                # ====================================================
                # HTTP ERROR
                # ====================================================

                except httpx.HTTPStatusError as error:

                    status_code = (
                        error.response.status_code
                    )

                    # ----------------------------------------
                    # Read provider error
                    # ----------------------------------------

                    provider_message = ""

                    try:

                        error_data = (
                            error.response.json()
                        )

                        provider_error = (
                            error_data.get(
                                "error",
                                {}
                            )
                        )

                        provider_message = (
                            provider_error.get(
                                "message",
                                ""
                            )
                        )

                        # Preserve useful Groq details such as
                        # failed_generation when available.
                        failed_generation = (
                            provider_error.get(
                                "failed_generation",
                                ""
                            )
                        )

                        if failed_generation:
                            logger.error(
                                "Groq failed_generation: %s",
                                str(
                                    failed_generation
                                )[:1000]
                            )

                    except Exception:

                        provider_message = (
                            error.response.text
                        )

                    # =================================================
                    # RATE LIMIT 429
                    # =================================================

                    if status_code == 429:

                        retry_seconds = (
                            extract_retry_seconds(
                                provider_message
                            )
                        )

                        # Try Retry-After header first
                        retry_after = (
                            error.response.headers.get(
                                "retry-after"
                            )
                        )

                        if retry_after:

                            try:

                                retry_seconds = max(
                                    retry_seconds,
                                    float(
                                        retry_after
                                    )
                                )

                            except ValueError:
                                pass

                        # ---------------------------------------------
                        # If first attempt, wait and retry once
                        # ---------------------------------------------

                        if attempt == 0:

                            logger.warning(
                                "Groq rate limit reached. "
                                "Waiting %.1f seconds before retry.",
                                retry_seconds
                            )

                            await asyncio.sleep(
                                retry_seconds
                            )

                            continue

                        # ---------------------------------------------
                        # Don't endlessly retry
                        # ---------------------------------------------

                        logger.error(
                            "Groq TPM/RPM rate limit still active "
                            "after retry: %s",
                            provider_message[:500]
                        )

                        raise RuntimeError(
                            "Groq rate limit reached. "
                            "Please wait a few seconds and try again."
                        ) from error

                    # =================================================
                    # OTHER RETRYABLE ERRORS
                    # =================================================

                    retryable_statuses = {
                        500,
                        502,
                        503,
                        504,
                    }

                    if (
                        status_code
                        in retryable_statuses
                        and attempt == 0
                    ):

                        logger.warning(
                            "Groq returned HTTP %s. "
                            "Retrying in 3 seconds.",
                            status_code
                        )

                        await asyncio.sleep(3)

                        continue

                    # =================================================
                    # FINAL HTTP ERROR
                    # =================================================

                    logger.error(
                        "Groq rejected request "
                        "(HTTP %s): %s",
                        status_code,
                        provider_message[:500]
                    )

                    detail = (
                        f"Groq rejected the request "
                        f"(HTTP {status_code})."
                    )

                    if provider_message:

                        detail += (
                            f" {provider_message[:500]}"
                        )

                    raise RuntimeError(
                        detail
                    ) from error

                # ====================================================
                # JSON ERROR
                # ====================================================

                except json.JSONDecodeError as error:

                    logger.error(
                        "Failed to parse Groq JSON: %s",
                        error
                    )

                    raise RuntimeError(
                        "Groq returned invalid JSON."
                    ) from error

                # ====================================================
                # RUNTIME ERROR
                # ====================================================

                except RuntimeError:
                    raise

                # ====================================================
                # OTHER ERROR
                # ====================================================

                except Exception as error:

                    logger.exception(
                        "Unexpected Groq API error."
                    )

                    raise RuntimeError(
                        "Groq API request failed. "
                        "Check server configuration "
                        "and provider availability."
                    ) from error

        # ----------------------------------------------------
        # Should never reach here
        # ----------------------------------------------------

        raise RuntimeError(
            "Groq request failed."
        )


# ============================================================
# GLOBAL INSTANCE
# ============================================================

gemini_service = GeminiService()