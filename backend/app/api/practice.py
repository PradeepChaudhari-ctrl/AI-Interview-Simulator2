from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import User
from backend.app.schemas.practice import (
    PracticeCreateRequest,
    PracticeAnswerSubmitRequest,
    PracticeSessionResponse,
)
from backend.app.services.auth_service import get_current_user
from backend.app.services.practice_service import (
    create_practice_session,
    submit_practice_answer,
    get_practice_history,
)

router = APIRouter(prefix="/api/practice", tags=["Practice"])

@router.post("", response_model=PracticeSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_practice(
    request: PracticeCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await create_practice_session(request, current_user.id, db)

@router.post("/{id}/answer", response_model=PracticeSessionResponse)
async def answer_practice_question(
    id: str,
    request: PracticeAnswerSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await submit_practice_answer(id, request, current_user.id, db)

@router.get("/history", response_model=List[PracticeSessionResponse])
def list_practice_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_practice_history(current_user.id, db)
