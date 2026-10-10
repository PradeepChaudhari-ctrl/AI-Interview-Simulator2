import asyncio
import json

import pytest
from fastapi import HTTPException

from backend.app.models.models import (
    InterviewBlueprint,
    InterviewRound,
    InterviewSession,
    User,
)
from backend.app.schemas.blueprint import BlueprintGenerateRequest
from backend.app.schemas.interview import AnswerSubmitRequest
from backend.app.services import blueprint_service, interview_service
from backend.app.services.gemini_service import gemini_service


def _rounds():
    return [
        {
            "name": f"Round {index + 1}",
            "round_type": "aptitude" if index < 2 else "technical",
            "question_format": "open_ended",
            "objective": "Assess role-related skills",
            "topics": ["fundamentals"],
            "question_count": 1,
            "difficulty": "medium",
            "time_limit_minutes": 15,
            "allowed_modes": ["text"],
            "evaluation_criteria": ["correctness"],
        }
        for index in range(5)
    ]


def test_new_blueprint_has_five_rounds_and_first_two_are_mcq(db, monkeypatch):
    user = User(name="Candidate", email="candidate@example.com", password_hash="hash")
    db.add(user)
    db.commit()

    async def generate_blueprint(**_kwargs):
        return {"target_role": "Engineer", "experience_level": "Mid", "rounds": _rounds()}

    monkeypatch.setattr(gemini_service, "generate_structured_json", generate_blueprint)
    blueprint = asyncio.run(
        blueprint_service.generate_interview_blueprint(
            BlueprintGenerateRequest(target_role="Engineer"),
            user.id,
            db,
        )
    )

    rounds = json.loads(blueprint.blueprint_json)["rounds"]
    assert len(rounds) == 5
    assert [round_config["question_format"] for round_config in rounds] == [
        "mcq",
        "mcq",
        "open_ended",
        "open_ended",
        "open_ended",
    ]


def test_blueprint_generation_rejects_wrong_round_count(db, monkeypatch):
    user = User(name="Candidate", email="candidate2@example.com", password_hash="hash")
    db.add(user)
    db.commit()

    async def generate_blueprint(**_kwargs):
        return {"target_role": "Engineer", "rounds": _rounds()[:4]}

    monkeypatch.setattr(gemini_service, "generate_structured_json", generate_blueprint)
    with pytest.raises(HTTPException) as error:
        asyncio.run(
            blueprint_service.generate_interview_blueprint(
                BlueprintGenerateRequest(target_role="Engineer"),
                user.id,
                db,
            )
        )
    assert error.value.status_code == 502


def test_first_round_generates_and_grades_mcq_without_gemini(db, monkeypatch):
    user = User(name="Candidate", email="candidate3@example.com", password_hash="hash")
    db.add(user)
    db.flush()

    round_config = _rounds()
    blueprint = InterviewBlueprint(
        user_id=user.id,
        target_role="Engineer",
        blueprint_json=json.dumps(
            {"target_role": "Engineer", "rounds": round_config}
        ),
    )
    db.add(blueprint)
    db.flush()

    session = InterviewSession(
        user_id=user.id,
        blueprint_id=blueprint.id,
        status="in_progress",
        mode="text",
    )
    db.add(session)
    db.flush()

    interview_round = InterviewRound(
        session_id=session.id,
        round_type="aptitude",
        round_order=1,
        status="in_progress",
    )
    db.add(interview_round)
    db.commit()

    async def generate_mcq(**kwargs):
        assert "multiple-choice" in kwargs["system_prompt"]
        return {
            "question": "Which data structure uses FIFO order?",
            "type": "mcq",
            "topic": "Data structures",
            "difficulty": "easy",
            "expected_concepts": ["FIFO"],
            "options": ["Queue", "Stack", "Tree", "Graph"],
            "correct_answer": "Queue",
            "explanation": "A queue removes items in first-in, first-out order.",
        }

    monkeypatch.setattr(gemini_service, "generate_structured_json", generate_mcq)
    question, question_number, question_count = asyncio.run(
        interview_service.get_or_generate_current_question(session.id, user.id, db)
    )
    assert question.question_type == "mcq"
    assert question_number == 1
    assert question_count == 1
    assert json.loads(question.metadata_json)["options"] == [
        "Queue",
        "Stack",
        "Tree",
        "Graph",
    ]

    with pytest.raises(HTTPException) as invalid_answer:
        asyncio.run(
            interview_service.submit_answer_and_evaluate(
                session.id,
                question.id,
                AnswerSubmitRequest(text_answer="Not an option"),
                user.id,
                db,
            )
        )
    assert invalid_answer.value.status_code == 400

    answer, evaluation, completed = asyncio.run(
        interview_service.submit_answer_and_evaluate(
            session.id,
            question.id,
            AnswerSubmitRequest(text_answer="Queue"),
            user.id,
            db,
        )
    )
    assert answer.text_answer == "Queue"
    assert evaluation.score == 100
    assert evaluation.correctness == 100
    assert "first-in, first-out" in evaluation.answer_explanation
    assert completed is True
