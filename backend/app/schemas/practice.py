from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional

class PracticeQuestion(BaseModel):
    id: str
    question_text: str
    concept_tested: str
    hint: Optional[str] = ""
    difficulty: str = "medium"

class PracticeAnswerItem(BaseModel):
    question_id: str
    question_text: str
    user_answer: str
    feedback: str
    score: float
    ideal_concepts: List[str] = Field(default_factory=list)

class PracticeCreateRequest(BaseModel):
    topic: str = Field(..., min_length=2)
    source_report_id: Optional[str] = None
    target_role: Optional[str] = "Software Engineer"
    difficulty: Optional[str] = "medium"

class PracticeAnswerSubmitRequest(BaseModel):
    question_id: str
    answer_text: str = Field(..., min_length=1)

class PracticeSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    topic: str
    status: str
    score: Optional[float] = None
    source_report_id: Optional[str] = None
    questions: List[PracticeQuestion] = Field(default_factory=list)
    answers: List[PracticeAnswerItem] = Field(default_factory=list)
    created_at: datetime
