from fastapi import APIRouter, HTTPException

from backend.app.schemas.context import (
    ContextResearchRequest,
    ContextResearchResponse,
)
from backend.app.services.context_service import context_service


router = APIRouter(
    prefix="/api/context",
    tags=["Context.dev"],
)


@router.post(
    "/research",
    response_model=ContextResearchResponse,
)
async def research_context(request: ContextResearchRequest):
    try:
        result = await context_service.research(
            company=request.company,
            role=request.role,
        )

        return ContextResearchResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=str(e),
        )
