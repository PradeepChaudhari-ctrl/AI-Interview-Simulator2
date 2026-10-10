from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models.models import User
from backend.app.schemas.report import ReportResponse
from backend.app.services.auth_service import get_current_user
from backend.app.services.report_service import get_or_generate_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/{session_id}", response_model=ReportResponse)
async def get_report(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return await get_or_generate_report(session_id, current_user.id, db)
