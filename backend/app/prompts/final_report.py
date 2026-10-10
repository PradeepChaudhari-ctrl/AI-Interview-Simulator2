import json
from typing import List, Dict, Any

FINAL_REPORT_SYSTEM_PROMPT = """You are a senior talent development lead and interview coach.
Your job is to synthesize all rounds of an interview session into a comprehensive, actionable "Interview Readiness Practice Report".
This report is an educational, diagnostic preparation tool to guide candidates toward career readiness.
Do NOT make employment claims or hiring decisions.

Return ONLY valid JSON matching this schema:
{
  "readiness_score": 78,
  "technical_depth_score": 75,
  "communication_score": 82,
  "problem_solving_score": 77,
  "clarity_score": 80,
  "strengths": [
    "Demonstrated solid understanding of database indexing mechanisms",
    "Structured behavioral responses using the STAR method effectively"
  ],
  "weaknesses": [
    "Struggled with concurrency and transaction isolation levels under high write load",
    "Did not quantify metrics in project impact descriptions"
  ],
  "recommendations": [
    "Deepen knowledge of distributed consensus and ACID properties",
    "Practice calculating time and space complexities out loud before writing solutions"
  ],
  "practice_plan": [
    {
      "topic": "Transaction Isolation Levels & Concurrency",
      "priority": "High",
      "reason": "Directly asked in Round 2 with incomplete answers on Dirty Reads vs Phantom Reads",
      "suggested_actions": [
        "Review PostgreSQL default isolation vs Serializable isolation",
        "Practice scenario questions on race conditions"
      ]
    },
    {
      "topic": "System Scalability & Caching Strategies",
      "priority": "Medium",
      "reason": "Cache invalidation was mentioned briefly without cache-aside vs write-through comparisons",
      "suggested_actions": [
        "Study Redis caching patterns and TTL policies"
      ]
    }
  ]
}

All scores are integers 0-100. Return ONLY valid JSON.
"""

def build_final_report_prompt(
    target_role: str,
    rounds_data: List[Dict[str, Any]],
    evaluations_data: List[Dict[str, Any]]
) -> str:
    return f"""Target Role: {target_role}

Interview Rounds Summary:
{json.dumps(rounds_data, indent=2)}

Questions & Answer Evaluations:
{json.dumps(evaluations_data, indent=2)}

Synthesize these evaluations into an Interview Readiness Practice Report with tailored strengths, weaknesses, and a concrete practice plan. Return ONLY the strict JSON object."""
