import json
import logging
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.models import InterviewBlueprint, Resume
from backend.app.schemas.blueprint import (
    BlueprintGenerateRequest,
    BlueprintData,
)
from backend.app.prompts.blueprint import (
    BLUEPRINT_SYSTEM_PROMPT,
    build_blueprint_prompt,
)
from backend.app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

async def generate_interview_blueprint(
    request: BlueprintGenerateRequest,
    user_id: str,
    db: Session
) -> InterviewBlueprint:
    """Generates every interview blueprint using the configured Gemini API."""
    candidate_profile = None
    if request.resume_id:
        resume = db.query(Resume).filter(Resume.id == request.resume_id, Resume.user_id == user_id).first()
        if not resume:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")
        if resume.parsed_profile_json:
            try:
                candidate_profile = json.loads(resume.parsed_profile_json)
            except (TypeError, json.JSONDecodeError) as e:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="The selected resume profile could not be read. Please review or re-upload it."
                ) from e

    prompt = build_blueprint_prompt(
        target_role=request.target_role,
        experience_level=request.experience_level,
        candidate_profile=candidate_profile,
        jd_text=request.jd_text,
        template_type=request.template_type
    )
    try:
        raw_blueprint = await gemini_service.generate_structured_json(
            system_prompt=BLUEPRINT_SYSTEM_PROMPT,
            user_prompt=prompt,
            temperature=0.2
        )
        blueprint_data = BlueprintData(**raw_blueprint)
    except Exception as e:
        logger.error("Gemini blueprint generation failed (%s).", type(e).__name__)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Interview blueprint generation failed: {e}"
        ) from e
    # Validate rounds server-side
    if not blueprint_data.rounds or len(blueprint_data.rounds) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Generated blueprint has no interview rounds."
        )

    # Store in database
    db_blueprint = InterviewBlueprint(
        user_id=user_id,
        resume_id=request.resume_id,
        target_role=request.target_role,
        jd_text=request.jd_text,
        blueprint_json=blueprint_data.model_dump_json()
    )
    db.add(db_blueprint)
    db.commit()
    db.refresh(db_blueprint)

    return db_blueprint
