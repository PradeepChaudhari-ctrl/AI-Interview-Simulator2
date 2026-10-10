from pydantic import BaseModel, Field


class MCQGenerateRequest(BaseModel):
    company: str = Field(
        ...,
        min_length=1,
        max_length=150,
    )

    role: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    topic: str = Field(
        ...,
        min_length=1,
        max_length=1000,
    )

    difficulty: str = Field(
        ...,
        min_length=1,
        max_length=20,
    )

    count: int = Field(
        default=5,
        ge=1,
        le=10,
    )


class MCQQuestion(BaseModel):
    question: str
    options: list[str]
    correct_answer: str
    explanation: str


class MCQGenerateResponse(BaseModel):
    questions: list[MCQQuestion]