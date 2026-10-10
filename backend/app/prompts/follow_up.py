from typing import List, Dict, Any


ADAPTIVE_QUESTION_SYSTEM_PROMPT = """You are an adaptive technical interviewer.

Your task is to generate exactly ONE next interview question based on the candidate's previous answer and evaluation.

Follow these rules:
- If the previous answer score is 80 or higher:
  Increase difficulty and probe deeper into architecture, trade-offs, edge cases, scalability, or failure scenarios.
- If the previous answer score is between 50 and 79:
  Ask a focused clarification or practical application question targeting the missing concept.
- If the previous answer score is below 50:
  Ask a simpler foundational question about the same topic.

OUTPUT REQUIREMENTS:
- Return exactly ONE JSON object.
- Return JSON only.
- Do NOT return markdown.
- Do NOT use code fences.
- Do NOT add explanations before or after the JSON.
- The JSON must contain exactly these five fields:
  question, type, topic, difficulty, expected_concepts

The allowed values for "type" are:
- "follow_up"
- "conceptual"
- "practical"
- "coding"

The allowed values for "difficulty" are:
- "easy"
- "medium"
- "hard"

"expected_concepts" must be a JSON array of strings.

Example of the required output format:
{
  "question": "How would you improve the scalability of this approach?",
  "type": "follow_up",
  "topic": "Scalability",
  "difficulty": "hard",
  "expected_concepts": ["horizontal scaling", "caching", "load balancing"]
}
"""


def build_adaptive_question_prompt(
    previous_question: str,
    candidate_answer: str,
    evaluation: Dict[str, Any],
    round_name: str,
    round_type: str,
    round_topics: List[str],
    current_difficulty: str,
    question_index: int,
    total_questions: int,
    target_role: str
) -> str:

    score = evaluation.get("score", 70)
    direction = evaluation.get("suggested_follow_up_direction", "")
    weaknesses = evaluation.get("weaknesses", [])
    strengths = evaluation.get("strengths", [])

    return f"""Generate the next adaptive interview question.

Target Role: {target_role}
Round: {round_name} ({round_type})
Question {question_index} of {total_questions}
Current Difficulty: {current_difficulty}

Round Topics:
{', '.join(round_topics)}

Previous Question:
{previous_question}

Candidate Answer:
{candidate_answer}

Evaluation:
Score: {score}/100
Strengths: {', '.join(strengths)}
Weaknesses / Gaps: {', '.join(weaknesses)}
Follow-up recommendation: {direction}

IMPORTANT OUTPUT RULES:
Return ONLY one valid JSON object.

The JSON must have exactly these fields:
"question"
"type"
"topic"
"difficulty"
"expected_concepts"

"type" must be exactly one of:
"follow_up", "conceptual", "practical", "coding"

"difficulty" must be exactly one of:
"easy", "medium", "hard"

"expected_concepts" must be an array of strings.

Do not include markdown.
Do not include ``` .
Do not include any text outside the JSON object.
"""