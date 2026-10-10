from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional, Any, Dict

class InterviewSessionCreateRequest(BaseModel):
    blueprint_id: str
    mode: str = Field(default="text", description="text, voice, video")

class QuestionResponse(BaseModel):
    id: str
    round_id: str
    question_text: str
    question_type: str
    difficulty: str
    topic: str
    expected_concepts: List[str] = Field(default_factory=list)
    question_number: int = 1
    total_questions_in_round: int = 3

class AnswerSubmitRequest(BaseModel):
    text_answer: str = Field(..., min_length=1)
    transcript: Optional[str] = None
    duration_seconds: Optional[float] = 0.0
    mode: Optional[str] = "text"

class AnswerEvaluation(BaseModel):
    score: float = Field(..., ge=0, le=100)
    correctness: float = Field(..., ge=0, le=100)
    relevance: float = Field(..., ge=0, le=100)
    technical_depth: float = Field(..., ge=0, le=100)
    clarity: float = Field(..., ge=0, le=100)
    completeness: float = Field(..., ge=0, le=100)
    communication_observation: Optional[str] = ""
    confidence_observation: Optional[str] = ""
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    improvement_tip: str = ""
    detected_topics: List[str] = Field(default_factory=list)
    weakness_tags: List[str] = Field(default_factory=list)
    follow_up_needed: bool = False
    suggested_follow_up_direction: Optional[str] = ""

class AnswerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    question_id: str
    text_answer: str
    transcript: Optional[str] = None
    duration_seconds: float
    evaluation: AnswerEvaluation
    created_at: datetime

class InterviewRoundResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    round_type: str
    round_order: int
    status: str
    score: Optional[float] = None
    name: Optional[str] = None
    objective: Optional[str] = None
    question_count: int = 0
    completed_question_count: int = 0

class InterviewSessionDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    blueprint_id: str
    target_role: str
    status: str
    mode: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    rounds: List[InterviewRoundResponse]
    current_round: Optional[InterviewRoundResponse] = None
    current_question: Optional[QuestionResponse] = None
