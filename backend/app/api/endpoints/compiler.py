from fastapi import APIRouter, Depends
from app.models.user import User
from app.schemas.execution import ExecuteRequest, ExecuteResponse
from app.security.auth import get_current_user
from app.services.execution_service import ExecutionService

router = APIRouter(prefix="/compiler", tags=["Compiler & Code Execution"])


@router.post("/execute", response_model=ExecuteResponse)
async def execute_code(
    req: ExecuteRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Executes source code in a sandboxed, isolated environment (Judge0),
    capturing real stdout, stderr, compile output, execution time, and memory usage.
    If an error occurs, generates AI-powered diagnostic recommendations.
    """
    return await ExecutionService.execute_code(req)
