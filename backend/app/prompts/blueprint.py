import json
from typing import Optional, Dict, Any

BLUEPRINT_SYSTEM_PROMPT = """You are an elite interview architect and hiring committee chair.
Your task is to design a personalized multi-round interview blueprint customized to a candidate's target role, background, and optional Job Description.

Do NOT simply output generic rounds. Create realistic, tailored rounds that thoroughly prepare the candidate.
Each blueprint must contain 3 to 5 realistic rounds (e.g., Aptitude/Foundational, Core Discipline/CS, Technical & Projects, Behavioral/HR, or System Design/Case Study depending on role).

Return ONLY valid JSON matching this schema:
{
  "target_role": "Target Role Title",
  "experience_level": "Level e.g. Entry, Mid, Senior",
  "rounds": [
    {
      "name": "Round Title (e.g. Core Computer Science & Problem Solving)",
      "round_type": "aptitude | core | technical | behavioral | coding | case_study",
      "objective": "Clear description of the round's objective",
      "topics": ["topic 1", "topic 2", "topic 3"],
      "question_count": 3,
      "difficulty": "easy | medium | hard | adaptive",
      "time_limit_minutes": 15,
      "allowed_modes": ["text", "voice", "video"],
      "evaluation_criteria": ["criteria 1", "criteria 2"]
    }
  ]
}

No markdown formatting, no backticks, no extra text.
"""

def build_blueprint_prompt(
    target_role: str,
    experience_level: Optional[str] = None,
    candidate_profile: Optional[Dict[str, Any]] = None,
    jd_text: Optional[str] = None,
    template_type: Optional[str] = None
) -> str:
    profile_summary = ""
    if candidate_profile:
        skills = candidate_profile.get("skills", [])
        projects = [p.get("name") for p in candidate_profile.get("projects", [])]
        tools = candidate_profile.get("tools", [])
        profile_summary = (
            f"Candidate Skills: {', '.join(skills)}\n"
            f"Candidate Projects: {', '.join(projects)}\n"
            f"Candidate Tools: {', '.join(tools)}\n"
        )
    
    jd_summary = f"\nTarget Job Description:\n{jd_text[:3000]}\n" if jd_text else "\nNo specific JD provided.\n"
    template_info = f"\nRequested Template Style: {template_type}\n" if template_type else ""

    return f"""Target Role: {target_role}
Experience Level: {experience_level or 'Entry / Mid-level'}
{template_info}
{profile_summary}
{jd_summary}

Design the optimal multi-round interview blueprint. Return ONLY the strict JSON object."""
