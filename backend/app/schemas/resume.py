from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional, Any, Dict

class EducationItem(BaseModel):
    institution: Optional[str] = ""
    degree: Optional[str] = ""
    field_of_study: Optional[str] = ""
    year: Optional[str] = ""
    grade: Optional[str] = ""

class ExperienceItem(BaseModel):
    company: Optional[str] = ""
    role: Optional[str] = ""
    duration: Optional[str] = ""
    description: Optional[str] = ""
    key_contributions: List[str] = Field(default_factory=list)

class ProjectItem(BaseModel):
    name: str
    description: Optional[str] = ""
    technologies: List[str] = Field(default_factory=list)
    key_features: List[str] = Field(default_factory=list)
    outcome: Optional[str] = ""

class ParsedProfile(BaseModel):
    name: str = "Candidate"
    email: Optional[str] = ""
    phone: Optional[str] = ""
    summary: Optional[str] = ""
    education: List[EducationItem] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    achievements: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)

class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    original_filename: str
    parsed_profile: ParsedProfile
    created_at: datetime

class ResumeUpdateRequest(BaseModel):
    parsed_profile: ParsedProfile
