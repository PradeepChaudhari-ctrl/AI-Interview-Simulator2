import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.models import (
    InterviewSession,
    InterviewRound,
    Question,
    Answer,
    InterviewBlueprint,
    Resume,
    Report,
    PracticeSession,
)
from backend.app.schemas.interview import (
    InterviewSessionCreateRequest,
    AnswerSubmitRequest,
    AnswerEvaluation,
    QuestionResponse,
    InterviewRoundResponse,
    InterviewSessionDetailResponse,
)
from backend.app.prompts.question_generation import (
    QUESTION_SYSTEM_PROMPT,
    build_question_prompt,
)
from backend.app.prompts.follow_up import (
    ADAPTIVE_QUESTION_SYSTEM_PROMPT,
    build_adaptive_question_prompt,
)
from backend.app.prompts.answer_evaluation import (
    EVALUATION_SYSTEM_PROMPT,
    build_answer_evaluation_prompt,
)
from backend.app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

def get_candidate_profile(blueprint: InterviewBlueprint, db: Session) -> Optional[Dict[str, Any]]:
    if blueprint.resume_id:
        resume = db.query(Resume).filter(Resume.id == blueprint.resume_id).first()
        if resume and resume.parsed_profile_json:
            try:
                return json.loads(resume.parsed_profile_json)
            except Exception:
                pass
    return None

