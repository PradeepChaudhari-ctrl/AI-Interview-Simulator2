import json
from typing import List, Dict, Any, Optional

EVALUATION_SYSTEM_PROMPT = """You are an objective, encouraging, and rigorous senior technical interviewer evaluating a candidate's answer.
Your evaluation must be based strictly on technical accuracy, problem-solving structure, relevance, and communication clarity.
Do NOT make assumptions or psychological diagnoses.
Give balanced, constructive feedback that helps the candidate improve.

Return ONLY valid JSON matching this schema:
{
  "score": 82,
  "correctness": 85,
  "relevance": 90,
  "technical_depth": 75,
  "clarity": 80,
  "completeness": 80,
  "communication_observation": "Clear structure, explained core concepts well, could be more concise on tradeoffs.",
  "confidence_observation": "Sound technical articulation and positive delivery.",
  "strengths": ["Clear explanation of indexing", "Mentioned B-Trees"],
  "weaknesses": ["Missed write penalty of secondary indexes"],
  "improvement_tip": "Next time, explicitly state how indexing impacts insert/update throughput alongside read speed.",
  "detected_topics": ["Databases", "Indexing", "Query Optimization"],
  "weakness_tags": ["Database Write Latency", "Index Overhead"],
  "follow_up_needed": true,
  "suggested_follow_up_direction": "Ask about how write performance is affected when adding composite indexes"
}

All scores are integers from 0 to 100.
If the candidate's answer is strong (>80), follow_up_needed can be true to explore deeper architecture or trade-offs.
If the answer is weak (<50), mark specific weakness_tags so the system can schedule targeted practice.
Return ONLY valid JSON.
"""

def build_answer_evaluation_prompt(
    question_text: str,
    question_topic: str,
    expected_concepts: List[str],
    candidate_answer: str,
    target_role: str,
    mode: str = "text"
) -> str:
    return f"""Target Role: {target_role}
Interview Mode: {mode}
Question: {question_text}
Topic: {question_topic}
Expected Key Concepts: {', '.join(expected_concepts)}

Candidate's Answer:
\"\"\"{candidate_answer}\"\"\"

Evaluate this response rigorously and objectively. Return ONLY the strict JSON object."""
