from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional, Dict, Any

class RoundMetric(BaseModel):
    round_order: int
    round_type: str
    round_name: str
    score: float
    total_questions: int
    key_strengths: List[str] = Field(default_factory=list)
    areas_for_growth: List[str] = Field(default_factory=list)

class TopicMetric(BaseModel):
    topic: str
    score: float
    status: str  # strong, satisfactory, needs_practice

class OverallMetrics(BaseModel):
    readiness_score: float = Field(..., ge=0, le=100, description="Interview Readiness Practice Score (0-100)")
    technical_depth_score: float = Field(..., ge=0, le=100)
    communication_score: float = Field(..., ge=0, le=100)
    problem_solving_score: float = Field(..., ge=0, le=100)
    clarity_score: float = Field(..., ge=0, le=100)
    total_questions_answered: int = 0
    total_duration_seconds: float = 0.0
    round_metrics: List[RoundMetric] = Field(default_factory=list)
    topic_metrics: List[TopicMetric] = Field(default_factory=list)

class PracticePlanItem(BaseModel):
    topic: str
    priority: str  # High, Medium, Low
    reason: str
    suggested_actions: List[str] = Field(default_factory=list)

class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    session_id: str
    target_role: str
    overall_metrics: OverallMetrics
    weaknesses: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    practice_plan: List[PracticePlanItem] = Field(default_factory=list)
    created_at: datetime