async def create_interview_session(
    request: InterviewSessionCreateRequest,
    user_id: str,
    db: Session
) -> InterviewSession:
    blueprint = db.query(InterviewBlueprint).filter(
        InterviewBlueprint.id == request.blueprint_id,
        InterviewBlueprint.user_id == user_id
    ).first()

    if not blueprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview blueprint not found or unauthorized."
        )

    blueprint_data = json.loads(blueprint.blueprint_json)
    rounds_config = blueprint_data.get("rounds", [])

    if not rounds_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Blueprint has no configured rounds."
        )

    # Create interview session
    session = InterviewSession(
        user_id=user_id,
        blueprint_id=blueprint.id,
        status="in_progress",
        mode=request.mode or "text",
        started_at=datetime.now(timezone.utc)
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    # Initialize interview rounds
    for index, r in enumerate(rounds_config):
        round_status = "in_progress" if index == 0 else "pending"
        interview_round = InterviewRound(
            session_id=session.id,
            round_type=r.get("round_type", "technical"),
            round_order=index + 1,
            status=round_status,
            score=None
        )
        db.add(interview_round)
    db.commit()
    db.refresh(session)

    return session

async def get_or_generate_current_question(
    session_id: str,
    user_id: str,
    db: Session
) -> Tuple[Optional[Question], int, int]:
    """
    Finds the active round and either returns the pending unanswered question
    or adaptively generates the next question.
    Returns: (question, current_question_number, total_questions_in_round)
    """
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found.")

    if session.status == "completed":
        return None, 0, 0

    # Find the current active round
    active_round = db.query(InterviewRound).filter(
        InterviewRound.session_id == session.id,
        InterviewRound.status == "in_progress"
    ).order_by(InterviewRound.round_order).first()

    if not active_round:
        # Check if there is a pending round to activate
        pending_round = db.query(InterviewRound).filter(
            InterviewRound.session_id == session.id,
            InterviewRound.status == "pending"
        ).order_by(InterviewRound.round_order).first()

        if pending_round:
            pending_round.status = "in_progress"
            db.commit()
            active_round = pending_round
        else:
            # All rounds complete!
            session.status = "completed"
            session.completed_at = datetime.now(timezone.utc)
            db.commit()
            return None, 0, 0

    # Get blueprint config for this round
    blueprint = db.query(InterviewBlueprint).filter(InterviewBlueprint.id == session.blueprint_id).first()
    blueprint_data = json.loads(blueprint.blueprint_json)
    rounds_config = blueprint_data.get("rounds", [])
    
    round_index = active_round.round_order - 1
    round_config = rounds_config[round_index] if round_index < len(rounds_config) else {}

    target_question_count = round_config.get("question_count", 3)
    round_name = round_config.get("name", active_round.round_type.title())
    round_objective = round_config.get("objective", "Evaluate candidate skills")
    topics = round_config.get("topics", [active_round.round_type])
    base_difficulty = round_config.get("difficulty", "medium")

    # Get existing questions for this round
    existing_questions = db.query(Question).filter(Question.round_id == active_round.id).all()

    # Check if there is an existing unanswered question
    for q in existing_questions:
        answered = db.query(Answer).filter(Answer.question_id == q.id).first()
        if not answered:
            return q, len(existing_questions), target_question_count

    # If all target questions for this round have been answered, complete this round and recurse
    if len(existing_questions) >= target_question_count:
        active_round.status = "completed"
        # Calculate round average score
        answers = (
            db.query(Answer)
            .join(Question)
            .filter(Question.round_id == active_round.id)
            .all()
        )
        scores = []
        for ans in answers:
            try:
                ev = json.loads(ans.evaluation_json)
                scores.append(float(ev["score"]))
            except Exception:
                pass
        active_round.score = round(sum(scores) / len(scores), 1) if scores else None
        db.commit()

        # Recurse to move to next round
        return await get_or_generate_current_question(session_id, user_id, db)

    # Otherwise, generate the next question adaptively!
    current_q_num = len(existing_questions) + 1
    candidate_profile = get_candidate_profile(blueprint, db)
    previous_question_texts = [q.question_text for q in existing_questions]

    # Adaptive follow-up logic if there was a previous answer in this round
    last_answered_q = existing_questions[-1] if existing_questions else None
    last_answer = (
        db.query(Answer).filter(Answer.question_id == last_answered_q.id).first()
        if last_answered_q else None
    )

    new_q_data = None

    if last_answer and last_answer.evaluation_json:
        try:
            last_eval = json.loads(last_answer.evaluation_json)
            last_score = float(last_eval["score"])
            
            # Rule-based difficulty progression policy
            if last_score >= 80:
                adjusted_difficulty = "hard"
            elif last_score < 50:
                adjusted_difficulty = "easy"
            else:
                adjusted_difficulty = base_difficulty

            follow_up_prompt = build_adaptive_question_prompt(
                previous_question=last_answered_q.question_text,
                candidate_answer=last_answer.text_answer,
                evaluation=last_eval,
                round_name=round_name,
                round_type=active_round.round_type,
                round_topics=topics,
                current_difficulty=adjusted_difficulty,
                question_index=current_q_num,
                total_questions=target_question_count,
                target_role=blueprint.target_role
            )
            new_q_data = await gemini_service.generate_structured_json(
                system_prompt=ADAPTIVE_QUESTION_SYSTEM_PROMPT,
                user_prompt=follow_up_prompt,
                temperature=0.3
            )
        except Exception as e:
            logger.warning(f"Adaptive question generation failed, using standard generator: {e}")

    if not new_q_data:
        standard_prompt = build_question_prompt(
            round_name=round_name,
            round_type=active_round.round_type,
            round_objective=round_objective,
            topics=topics,
            difficulty=base_difficulty,
            target_role=blueprint.target_role,
            candidate_profile=candidate_profile,
            previous_questions=previous_question_texts,
            question_index=current_q_num,
            total_questions=target_question_count
        )
        try:
            new_q_data = await gemini_service.generate_structured_json(
                system_prompt=QUESTION_SYSTEM_PROMPT,
                user_prompt=standard_prompt,
                temperature=0.3
            )
        except Exception as e:
            logger.error(f"Gemini question generation failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Gemini could not generate a question. Please check server configuration and retry."
            )

    # Save question to DB
    new_question = Question(
        round_id=active_round.id,
        question_text=new_q_data.get("question", "Describe your experience and approach to solving this technical problem."),
        question_type=new_q_data.get("type", "conceptual"),
        difficulty=new_q_data.get("difficulty", base_difficulty),
        topic=new_q_data.get("topic", topics[0] if topics else active_round.round_type),
        metadata_json=json.dumps({
            "expected_concepts": new_q_data.get("expected_concepts", []),
            "round_name": round_name
        })
    )
    db.add(new_question)
    db.commit()
    db.refresh(new_question)

    return new_question, current_q_num, target_question_count

async def submit_answer_and_evaluate(
    session_id: str,
    question_id: str,
    request: AnswerSubmitRequest,
    user_id: str,
    db: Session
) -> Tuple[Answer, AnswerEvaluation, bool]:
    """
    Submits candidate answer, calls Gemini for multi-dimensional evaluation,
    saves the evaluation, and checks if session/round is completed.
    Returns: (Answer, AnswerEvaluation, is_round_or_session_completed)
    """
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found.")

    # Prevent duplicate submission for same question
    existing_answer = db.query(Answer).filter(Answer.question_id == question.id).first()
    if existing_answer:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question has already been answered.")

    blueprint = db.query(InterviewBlueprint).filter(InterviewBlueprint.id == session.blueprint_id).first()
    meta = json.loads(question.metadata_json or "{}")
    expected_concepts = meta.get("expected_concepts", [])

    # Evaluate via Gemini
    prompt = build_answer_evaluation_prompt(
        question_text=question.question_text,
        question_topic=question.topic,
        expected_concepts=expected_concepts,
        candidate_answer=request.text_answer,
        target_role=blueprint.target_role,
        mode=request.mode or session.mode
    )

    try:
        eval_raw = await gemini_service.generate_structured_json(
            system_prompt=EVALUATION_SYSTEM_PROMPT,
            user_prompt=prompt,
            temperature=0.1
        )
        evaluation = AnswerEvaluation(**eval_raw)
    except Exception as e:
        logger.error("Answer evaluation failed (%s).", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Answer evaluation failed. Your answer was not saved; please retry."
        ) from e

    # Save answer
    answer = Answer(
        question_id=question.id,
        user_id=user_id,
        text_answer=request.text_answer,
        transcript=request.transcript,
        duration_seconds=request.duration_seconds or 0.0,
        evaluation_json=evaluation.model_dump_json()
    )
    db.add(answer)
    db.commit()
    db.refresh(answer)

    # Check round completion
    round_obj = db.query(InterviewRound).filter(InterviewRound.id == question.round_id).first()
    blueprint_data = json.loads(blueprint.blueprint_json)
    rounds_config = blueprint_data.get("rounds", [])
    round_idx = round_obj.round_order - 1
    target_count = rounds_config[round_idx].get("question_count", 3) if round_idx < len(rounds_config) else 3

    answered_count = (
        db.query(Answer)
        .join(Question)
        .filter(Question.round_id == round_obj.id)
        .count()
    )

    is_completed = answered_count >= target_count
    if is_completed:
        round_obj.status = "completed"
        # Calculate round average score
        answers = (
            db.query(Answer)
            .join(Question)
            .filter(Question.round_id == round_obj.id)
            .all()
        )
        scores = []
        for ans in answers:
            try:
                ev = json.loads(ans.evaluation_json)
                scores.append(float(ev["score"]))
            except Exception:
                pass
        round_obj.score = round(sum(scores) / len(scores), 1) if scores else None
        db.commit()

    return answer, evaluation, is_completed
