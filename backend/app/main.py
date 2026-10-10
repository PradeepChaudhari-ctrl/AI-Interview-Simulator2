from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import get_settings
from backend.app.core.database import engine, Base

# Ensure all database models are registered
import backend.app.models.models

from backend.app.api import (
    auth,
    resumes,
    blueprints,
    interviews,
    reports,
    practice,
    health,
    context,
    mcq,
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Create database tables when the application starts.
    """
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="AI Interview Simulator API",
    description=(
        "Adaptive multi-round AI-powered interview preparation "
        "platform with resume analysis, real-time evaluation, "
        "practice loop, company research, and MCQ interview practice."
    ),
    version="1.0.0",
    lifespan=lifespan,
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# API ROUTES
# ---------------------------------------------------------

app.include_router(health.router)

app.include_router(auth.router)

app.include_router(resumes.router)

app.include_router(blueprints.router)

app.include_router(interviews.router)

app.include_router(reports.router)

app.include_router(practice.router)

app.include_router(context.router)

# NEW: MCQ Practice API
app.include_router(mcq.router)


# ---------------------------------------------------------
# ROOT
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": "AI Interview Simulator API is running.",
        "documentation": "/docs",
        "health": "/api/health",
        "mcq": "/api/mcq/generate",
    }


# ---------------------------------------------------------
# LOCAL DEVELOPMENT
# ---------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )