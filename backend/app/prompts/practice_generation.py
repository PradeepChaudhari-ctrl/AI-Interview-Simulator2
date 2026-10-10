import json
from typing import List, Dict, Any, Optional

PRACTICE_SYSTEM_PROMPT = """You are an interactive AI tutor and technical drill coach.
Your job is to generate rapid, focused practice questions that help a candidate master a specific weakness identified during an interview.

Questions should be concise, scenario-based or conceptual drills with actionable hints.

Return ONLY valid JSON matching this schema:
{
  "topic": "Topic Name",
  "questions": [
    {
      "id": "q1",
      "question_text": "Brief scenario or targeted concept question",
      "concept_tested": "Core concept",
      "hint": "Useful hint if candidate is stuck",
      "difficulty": "medium"
    },
    {
      "id": "q2",
      "question_text": "Second targeted question",
      "concept_tested": "Trade-off or application",
      "hint": "Useful hint",
      "difficulty": "medium"
    },
    {
      "id": "q3",
      "question_text": "Third targeted question",
      "concept_tested": "Common pitfall",
      "hint": "Useful hint",
      "difficulty": "hard"
    }
  ]
}

No markdown formatting, no backticks.
"""

def build_practice_generation_prompt(
    topic: str,
    target_role: str,
    difficulty: str = "medium"
) -> str:
    return f"""Target Role: {target_role}
Weakness / Practice Topic: {topic}
Target Difficulty: {difficulty}

Generate 3 targeted, rapid practice questions to help the candidate master this specific topic. Return ONLY the strict JSON object."""

PRACTICE_EVALUATION_PROMPT = """You are a supportive tutor evaluating a candidate's answer to a practice drill question.
Provide clear feedback, key missing concepts, and a score (0-100).

Return ONLY valid JSON matching this schema:
{
  "score": 85,
  "feedback": "Concise constructive explanation of what was right and what to remember.",
  "ideal_concepts": ["concept 1", "concept 2"]
}
"""

def build_practice_eval_prompt(
    question_text: str,
    concept_tested: str,
    user_answer: str
) -> str:
    return f"""Question: {question_text}
Concept Tested: {concept_tested}
Candidate's Answer:
\"\"\"{user_answer}\"\"\"

Evaluate the answer. Return ONLY the strict JSON object."""
