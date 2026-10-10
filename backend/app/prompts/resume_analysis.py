import json

RESUME_EXTRACTION_SYSTEM_PROMPT = """You are an expert AI technical recruiter and resume parser.
Your task is to extract structured profile information from raw resume text accurately.
Return ONLY valid JSON with no markdown wrapping, no backticks, and no introductory or concluding text.

The JSON schema must strictly be:
{
  "name": "Candidate Full Name (or Candidate if not found)",
  "email": "candidate email or empty string",
  "phone": "candidate phone or empty string",
  "summary": "Brief professional summary or empty string",
  "education": [
    {
      "institution": "University / College Name",
      "degree": "Degree name e.g. B.Tech / B.S.",
      "field_of_study": "Computer Science / etc.",
      "year": "Graduation year or date range",
      "grade": "GPA / percentage or empty string"
    }
  ],
  "skills": ["skill 1", "skill 2"],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description of what was built and why",
      "technologies": ["tech 1", "tech 2"],
      "key_features": ["feature or contribution 1"],
      "outcome": "Measurable outcome or empty string"
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Timeframe e.g. 2022 - 2024",
      "description": "Brief summary",
      "key_contributions": ["bullet point 1"]
    }
  ],
  "certifications": ["certification 1"],
  "achievements": ["achievement 1"],
  "tools": ["git", "docker", "postman"],
  "keywords": ["distributed systems", "REST APIs", "machine learning"]
}

Do not hallucinate or invent qualifications not present in the text.
"""

def build_resume_extraction_prompt(raw_text: str) -> str:
    return f"""Resume Text to parse:
----------------------------------------
{raw_text[:12000]}
----------------------------------------

Extract the candidate's structured profile matching the required JSON format. Return ONLY valid JSON."""
