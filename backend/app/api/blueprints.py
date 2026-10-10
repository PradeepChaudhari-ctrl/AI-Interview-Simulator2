import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import User, InterviewBlueprint
from backend.app.schemas.blueprint import (
    BlueprintGenerateRequest,
    BlueprintResponse,
    BlueprintData,
)
from backend.app.services.auth_service import get_current_user
from backend.app.services.blueprint_service import generate_interview_blueprint

router = APIRouter(prefix="/api/blueprints", tags=["Blueprints"])

@router.post("", response_model=BlueprintResponse, status_code=status.HTTP_201_CREATED)
async def create_blueprint(
    request: BlueprintGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    blueprint = await generate_interview_blueprint(request, current_user.id, db)
    blueprint_dict = json.loads(blueprint.blueprint_json)
    return BlueprintResponse(
        id=blueprint.id,
        target_role=blueprint.target_role,
        resume_id=blueprint.resume_id,
        jd_text=blueprint.jd_text,
        blueprint=BlueprintData(**blueprint_dict),
        created_at=blueprint.created_at
    )

@router.get("/{id}", response_model=BlueprintResponse)
def get_blueprint(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    blueprint = db.query(InterviewBlueprint).filter(
        InterviewBlueprint.id == id,
        InterviewBlueprint.user_id == current_user.id
    ).first()
    if not blueprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Blueprint not found.")

    blueprint_dict = json.loads(blueprint.blueprint_json)
    return BlueprintResponse(
        id=blueprint.id,
        target_role=blueprint.target_role,
        resume_id=blueprint.resume_id,
        jd_text=blueprint.jd_text,
        blueprint=BlueprintData(**blueprint_dict),
        created_at=blueprint.created_at
    )

@router.get("", response_model=List[BlueprintResponse])
def list_blueprints(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    blueprints = (
        db.query(InterviewBlueprint)
        .filter(InterviewBlueprint.user_id == current_user.id)
        .order_by(InterviewBlueprint.created_at.desc())
        .all()
    )
    result = []
    for b in blueprints:
        try:
            blueprint_dict = json.loads(b.blueprint_json)
            result.append(BlueprintResponse(
                id=b.id,
                target_role=b.target_role,
                resume_id=b.resume_id,
                jd_text=b.jd_text,
                blueprint=BlueprintData(**blueprint_dict),
                created_at=b.created_at
            ))
        except Exception:
            continue
    return result
