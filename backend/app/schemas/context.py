from pydantic import BaseModel, Field


class ContextResearchRequest(BaseModel):
    company: str = Field(..., min_length=1, max_length=100)
    role: str = Field(..., min_length=1, max_length=150)


class ContextResearchResponse(BaseModel):
    company_summary: str = ""
    technologies: list[str] = []
    role_expectations: list[str] = []
    interview_topics: list[str] = []
