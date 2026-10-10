import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Float, Integer, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    resumes = relationship("Resume", back_populates="user", cascade="all, delete-orphan")
    blueprints = relationship("InterviewBlueprint", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("InterviewSession", back_populates="user", cascade="all, delete-orphan")
    answers = relationship("Answer", back_populates="user", cascade="all, delete-orphan")
    practice_sessions = relationship("PracticeSession", back_populates="user", cascade="all, delete-orphan")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    original_filename = Column(String(255), nullable=False)
    storage_path = Column(String(512), nullable=False)
    parsed_profile_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User", back_populates="resumes")
    blueprints = relationship("InterviewBlueprint", back_populates="resume")

class InterviewBlueprint(Base):
    __tablename__ = "interview_blueprints"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    resume_id = Column(String(36), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True, index=True)
    target_role = Column(String(255), nullable=False)
    jd_text = Column(Text, nullable=True)
    blueprint_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User", back_populates="blueprints")
    resume = relationship("Resume", back_populates="blueprints")
    sessions = relationship("InterviewSession", back_populates="blueprint", cascade="all, delete-orphan")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    blueprint_id = Column(String(36), ForeignKey("interview_blueprints.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), nullable=False, default="in_progress", index=True)  # in_progress, completed
    mode = Column(String(50), nullable=False, default="text")  # text, voice, video
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")
    blueprint = relationship("InterviewBlueprint", back_populates="sessions")
    rounds = relationship("InterviewRound", back_populates="session", cascade="all, delete-orphan", order_by="InterviewRound.round_order")
    report = relationship("Report", back_populates="session", uselist=False, cascade="all, delete-orphan")

class InterviewRound(Base):
    __tablename__ = "interview_rounds"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    round_type = Column(String(100), nullable=False)
    round_order = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False, default="pending")  # pending, in_progress, completed
    score = Column(Float, nullable=True)

    session = relationship("InterviewSession", back_populates="rounds")
    questions = relationship("Question", back_populates="round", cascade="all, delete-orphan")

class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    round_id = Column(String(36), ForeignKey("interview_rounds.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, default="conceptual")
    difficulty = Column(String(50), nullable=False, default="medium")
    topic = Column(String(255), nullable=False)
    metadata_json = Column(Text, nullable=False, default="{}")

    round = relationship("InterviewRound", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    text_answer = Column(Text, nullable=False)
    transcript = Column(Text, nullable=True)
    duration_seconds = Column(Float, nullable=False, default=0.0)
    evaluation_json = Column(Text, nullable=False, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    question = relationship("Question", back_populates="answers")
    user = relationship("User", back_populates="answers")

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    overall_metrics_json = Column(Text, nullable=False, default="{}")
    weaknesses_json = Column(Text, nullable=False, default="[]")
    recommendations_json = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    session = relationship("InterviewSession", back_populates="report")
    practice_sessions = relationship("PracticeSession", back_populates="report")

class PracticeSession(Base):
    __tablename__ = "practice_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_report_id = Column(String(36), ForeignKey("reports.id", ondelete="SET NULL"), nullable=True, index=True)
    topic = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False, default="pending")  # pending, in_progress, completed
    score = Column(Float, nullable=True)
    qa_json = Column(Text, nullable=False, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User", back_populates="practice_sessions")
    report = relationship("Report", back_populates="practice_sessions")
