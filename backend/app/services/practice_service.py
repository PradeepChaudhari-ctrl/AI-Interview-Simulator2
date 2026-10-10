import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.models import PracticeSession, Report
from backend.app.schemas.practice import (
    PracticeCreateRequest,
    PracticeAnswerSubmitRequest,
    PracticeSessionResponse,
    PracticeQuestion,
    PracticeAnswerItem,
)
from backend.app.prompts.practice_generation import (
    PRACTICE_SYSTEM_PROMPT,
    build_practice_generation_prompt,
    PRACTICE_EVALUATION_PROMPT,
    build_practice_eval_prompt,
)
from backend.app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

async def create_practice_session(
    request: PracticeCreateRequest,
    user_id: str,
    db: Session
) -> PracticeSessionResponse:
    prompt = build_practice_generation_prompt(
        topic=request.topic,
        target_role=request.target_role or "Software Engineer",
        difficulty=request.difficulty or "medium"
    )

    try:
        raw_practice = await gemini_service.generate_structured_json(
            system_prompt=PRACTICE_SYSTEM_PROMPT,
            user_prompt=prompt,
            temperature=0.3
        )
        questions = [PracticeQuestion(**q) for q in raw_practice.get("questions", [])]
        if not questions:
            raise ValueError("Gemini returned no practice questions.")
    except Exception as e:
        logger.error("Practice generation failed (%s).", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Practice question generation failed. Please retry."
        ) from e

    session_data = {
        "questions": [q.model_dump() for q in questions],
        "answers": []
    }

    db_practice = PracticeSession(
        user_id=user_id,
        source_report_id=request.source_report_id,
        topic=request.topic,
        status="in_progress",
        score=None,
        qa_json=json.dumps(session_data)
    )
    db.add(db_practice)
    db.commit()
    db.refresh(db_practice)

    return PracticeSessionResponse(
        id=db_practice.id,
        topic=db_practice.topic,
        status=db_practice.status,
        score=db_practice.score,
        source_report_id=db_practice.source_report_id,
        questions=questions,
        answers=[],
        created_at=db_practice.created_at
    )

async def submit_practice_answer(
    practice_id: str,
    request: PracticeAnswerSubmitRequest,
    user_id: str,
    db: Session
) -> PracticeSessionResponse:
    practice = db.query(PracticeSession).filter(
        PracticeSession.id == practice_id,
        PracticeSession.user_id == user_id
    ).first()

    if not practice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Practice session not found.")

    data = json.loads(practice.qa_json or '{"questions":[], "answers":[]}')
    questions = data.get("questions", [])
    answers = data.get("answers", [])

    target_q = next((q for q in questions if q["id"] == request.question_id), None)
    if not target_q:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found in this practice session.")

    # Evaluate practice answer via Gemini
    prompt = build_practice_eval_prompt(
        question_text=target_q["question_text"],
        concept_tested=target_q.get("concept_tested", practice.topic),
        user_answer=request.answer_text
    )

    try:
        eval_raw = await gemini_service.generate_structured_json(
            system_prompt=PRACTICE_EVALUATION_PROMPT,
            user_prompt=prompt,
            temperature=0.1
        )
        score = float(eval_raw["score"])
        feedback = eval_raw["feedback"]
        ideal_concepts = eval_raw["ideal_concepts"]
    except Exception as e:
        logger.error("Practice answer evaluation failed (%s).", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Practice answer evaluation failed. Your answer was not saved; please retry."
        ) from e

    new_answer = {
        "question_id": target_q["id"],
        "question_text": target_q["question_text"],
        "user_answer": request.answer_text,
        "feedback": feedback,
        "score": score,
        "ideal_concepts": ideal_concepts
    }

    # Replace if exists or append
    answers = [a for a in answers if a["question_id"] != target_q["id"]]
    answers.append(new_answer)
    data["answers"] = answers

    # Check if all questions answered
    if len(answers) >= len(questions) and len(questions) > 0:
        practice.status = "completed"
        practice.score = round(sum(a["score"] for a in answers) / len(answers), 1)

    practice.qa_json = json.dumps(data)
    db.commit()
    db.refresh(practice)

    return PracticeSessionResponse(
        id=practice.id,
        topic=practice.topic,
        status=practice.status,
        score=practice.score,
        source_report_id=practice.source_report_id,
        questions=[PracticeQuestion(**q) for q in questions],
        answers=[PracticeAnswerItem(**a) for a in answers],
        created_at=practice.created_at
    )

def get_practice_history(user_id: str, db: Session) -> List[PracticeSessionResponse]:
    sessions = (
        db.query(PracticeSession)
        .filter(PracticeSession.user_id == user_id)
        .order_by(PracticeSession.created_at.desc())
        .all()
    )

    result = []
    for s in sessions:
        data = json.loads(s.qa_json or '{"questions":[], "answers":[]}')
        result.append(PracticeSessionResponse(
            id=s.id,
            topic=s.topic,
            status=s.status,
            score=s.score,
            source_report_id=s.source_report_id,
            questions=[PracticeQuestion(**q) for q in data.get("questions", [])],
            answers=[PracticeAnswerItem(**a) for a in data.get("answers", [])],
            created_at=s.created_at
        ))
    return result
