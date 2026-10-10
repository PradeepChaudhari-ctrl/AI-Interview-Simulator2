import json
import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.models import (
    InterviewSession,
    InterviewRound,
    Question,
    Answer,
    Report,
    InterviewBlueprint,
)
from backend.app.schemas.report import (
    ReportResponse,
    OverallMetrics,
    RoundMetric,
    TopicMetric,
    PracticePlanItem,
)
from backend.app.prompts.final_report import (
    FINAL_REPORT_SYSTEM_PROMPT,
    build_final_report_prompt,
)
from backend.app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

async def get_or_generate_report(session_id: str, user_id: str, db: Session) -> ReportResponse:
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == user_id
    ).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found.")

    # Check if report already generated
    existing_report = db.query(Report).filter(Report.session_id == session.id).first()
    if existing_report:
        blueprint = db.query(InterviewBlueprint).filter(InterviewBlueprint.id == session.blueprint_id).first()
        return ReportResponse(
            id=existing_report.id,
            session_id=session.id,
            target_role=blueprint.target_role,
            overall_metrics=OverallMetrics(**json.loads(existing_report.overall_metrics_json)),
            weaknesses=json.loads(existing_report.weaknesses_json),
            strengths=json.loads(existing_report.overall_metrics_json).get("strengths", []),
            recommendations=json.loads(existing_report.recommendations_json),
            practice_plan=[
                PracticePlanItem(**p) for p in json.loads(existing_report.overall_metrics_json).get("practice_plan", [])
            ],
            created_at=existing_report.created_at
        )

    # Fetch all rounds, questions, answers
    rounds = db.query(InterviewRound).filter(InterviewRound.session_id == session.id).order_by(InterviewRound.round_order).all()
    blueprint = db.query(InterviewBlueprint).filter(InterviewBlueprint.id == session.blueprint_id).first()
    blueprint_data = json.loads(blueprint.blueprint_json)
    rounds_config = blueprint_data.get("rounds", [])

    rounds_data_summary = []
    evaluations_summary = []
    round_metrics: List[RoundMetric] = []
    topic_scores: Dict[str, List[float]] = {}
    total_duration = 0.0
    all_scores: List[float] = []
    tech_depth_scores: List[float] = []
    comm_scores: List[float] = []
    clarity_scores: List[float] = []
    correctness_scores: List[float] = []

    for r in rounds:
        round_cfg = rounds_config[r.round_order - 1] if (r.round_order - 1) < len(rounds_config) else {}
        round_name = round_cfg.get("name", r.round_type.title())

        questions = db.query(Question).filter(Question.round_id == r.id).all()
        round_evals = []
        round_strengths = []
        round_weaknesses = []

        for q in questions:
            ans = db.query(Answer).filter(Answer.question_id == q.id).first()
            if ans and ans.evaluation_json:
                total_duration += ans.duration_seconds
                try:
                    ev = json.loads(ans.evaluation_json)
                    score = float(ev["score"])
                    all_scores.append(score)
                    tech_depth_scores.append(float(ev["technical_depth"]))
                    comm_scores.append(float(ev["relevance"]))
                    clarity_scores.append(float(ev["clarity"]))
                    correctness_scores.append(float(ev["correctness"]))

                    topic = q.topic or r.round_type
                    topic_scores.setdefault(topic, []).append(score)

                    round_strengths.extend(ev["strengths"])
                    round_weaknesses.extend(ev["weaknesses"])

                    round_evals.append({
                        "question": q.question_text,
                        "topic": q.topic,
                        "difficulty": q.difficulty,
                        "answer_snippet": ans.text_answer[:200],
                        "score": score,
                        "weakness_tags": ev.get("weakness_tags", [])
                    })
                except Exception:
                    pass

        round_avg = round(sum([e["score"] for e in round_evals]) / len(round_evals), 1) if round_evals else 0.0
        round_metrics.append(RoundMetric(
            round_order=r.round_order,
            round_type=r.round_type,
            round_name=round_name,
            score=round_avg,
            total_questions=len(questions),
            key_strengths=list(set(round_strengths))[:3],
            areas_for_growth=list(set(round_weaknesses))[:3]
        ))

        rounds_data_summary.append({
            "round_order": r.round_order,
            "round_name": round_name,
            "score": round_avg,
            "questions_count": len(questions)
        })
        evaluations_summary.extend(round_evals)

    if not all_scores:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="There are no evaluated answers to report yet. Complete an interview question first."
        )

    # Calculate metrics only from saved, real Gemini evaluations.
    readiness_score = round(sum(all_scores) / len(all_scores), 1)
    tech_depth_score = round(sum(tech_depth_scores) / len(tech_depth_scores), 1)
    comm_score = round(sum(comm_scores) / len(comm_scores), 1)
    prob_score = round(sum(correctness_scores) / len(correctness_scores), 1)
    clarity_score = round(sum(clarity_scores) / len(clarity_scores), 1)

    topic_metrics: List[TopicMetric] = []
    for topic, scores in topic_scores.items():
        avg = round(sum(scores) / len(scores), 1)
        st = "strong" if avg >= 80 else ("satisfactory" if avg >= 60 else "needs_practice")
        topic_metrics.append(TopicMetric(topic=topic, score=avg, status=st))

    # Generate synthesized insights via Gemini
    prompt = build_final_report_prompt(
        target_role=blueprint.target_role,
        rounds_data=rounds_data_summary,
        evaluations_data=evaluations_summary
    )

    try:
        report_ai = await gemini_service.generate_structured_json(
            system_prompt=FINAL_REPORT_SYSTEM_PROMPT,
            user_prompt=prompt,
            temperature=0.2
        )
        strengths = report_ai.get("strengths", [])
        weaknesses = report_ai.get("weaknesses", [])
        recommendations = report_ai.get("recommendations", [])
        raw_plan = report_ai.get("practice_plan", [])
        practice_plan = [PracticePlanItem(**p) for p in raw_plan]
    except Exception as e:
        logger.error("Final report generation failed (%s).", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Final report generation failed. Please retry."
        ) from e

    overall_metrics = OverallMetrics(
        readiness_score=readiness_score,
        technical_depth_score=tech_depth_score,
        communication_score=comm_score,
        problem_solving_score=prob_score,
        clarity_score=clarity_score,
        total_questions_answered=len(all_scores),
        total_duration_seconds=total_duration,
        round_metrics=round_metrics,
        topic_metrics=topic_metrics
    )

    overall_dict = overall_metrics.model_dump()
    overall_dict["strengths"] = strengths
    overall_dict["practice_plan"] = [p.model_dump() for p in practice_plan]

    # Save to DB
    db_report = Report(
        session_id=session.id,
        overall_metrics_json=json.dumps(overall_dict),
        weaknesses_json=json.dumps(weaknesses),
        recommendations_json=json.dumps(recommendations)
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)

    return ReportResponse(
        id=db_report.id,
        session_id=session.id,
        target_role=blueprint.target_role,
        overall_metrics=overall_metrics,
        weaknesses=weaknesses,
        strengths=strengths,
        recommendations=recommendations,
        practice_plan=practice_plan,
        created_at=db_report.created_at
    )
