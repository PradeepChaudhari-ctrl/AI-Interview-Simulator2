import json
import re
from typing import Any

from backend.app.services.gemini_service import gemini_service


class MCQService:
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

        parsed = await gemini_service.generate_structured_json(
            system_prompt=(
                "You generate reliable interview multiple-choice questions. "
                "Return a JSON object with a questions array. Each question must have "
                "exactly four options and one correct_answer matching an option."
            ),
            user_prompt=prompt,
            temperature=0.5,
            model=gemini_service.fast_model,
        )

        questions = self._clean_questions(parsed)

        if not questions:
            raise RuntimeError(
                "AI did not return valid MCQs"
            )

        return questions


mcq_service = MCQService()
