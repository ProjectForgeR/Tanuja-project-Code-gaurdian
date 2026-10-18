import logging
import time
import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.analysis import Analysis, Finding
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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/compiler", tags=["Compiler & Code Execution"])


@router.post("/execute", response_model=ExecuteResponse)
async def execute_code(
    req: ExecuteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Executes source code in a sandboxed, isolated environment (Judge0 / Safe SQL sandbox),
    capturing real stdout, stderr, compile output, execution time, and memory usage.
    If an error occurs, generates AI-powered diagnostic recommendations.
    Every execution is persisted in the database so the Security & Health Dashboard updates in real time.
    """
    res = await ExecutionService.execute_code(req)

    # Real-Time Dashboard Integration: Persist execution run to the database
    try:
        analysis_id = str(uuid.uuid4())
        lang_normalized = (req.language or "python").lower().strip()
        is_success = res.success

        quality_score = 98.0 if is_success else 50.0
        risk_score = 2.0 if is_success else 50.0
        findings_count = 0 if is_success else 1
        critical_count = 0 if is_success else 1

        title = f"{req.language.upper()} Run - {res.status}"
        analysis_record = Analysis(
            id=analysis_id,
            user_id=current_user.id if current_user else None,
            title=title,
            language=lang_normalized,
            code=req.code,
            quality_score=quality_score,
            risk_score=risk_score,
            findings_count=findings_count,
            critical_count=critical_count,
            high_count=0,
            medium_count=0,
            low_count=0,
            duration_ms=int((res.execution_time or 0.1) * 1000),
            status="completed" if is_success else "failed",
        )
        db.add(analysis_record)

        if not is_success:
            err_title = (
                res.error_detail.error_type
                if res.error_detail and res.error_detail.error_type
                else res.status
            )
            err_msg = (
                res.error_detail.what_went_wrong
                if res.error_detail and res.error_detail.what_went_wrong
                else (res.stderr or res.output or "Execution error encountered.")
            )
            err_fix = (
                res.error_detail.how_to_fix
                if res.error_detail and res.error_detail.how_to_fix
                else "Review code syntax and logic."
            )
            finding_rec = Finding(
                id=str(uuid.uuid4()),
                analysis_id=analysis_id,
                title=err_title,
                severity="Critical",
                category="Bug",
                line_start=res.error_detail.line_number if res.error_detail and res.error_detail.line_number else 1,
                line_end=res.error_detail.line_number if res.error_detail and res.error_detail.line_number else 1,
                col_start=1,
                col_end=1,
                snippet=(res.error_detail.raw_message if res.error_detail else "")[:500],
                explanation=err_msg,
                impact="Program halted or terminated abnormally.",
                recommended_fix=err_fix,
                confidence=0.98,
                detection_method="Sandbox Execution Engine",
                suggested_patch=res.error_detail.corrected_code if res.error_detail else None,
                rule_id=f"EXEC-{lang_normalized.upper()}",
            )
            db.add(finding_rec)

        await db.commit()
    except Exception as e:
        logger.error(f"Failed to persist execution record for dashboard: {e}")

    return res


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
