import json
import os
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import User, Resume
from backend.app.schemas.resume import ResumeResponse, ParsedProfile, ResumeUpdateRequest
from backend.app.services.auth_service import get_current_user
from backend.app.services.resume_parser import process_resume_upload

router = APIRouter(prefix="/api/resumes", tags=["Resumes"])

@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sanitized_filename, storage_path, parsed_profile = await process_resume_upload(file, current_user.id)

    db_resume = Resume(
        user_id=current_user.id,
        original_filename=sanitized_filename,
        storage_path=storage_path,
        parsed_profile_json=parsed_profile.model_dump_json()
    )
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)

    return ResumeResponse(
        id=db_resume.id,
        original_filename=db_resume.original_filename,
        parsed_profile=parsed_profile,
        created_at=db_resume.created_at
    )

@router.get("", response_model=List[ResumeResponse])
def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
    result = []
    for r in resumes:
        try:
            profile_data = json.loads(r.parsed_profile_json)
            profile = ParsedProfile(**profile_data)
        except Exception:
            profile = ParsedProfile()
        result.append(ResumeResponse(
            id=r.id,
            original_filename=r.original_filename,
            parsed_profile=profile,
            created_at=r.created_at
        ))
    return result

@router.get("/{id}", response_model=ResumeResponse)
def get_resume(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    try:
        profile = ParsedProfile(**json.loads(resume.parsed_profile_json))
    except Exception:
        profile = ParsedProfile()

    return ResumeResponse(
        id=resume.id,
        original_filename=resume.original_filename,
        parsed_profile=profile,
        created_at=resume.created_at
    )

@router.put("/{id}", response_model=ResumeResponse)
def update_resume_profile(
    id: str,
    request: ResumeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    resume.parsed_profile_json = request.parsed_profile.model_dump_json()
    db.commit()
    db.refresh(resume)

    return ResumeResponse(
        id=resume.id,
        original_filename=resume.original_filename,
        parsed_profile=request.parsed_profile,
        created_at=resume.created_at
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(Resume.id == id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found.")

    # Remove file on disk if exists
    if os.path.exists(resume.storage_path):
        try:
            os.remove(resume.storage_path)
        except Exception:
            pass

    db.delete(resume)
    db.commit()
    return None
