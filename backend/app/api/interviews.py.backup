import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import (
    User,
    InterviewSession,
    InterviewRound,
    Question,
    Answer,
    InterviewBlueprint,
)
from backend.app.schemas.interview import (
    InterviewSessionCreateRequest,
    InterviewSessionDetailResponse,
    InterviewRoundResponse,
    QuestionResponse,
    AnswerSubmitRequest,
    AnswerResponse,
    AnswerEvaluation,
)
from backend.app.services.auth_service import get_current_user
from backend.app.services.interview_service import (
    create_interview_session,
    get_or_generate_current_question,
    submit_answer_and_evaluate,
)

router = APIRouter(tags=["Interviews"])

@router.post("/api/interviews", response_model=InterviewSessionDetailResponse, status_code=status.HTTP_201_CREATED)
async def start_interview(
    request: InterviewSessionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = await create_interview_session(request, current_user.id, db)
    return await get_session_details(session.id, current_user, db)

@router.get("/api/interviews", response_model=List[InterviewSessionDetailResponse])
async def list_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.started_at.desc())
        .all()
    )
    results = []
    for s in sessions:
        results.append(await get_session_details(s.id, current_user, db))
    return results

@router.get("/api/interviews/{id}", response_model=InterviewSessionDetailResponse)
async def get_session_details(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == id,
        InterviewSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    blueprint = db.query(InterviewBlueprint).filter(InterviewBlueprint.id == session.blueprint_id).first()
    blueprint_data = json.loads(blueprint.blueprint_json) if blueprint else {"rounds": []}
    rounds_config = blueprint_data.get("rounds", [])

    rounds = db.query(InterviewRound).filter(InterviewRound.session_id == session.id).order_by(InterviewRound.round_order).all()

    round_responses: List[InterviewRoundResponse] = []
    current_round_resp: Optional[InterviewRoundResponse] = None

    for r in rounds:
        round_cfg = rounds_config[r.round_order - 1] if (r.round_order - 1) < len(rounds_config) else {}
        total_q = round_cfg.get("question_count", 3)
        completed_q = db.query(Answer).join(Question).filter(Question.round_id == r.id).count()

        resp = InterviewRoundResponse(
            id=r.id,
            round_type=r.round_type,
            round_order=r.round_order,
            status=r.status,
            score=r.score,
            name=round_cfg.get("name", r.round_type.title()),
            objective=round_cfg.get("objective", ""),
            question_count=total_q,
            completed_question_count=completed_q
        )
        round_responses.append(resp)
        if r.status == "in_progress" and not current_round_resp:
            current_round_resp = resp

    # Get active or next question if in progress
    current_q_resp = None
    if session.status == "in_progress":
        q_obj, q_num, total_in_round = await get_or_generate_current_question(session.id, current_user.id, db)
        if q_obj:
            meta = json.loads(q_obj.metadata_json or "{}")
            current_q_resp = QuestionResponse(
                id=q_obj.id,
                round_id=q_obj.round_id,
                question_text=q_obj.question_text,
                question_type=q_obj.question_type,
                difficulty=q_obj.difficulty,
                topic=q_obj.topic,
                expected_concepts=meta.get("expected_concepts", []),
                question_number=q_num,
                total_questions_in_round=total_in_round
            )

    return InterviewSessionDetailResponse(
        id=session.id,
        blueprint_id=session.blueprint_id,
        target_role=blueprint.target_role if blueprint else "Interview",
        status=session.status,
        mode=session.mode,
        started_at=session.started_at,
        completed_at=session.completed_at,
        rounds=round_responses,
        current_round=current_round_resp,
        current_question=current_q_resp
    )

@router.post("/api/interviews/{id}/next-question", response_model=Optional[QuestionResponse])
async def next_question(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q_obj, q_num, total_in_round = await get_or_generate_current_question(id, current_user.id, db)
    if not q_obj:
        return None

    meta = json.loads(q_obj.metadata_json or "{}")
    return QuestionResponse(
        id=q_obj.id,
        round_id=q_obj.round_id,
        question_text=q_obj.question_text,
        question_type=q_obj.question_type,
        difficulty=q_obj.difficulty,
        topic=q_obj.topic,
        expected_concepts=meta.get("expected_concepts", []),
        question_number=q_num,
        total_questions_in_round=total_in_round
    )

@router.post("/api/questions/{id}/answer", response_model=AnswerResponse)
async def submit_answer(
    id: str,
    request: AnswerSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find session from question
    question = db.query(Question).filter(Question.id == id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    round_obj = db.query(InterviewRound).filter(InterviewRound.id == question.round_id).first()
    if not round_obj:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview round not found.")

    answer, evaluation, is_completed = await submit_answer_and_evaluate(
        session_id=round_obj.session_id,
        question_id=question.id,
        request=request,
        user_id=current_user.id,
        db=db
    )

    return AnswerResponse(
        id=answer.id,
        question_id=answer.question_id,
        text_answer=answer.text_answer,
        transcript=answer.transcript,
        duration_seconds=answer.duration_seconds,
        evaluation=evaluation,
        created_at=answer.created_at
    )

@router.post("/api/interviews/{id}/complete", response_model=InterviewSessionDetailResponse)
async def complete_interview(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(InterviewSession).filter(
        InterviewSession.id == id,
        InterviewSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    session.status = "completed"
    session.completed_at = datetime.now(timezone.utc)
    db.commit()

    return await get_session_details(session.id, current_user, db)
