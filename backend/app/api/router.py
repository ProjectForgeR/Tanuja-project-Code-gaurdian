from fastapi import APIRouter
from app.api.endpoints import analysis, auth, compiler, health, settings

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(analysis.router)
api_router.include_router(compiler.router)
api_router.include_router(settings.router)
