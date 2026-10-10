from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional

class BlueprintRound(BaseModel):
    name: str
    round_type: str = Field(..., description="aptitude, core, technical, behavioral, coding, case_study")
    objective: str
    topics: List[str] = Field(default_factory=list)
    question_count: int = Field(default=3, ge=1, le=10)
    difficulty: str = Field(default="medium", description="easy, medium, hard, adaptive")
    time_limit_minutes: int = Field(default=15, ge=5, le=60)
    allowed_modes: List[str] = Field(default=["text", "voice", "video"])
    evaluation_criteria: List[str] = Field(default_factory=list)

class BlueprintData(BaseModel):
    target_role: str
    experience_level: Optional[str] = "Entry / Mid-level"
    rounds: List[BlueprintRound]

class BlueprintGenerateRequest(BaseModel):
    target_role: str = Field(..., min_length=2)
    resume_id: Optional[str] = None
    jd_text: Optional[str] = None
    template_type: Optional[str] = None  # software_developer, data_analyst, campus_placement, custom
    experience_level: Optional[str] = "Entry to Mid-Level"
    preferred_language: Optional[str] = "English"

class BlueprintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    target_role: str
    resume_id: Optional[str] = None
    jd_text: Optional[str] = None
    blueprint: BlueprintData
    created_at: datetime
