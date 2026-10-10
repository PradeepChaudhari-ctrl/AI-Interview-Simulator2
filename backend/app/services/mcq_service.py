import json
import re
from typing import Any

from backend.app.core.config import get_settings


class MCQService:
    def __init__(self):
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    @staticmethod
    def _extract_json(text: str) -> dict[str, Any]:
        text = text.strip()

        # Remove markdown code fences if model adds them
        text = re.sub(r"^```json\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"^```\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try extracting the first JSON object
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

        raise ValueError("AI returned invalid JSON")


    @staticmethod
    def _clean_questions(data: dict[str, Any]) -> list[dict[str, Any]]:
        questions = data.get("questions", [])

        if not isinstance(questions, list):
            return []

        cleaned = []

        for question in questions:
            if not isinstance(question, dict):
                continue

            text = str(question.get("question", "")).strip()
            options = question.get("options", [])
            correct_answer = str(
                question.get("correct_answer", "")
            ).strip()
            explanation = str(
                question.get("explanation", "")
            ).strip()

            if not text:
                continue

            if not isinstance(options, list):
                continue

            options = [
                str(option).strip()
                for option in options
                if option is not None and str(option).strip()
            ]

            if len(options) != 4:
                continue

            if not correct_answer:
                continue

            # Make sure answer is one of the four options
            if correct_answer not in options:
                # Also support A/B/C/D returned by the model
                index_map = {
                    "A": 0,
                    "B": 1,
                    "C": 2,
                    "D": 3,
                }

                if correct_answer.upper() in index_map:
                    index = index_map[correct_answer.upper()]
                    correct_answer = options[index]
                else:
                    continue

            cleaned.append(
                {
                    "question": text,
                    "options": options,
                    "correct_answer": correct_answer,
                    "explanation": explanation,
                }
            )

        return cleaned


    async def generate_questions(
        self,
        company: str,
        role: str,
        topic: str,
        difficulty: str,
        count: int = 5,
    ) -> list[dict[str, Any]]:

        settings = get_settings()

        api_key = getattr(settings, "GROQ_API_KEY", "")
        model = getattr(
            settings,
            "GROQ_MODEL",
            "openai/gpt-oss-20b",
        )

        if not api_key:
            raise RuntimeError(
                "GROQ_API_KEY is not configured"
            )

        difficulty = difficulty.strip().lower()

        allowed_difficulties = {
            "easy",
            "medium",
            "hard",
        }

        if difficulty not in allowed_difficulties:
            raise ValueError(
                "Difficulty must be Easy, Medium, or Hard"
            )

        count = max(1, min(count, 10))

        prompt = f"""
You are an expert technical interview question generator.

Generate exactly {count} high-quality multiple-choice questions.

Interview context:
Company: {company}
Role: {role}
Topic/Skill: {topic}
Difficulty: {difficulty}

IMPORTANT:
- Every question must be MCQ.
- Every question must have exactly 4 options.
- Only ONE option must be correct.
- Questions must be relevant to the selected topic.
- Questions should be appropriate for the selected difficulty.
- Avoid duplicate questions.
- Avoid ambiguous questions.
- Do not require the candidate to write code.
- Do not include answers outside the JSON.
- Keep explanations concise but useful.

Return ONLY valid JSON in exactly this structure:

{{
  "questions": [
    {{
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": "Option A",
      "explanation": "Short explanation of why the answer is correct."
    }}
  ]
}}
"""

        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You generate reliable interview MCQs "
                        "and MUST return valid JSON only."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            "temperature": 0.5,
            "max_completion_tokens": 2500,
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        import httpx

        async with httpx.AsyncClient(
            timeout=60.0
        ) as client:

            response = await client.post(
                self.base_url,
                headers=headers,
                json=payload,
            )

        if response.status_code >= 400:
            raise RuntimeError(
                f"Groq API error {response.status_code}: "
                f"{response.text}"
            )

        data = response.json()

        choices = data.get("choices", [])

        if not choices:
            raise RuntimeError(
                "Groq returned no choices"
            )

        content = (
            choices[0]
            .get("message", {})
            .get("content", "")
        )

        if not content:
            raise RuntimeError(
                "Groq returned empty response"
            )

        parsed = self._extract_json(content)

        questions = self._clean_questions(parsed)

        if not questions:
            raise RuntimeError(
                "AI did not return valid MCQs"
            )

        return questions


mcq_service = MCQService()