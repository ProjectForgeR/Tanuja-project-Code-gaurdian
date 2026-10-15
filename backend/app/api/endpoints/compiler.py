from fastapi import APIRouter, Depends
from app.models.user import User
from app.schemas.execution import (
    ExecuteRequest,
    ExecuteResponse,
    RunTestsRequest,
    RunTestsResponse,
    GenerateTestCasesRequest,
    GenerateTestCasesResponse,
)
from app.security.auth import get_current_user
from app.services.execution_service import ExecutionService

router = APIRouter(prefix="/compiler", tags=["Compiler & Code Execution"])


@router.post("/execute", response_model=ExecuteResponse)
async def execute_code(
    req: ExecuteRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Executes source code in a sandboxed, isolated environment (Judge0 / Safe SQL sandbox),
    capturing real stdout, stderr, compile output, execution time, and memory usage.
    If an error occurs, generates AI-powered diagnostic recommendations.
    """
    return await ExecutionService.execute_code(req)


@router.post("/test-cases", response_model=RunTestsResponse)
async def run_test_cases(
    req: RunTestsRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Runs automated test cases against user code in the execution sandbox,
    comparing actual output against expected output and reporting exact mismatch lines.
    """
    return await ExecutionService.run_test_cases(req)


@router.post("/generate-test-cases", response_model=GenerateTestCasesResponse)
async def generate_test_cases(
    req: GenerateTestCasesRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Generates structured test cases (Normal, Edge, Zero/Empty, Negative) for the active code.
    """
    return await ExecutionService.generate_test_cases(req)
