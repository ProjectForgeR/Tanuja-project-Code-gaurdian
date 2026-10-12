import sys
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    db_dialect = "postgresql" if ("postgres" in settings.DATABASE_URL.lower()) else "sqlite"
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "python_version": sys.version,
        "analyzers": {
            "python_ast": True,
            "bandit": True,
            "polyglot_scanner": True,
            "ai_engine": bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY),
        },
        "database": {
            "type": db_dialect,
            "connected": True,
        },
    }
