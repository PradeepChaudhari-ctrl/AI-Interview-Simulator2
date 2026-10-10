import json
from typing import List, Dict, Any, Optional

QUESTION_SYSTEM_PROMPT = """You are an experienced technical and behavioral interviewer at a top technology company.
Your goal is to conduct an authentic, probing, yet constructive interview.
You generate realistic interview questions for a specific round of an interview blueprint.

When generating technical and project questions:
- Reference the candidate's actual projects, technologies, and skills extracted from their resume.
- Ground your questions in real-world scenarios, architectural trade-offs, and debugging.
- Never invent facts about the candidate that are not in the profile.

Return ONLY valid JSON matching this schema:
{
  "question": "The interview question text clearly worded for the candidate",
  "type": "conceptual | practical | behavioral | coding | follow_up",
  "topic": "The specific topic or project tested",
  "difficulty": "easy | medium | hard",
  "expected_concepts": ["concept or keyword 1", "concept or keyword 2"]
}
No markdown formatting, no backticks.
"""

def build_question_prompt(
    round_name: str,
    round_type: str,
    round_objective: str,
    topics: List[str],
    difficulty: str,
    target_role: str,
    candidate_profile: Optional[Dict[str, Any]] = None,
    previous_questions: Optional[List[str]] = None,
    question_index: int = 1,
    total_questions: int = 3
) -> str:
    profile_text = ""
    if candidate_profile:
        profile_text = (
            f"Candidate Name: {candidate_profile.get('name', 'Candidate')}\n"
            f"Skills: {', '.join(candidate_profile.get('skills', []))}\n"
            f"Tools: {', '.join(candidate_profile.get('tools', []))}\n"
            f"Projects: {json.dumps(candidate_profile.get('projects', []), indent=1)}\n"
            f"Experience: {json.dumps(candidate_profile.get('experience', []), indent=1)}\n"
        )
    
    prev_q_text = ""
    if previous_questions:
        prev_q_text = f"Already Asked Questions in this round (DO NOT REPEAT):\n- " + "\n- ".join(previous_questions) + "\n"

    return f"""Target Role: {target_role}
Current Round: {round_name} (Type: {round_type})
Round Objective: {round_objective}
Topics to cover: {', '.join(topics)}
Target Difficulty: {difficulty}
Question Number: {question_index} of {total_questions}

Candidate Background:
{profile_text}

{prev_q_text}

Generate question #{question_index} for this candidate. Ground it in the candidate's actual experience and the round topic. Return ONLY the strict JSON object."""
