from fastapi import APIRouter, HTTPException

from backend.app.schemas.mcq import (
    MCQGenerateRequest,
    MCQGenerateResponse,
)

from backend.app.services.mcq_service import (
    mcq_service,
)


router = APIRouter(
    prefix="/api/mcq",
    tags=["MCQ Practice"],
)


@router.post(
    "/generate",
    response_model=MCQGenerateResponse,
)
async def generate_mcqs(
    request: MCQGenerateRequest,
):

    try:

        questions = await mcq_service.generate_questions(
            company=request.company,
            role=request.role,
            topic=request.topic,
            difficulty=request.difficulty,
            count=request.count,
        )

        return {
            "questions": questions
        }

    except Exception as error:

        raise HTTPException(
            status_code=502,
            detail=str(error),
        )