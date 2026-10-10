import asyncio

import httpx

from backend.app.core.config import get_settings


class ContextService:
    BASE_URL = "https://api.context.dev/v1/web/answers"

    # Context.dev organization concurrency limit ko handle karne ke liye
    _request_lock = asyncio.Lock()

    @staticmethod
    def _to_string(value) -> str:
        if value is None:
            return ""

        if isinstance(value, str):
            return value.strip()

        if isinstance(value, list):
            return "; ".join(
                str(item).strip()
                for item in value
                if item is not None
                and str(item).strip()
            )

        return str(value).strip()

    @staticmethod
    def _to_string_list(value) -> list[str]:
        if value is None:
            return []

        if isinstance(value, list):
            return [
                str(item).strip()
                for item in value
                if item is not None
                and str(item).strip()
            ]

        if isinstance(value, str):
            value = value.strip()

            if not value:
                return []

            return [value]

        return [str(value).strip()]

    async def research(
        self,
        company: str,
        role: str,
    ):
        settings = get_settings()

        api_key = getattr(
            settings,
            "CONTEXT_DEV_API_KEY",
            "",
        )

        mode = getattr(
            settings,
            "CONTEXT_DEV_MODE",
            "fast",
        )

        if not api_key:
            raise RuntimeError(
                "CONTEXT_DEV_API_KEY is not configured"
            )

        task = f"""
Research {company} for a {role} interview.

Focus on:

- publicly available company information
- engineering technologies and technical areas
- expectations for the target role
- likely interview topics
- skills candidates should prepare

Return concise, interview-focused information.
"""

        payload = {
            "mode": mode,
            "task": task,
            "json_format": {
                "company_summary": "",
                "technologies": [""],
                "role_expectations": [""],
                "interview_topics": [""],
            },
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        # =====================================================
        # IMPORTANT
        # =====================================================
        # Only ONE Context.dev request can run at a time.
        #
        # This prevents:
        #
        # Request 1 → Context.dev
        # Request 2 → Context.dev
        # Request 3 → Context.dev
        #
        # from hitting the organization concurrency limit.
        # =====================================================

        async with self._request_lock:

            async with httpx.AsyncClient(
                timeout=60.0
            ) as client:

                response = await client.post(
                    self.BASE_URL,
                    headers=headers,
                    json=payload,
                )

        if response.status_code >= 400:
            raise RuntimeError(
                f"Context.dev API error "
                f"{response.status_code}: "
                f"{response.text}"
            )

        data = response.json()

        raw_result = data.get(
            "json_content",
            {},
        )

        if not isinstance(
            raw_result,
            dict,
        ):
            raw_result = {}

        return {
            "company_summary": (
                self._to_string(
                    raw_result.get(
                        "company_summary"
                    )
                )
            ),
            "technologies": (
                self._to_string_list(
                    raw_result.get(
                        "technologies"
                    )
                )
            ),
            "role_expectations": (
                self._to_string_list(
                    raw_result.get(
                        "role_expectations"
                    )
                )
            ),
            "interview_topics": (
                self._to_string_list(
                    raw_result.get(
                        "interview_topics"
                    )
                )
            ),
        }


context_service = ContextService()