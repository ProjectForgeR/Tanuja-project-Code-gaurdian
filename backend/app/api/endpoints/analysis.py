import time
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import delete, desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.analyzers.ai_analyzer import AIAnalyzer
from app.analyzers.bandit_analyzer import BanditAnalyzer
from app.analyzers.code_smell_analyzer import CodeSmellAnalyzer
from app.analyzers.polyglot_scanner import PolyglotScanner
from app.analyzers.python_ast import PythonAstAnalyzer
from app.core.database import get_db
from app.models.analysis import Analysis, DuplicateGroup, Finding
from app.models.user import User
from app.schemas.analysis import (
    AnalyzeRequest,
    AnalyzeResponse,
    CompareRequest,
    CompareResponse,
    DuplicateGroupSchema,
    ExplainRequest,
    ExplainResponse,
    FindingSchema,
    FixRequest,
    FixResponse,
    RefactorRequest,
    RefactorResponse,
    TestGenerateRequest,
    TestGenerateResponse,
)
from app.security.auth import get_current_user, get_optional_current_user
from app.services.ai_explainer import AIExplainer
from app.services.ai_fix_assistant import AIFixAssistant
from app.services.duplicate_detector import DuplicateDetector
from app.services.refactoring_service import RefactoringService
from app.services.report_generator import ReportGenerator
from app.services.scoring_engine import ScoringEngine
from app.services.test_generator import TestGenerator

router = APIRouter(prefix="/analyses", tags=["Analysis"])


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_code(
    req: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    start_time = time.time()
    code = req.code.strip()
    if not code:
        raise HTTPException(status_code=400, detail="Provided code string is empty.")

    raw_findings: List[FindingSchema] = []
    ai_status_msg: Optional[str] = None

    # 1. Run Python AST analysis (if Python)
    if req.language.lower() in ["python", "py"]:
        ast_analyzer = PythonAstAnalyzer()
        ast_results = await ast_analyzer.analyze(code, req.language, req.filename or "main.py")
        raw_findings.extend(ast_results)

    # 2. Run Bandit static security analyzer (if Python)
    if req.language.lower() in ["python", "py"]:
        bandit_analyzer = BanditAnalyzer()
        bandit_results = await bandit_analyzer.analyze(code, req.language, req.filename or "main.py")
        raw_findings.extend(bandit_results)

    # 3. Run Polyglot Rule Scanner (Python, JS, TS, Java, C++, Go)
    poly_scanner = PolyglotScanner()
    poly_results = await poly_scanner.analyze(code, req.language, req.filename or "main")
    raw_findings.extend(poly_results)

    # 4. Run Dedicated Code Smell & Maintainability Analyzer (20 smell types)
    smell_analyzer = CodeSmellAnalyzer()
    smell_results = await smell_analyzer.analyze(code, req.language, req.filename or "main")
    raw_findings.extend(smell_results)

    # 5. Run AI Reasoning Engine if requested or configured
    if req.run_ai:
        ai_analyzer = AIAnalyzer()
        ai_results, ai_status_msg = await ai_analyzer.analyze_with_status(code, req.language, req.filename or "main")
        raw_findings.extend(ai_results)
    else:
        ai_status_msg = "Static analysis & code smell detection completed. AI reasoning toggle was disabled."

    # 6. Group and Deduplicate findings
    deduped_findings, duplicate_groups = DuplicateDetector.group_duplicates(raw_findings)

    # 7. Calculate transparent Quality and Risk Scores
    lines_count = len(code.split("\n"))
    quality_score, risk_score, risk_breakdown = ScoringEngine.calculate(deduped_findings, lines_count)

    duration_ms = int((time.time() - start_time) * 1000)

    # Categorical breakdown counts
    critical_count = sum(1 for f in deduped_findings if f.severity == "Critical")
    high_count = sum(1 for f in deduped_findings if f.severity == "High")
    medium_count = sum(1 for f in deduped_findings if f.severity == "Medium")
    low_count = sum(1 for f in deduped_findings if f.severity == "Low")

    code_smells_count = sum(1 for f in deduped_findings if "smell" in (f.category or "").lower())
    maintainability_count = sum(
        1 for f in deduped_findings
        if "maintain" in (f.category or "").lower() or "smell" in (f.category or "").lower() or "complexity" in (f.rule_id or "").lower()
    )
    performance_count = sum(
        1 for f in deduped_findings
        if "perf" in (f.title or "").lower() or "perf" in (f.explanation or "").lower() or "leak" in (f.title or "").lower()
    )
    security_count = sum(1 for f in deduped_findings if (f.category or "").lower() == "security")

    # Complexity indicators
    complexity_metrics = {
        "loc": lines_count,
        "cyclomatic_estimate": max(1, len([l for l in code.split("\n") if any(kw in l for kw in ["if ", "for ", "while ", "elif ", "except ", "catch"])])),
        "max_nesting_depth": max([(len(l) - len(l.lstrip())) // 4 for l in code.split("\n")] or [0]),
        "findings_density": round((len(deduped_findings) / max(1, lines_count)) * 100, 1),
    }

    analysis_id = str(uuid.uuid4())
    title = f"{req.language.capitalize()} Analysis - {req.filename or 'Snippet'}"
    now_utc = datetime.now(timezone.utc)
    created_at_dt = now_utc

    # 7. Persist analysis record if save_to_history is enabled
    if req.save_to_history:
        # Check if identical code and language already exists for this user to prevent duplicate clutter
        user_filter = (Analysis.user_id == current_user.id) if current_user else (Analysis.user_id.is_(None))
        existing_query = (
            select(Analysis)
            .where(
                Analysis.language == req.language.lower(),
                Analysis.code == code,
                user_filter,
            )
            .order_by(desc(Analysis.created_at))
        )
        existing_res = await db.execute(existing_query)
        existing_analysis = existing_res.scalars().first()

        if existing_analysis:
            # Update existing record in-place so one unique code snippet only occupies 1 entry in history
            analysis_id = existing_analysis.id
            existing_analysis.title = title
            existing_analysis.quality_score = quality_score
            existing_analysis.risk_score = risk_score
            existing_analysis.findings_count = len(deduped_findings)
            existing_analysis.critical_count = critical_count
            existing_analysis.high_count = high_count
            existing_analysis.medium_count = medium_count
            existing_analysis.low_count = low_count
            existing_analysis.duration_ms = duration_ms
            existing_analysis.status = "completed"
            existing_analysis.created_at = now_utc
            created_at_dt = now_utc

            # Clean up old findings and duplicate groups to update with new scan results
            await db.execute(delete(Finding).where(Finding.analysis_id == existing_analysis.id))
            await db.execute(delete(DuplicateGroup).where(DuplicateGroup.analysis_id == existing_analysis.id))
            analysis = existing_analysis
        else:
            analysis = Analysis(
                id=analysis_id,
                user_id=current_user.id if current_user else None,
                title=title,
                language=req.language.lower(),
                code=code,
                quality_score=quality_score,
                risk_score=risk_score,
                findings_count=len(deduped_findings),
                critical_count=critical_count,
                high_count=high_count,
                medium_count=medium_count,
                low_count=low_count,
                duration_ms=duration_ms,
                status="completed",
                created_at=now_utc,
            )
            db.add(analysis)
            created_at_dt = now_utc

        # Persist findings
        for f in deduped_findings:
            f_id = f.id or str(uuid.uuid4())
            f.id = f_id
            db_finding = Finding(
                id=f_id,
                analysis_id=analysis_id,
                title=f.title,
                severity=f.severity,
                category=f.category,
                line_start=f.line_start,
                line_end=f.line_end,
                col_start=f.col_start or 1,
                col_end=f.col_end or 1,
                snippet=f.snippet,
                explanation=f.explanation,
                impact=f.impact,
                recommended_fix=f.recommended_fix,
                confidence=f.confidence,
                detection_method=f.detection_method,
                suggested_patch=f.suggested_patch,
                rule_id=f.rule_id,
                duplicate_group_id=f.duplicate_group_id,
            )
            db.add(db_finding)

        # Persist duplicate groups
        for dg in duplicate_groups:
            db_group = DuplicateGroup(
                id=dg.id,
                analysis_id=analysis_id,
                title=dg.title,
                description=dg.description,
                count=dg.count,
                similarity_score=dg.similarity_score,
            )
            db.add(db_group)

        await db.commit()

    return AnalyzeResponse(
        id=analysis_id,
        title=title,
        language=req.language.lower(),
        quality_score=quality_score,
        risk_score=risk_score,
        duration_ms=duration_ms,
        status="completed",
        created_at=created_at_dt,
        findings_count=len(deduped_findings),
        critical_count=critical_count,
        high_count=high_count,
        medium_count=medium_count,
        low_count=low_count,
        code_smells_count=code_smells_count,
        maintainability_count=maintainability_count,
        performance_count=performance_count,
        security_count=security_count,
        complexity_metrics=complexity_metrics,
        findings=deduped_findings,
        duplicate_groups=duplicate_groups,
        risk_breakdown=risk_breakdown,
        ai_status=ai_status_msg,
    )


@router.post("/refactor", response_model=RefactorResponse)
async def refactor_code(
    req: RefactorRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Intelligent AI-Powered Code Refactoring:
    Analyzes code smells, generates idiomatic refactored code while preserving exact runtime
    behavior and signatures, produces unified diff, and evaluates before/after quality scores.
    """
    code = req.code.strip()
    if not code:
        raise HTTPException(status_code=400, detail="Provided code string is empty.")
    return await RefactoringService.refactor_code(req)



@router.post("/explain", response_model=ExplainResponse)
async def explain_findings(
    req: ExplainRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    """
    Explain detected findings in plain English using the AI provider.
    Falls back to rule-based explanations if AI is unavailable.
    Accepts the same code + language + findings already returned by /analyze.
    """
    code = req.code.strip()
    if not code:
        raise HTTPException(status_code=400, detail="Code is empty. Paste code before requesting explanations.")

    result = await AIExplainer.explain(
        code=code,
        language=req.language,
        findings=req.findings,
    )

    # Build validated response
    from app.schemas.analysis import FindingExplanationSchema
    return ExplainResponse(
        success=result["success"],
        language=result["language"],
        explanations=[FindingExplanationSchema(**e) for e in result["explanations"]],
        ai_used=result["ai_used"],
        message=result["message"],
    )


@router.post("/fix/suggest", response_model=FixResponse)
async def suggest_fix(
    req: FixRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return await AIFixAssistant.generate_fix(req.code, req.language, req.finding)



@router.post("/tests/generate", response_model=TestGenerateResponse)
async def generate_tests(
    req: TestGenerateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    return await TestGenerator.generate_tests(req.code, req.language, req.finding, req.framework)


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns real-time aggregated metrics for the Security & Health Dashboard.
    Calculates stats across all language executions and analyses in real time.
    """
    query = (
        select(Analysis)
        .options(selectinload(Analysis.findings))
        .where(Analysis.user_id == current_user.id)
        .order_by(desc(Analysis.created_at))
    )
    result = await db.execute(query)
    all_analyses = result.scalars().all()

    total_count = len(all_analyses)
    if total_count == 0:
        return {
            "total_analyses": 0,
            "bugs_detected": 0,
            "security_issues": 0,
            "critical_findings": 0,
            "avg_quality_score": 100.0,
            "language_breakdown": [],
            "severity_breakdown": {"critical": 0, "high": 0, "medium": 0, "low": 0},
        }

    bugs_count = 0
    security_count = 0
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    total_score = 0.0
    lang_map: dict = {}

    for a in all_analyses:
        total_score += a.quality_score
        lang_key = (a.language or "other").upper().strip()
        lang_map[lang_key] = lang_map.get(lang_key, 0) + 1
        critical_count += a.critical_count
        high_count += a.high_count
        medium_count += a.medium_count
        low_count += a.low_count

        for f in a.findings:
            cat = (f.category or "").lower()
            if "bug" in cat or "defect" in cat or "syntax" in cat or "runtime" in cat:
                bugs_count += 1
            elif "security" in cat or "vulnerability" in cat or "cwe" in cat:
                security_count += 1

    language_breakdown = [
        {"language": lang, "count": count}
        for lang, count in sorted(lang_map.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "total_analyses": total_count,
        "bugs_detected": bugs_count,
        "security_issues": security_count,
        "critical_findings": critical_count,
        "avg_quality_score": round(total_score / total_count, 1),
        "language_breakdown": language_breakdown,
        "severity_breakdown": {
            "critical": critical_count,
            "high": high_count,
            "medium": medium_count,
            "low": low_count,
        },
    }


@router.get("", response_model=List[AnalyzeResponse])
async def list_analyses(
    limit: int = 500,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Analysis)
        .options(selectinload(Analysis.findings), selectinload(Analysis.duplicate_groups))
        .where((Analysis.user_id == current_user.id) | (Analysis.user_id.is_(None)))
        .order_by(desc(Analysis.created_at))
        .limit(limit)
    )

    result = await db.execute(query)
    analyses = result.scalars().all()

    responses = []
    for a in analyses:
        f_schemas = [FindingSchema.model_validate(f) for f in a.findings]
        dg_schemas = [DuplicateGroupSchema.model_validate(g) for g in a.duplicate_groups]
        _, _, breakdown = ScoringEngine.calculate(f_schemas)

        created_at_val = a.created_at
        if created_at_val and created_at_val.tzinfo is None:
            created_at_val = created_at_val.replace(tzinfo=timezone.utc)

        responses.append(
            AnalyzeResponse(
                id=a.id,
                title=a.title,
                language=a.language,
                quality_score=a.quality_score,
                risk_score=a.risk_score,
                duration_ms=a.duration_ms,
                status=a.status,
                created_at=created_at_val,
                findings_count=a.findings_count,
                critical_count=a.critical_count,
                high_count=a.high_count,
                medium_count=a.medium_count,
                low_count=a.low_count,
                findings=f_schemas,
                duplicate_groups=dg_schemas,
                risk_breakdown=breakdown,
            )
        )
    return responses


@router.get("/{analysis_id}", response_model=AnalyzeResponse)
async def get_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        select(Analysis)
        .options(selectinload(Analysis.findings), selectinload(Analysis.duplicate_groups))
        .where(
            Analysis.id == analysis_id,
            (Analysis.user_id == current_user.id) | (Analysis.user_id.is_(None)),
        )
    )

    result = await db.execute(query)
    analysis = result.scalars().first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis report not found.")

    f_schemas = [FindingSchema.model_validate(f) for f in analysis.findings]
    dg_schemas = [DuplicateGroupSchema.model_validate(g) for g in analysis.duplicate_groups]
    _, _, breakdown = ScoringEngine.calculate(f_schemas)

    created_at_val = analysis.created_at
    if created_at_val and created_at_val.tzinfo is None:
        created_at_val = created_at_val.replace(tzinfo=timezone.utc)

    return AnalyzeResponse(
        id=analysis.id,
        title=analysis.title,
        language=analysis.language,
        quality_score=analysis.quality_score,
        risk_score=analysis.risk_score,
        duration_ms=analysis.duration_ms,
        status=analysis.status,
        created_at=created_at_val,
        findings_count=analysis.findings_count,
        critical_count=analysis.critical_count,
        high_count=analysis.high_count,
        medium_count=analysis.medium_count,
        low_count=analysis.low_count,
        findings=f_schemas,
        duplicate_groups=dg_schemas,
        risk_breakdown=breakdown,
    )


@router.delete("/clear-all")
@router.delete("")
async def delete_all_analyses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Permanently delete all analysis history records for the current user.
    """
    query = select(Analysis).where(
        (Analysis.user_id == current_user.id) | (Analysis.user_id.is_(None))
    )
    result = await db.execute(query)
    analyses = result.scalars().all()
    count = len(analyses)
    for a in analyses:
        await db.delete(a)
    await db.commit()
    return {"message": f"Successfully deleted {count} analysis reports.", "deleted_count": count}


@router.delete("/{analysis_id}")
async def delete_analysis(
    analysis_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Analysis).where(
        Analysis.id == analysis_id,
        (Analysis.user_id == current_user.id) | (Analysis.user_id.is_(None)),
    )

    result = await db.execute(query)
    analysis = result.scalars().first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis report not found.")

    await db.delete(analysis)
    await db.commit()
    return {"message": "Analysis report deleted successfully.", "id": analysis_id}


@router.post("/compare", response_model=CompareResponse)
async def compare_analyses(req: CompareRequest, db: AsyncSession = Depends(get_db)):
    res1 = await db.execute(
        select(Analysis).options(selectinload(Analysis.findings)).where(Analysis.id == req.analysis_id_1)
    )
    a1 = res1.scalars().first()

    res2 = await db.execute(
        select(Analysis).options(selectinload(Analysis.findings)).where(Analysis.id == req.analysis_id_2)
    )
    a2 = res2.scalars().first()

    if not a1 or not a2:
        raise HTTPException(status_code=404, detail="One or both analyses not found for comparison.")

    f1_rules = {f.rule_id: f for f in a1.findings if f.rule_id}
    f2_rules = {f.rule_id: f for f in a2.findings if f.rule_id}

    resolved = [FindingSchema.model_validate(f1_rules[r]) for r in f1_rules if r not in f2_rules]
    new = [FindingSchema.model_validate(f2_rules[r]) for r in f2_rules if r not in f1_rules]
    persisting = [FindingSchema.model_validate(f2_rules[r]) for r in f2_rules if r in f1_rules]

    return CompareResponse(
        analysis_1={"id": a1.id, "title": a1.title, "quality_score": a1.quality_score, "created_at": a1.created_at},
        analysis_2={"id": a2.id, "title": a2.title, "quality_score": a2.quality_score, "created_at": a2.created_at},
        quality_score_delta=round(a2.quality_score - a1.quality_score, 1),
        risk_score_delta=round(a2.risk_score - a1.risk_score, 1),
        findings_delta=a2.findings_count - a1.findings_count,
        resolved_findings=resolved,
        new_findings=new,
        persisting_findings=persisting,
    )


@router.get("/{analysis_id}/export/html")
async def export_html(analysis_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Analysis).options(selectinload(Analysis.findings)).where(Analysis.id == analysis_id)
    )
    analysis = result.scalars().first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis report not found.")

    html_content = ReportGenerator.generate_html(analysis)
    return Response(
        content=html_content,
        media_type="text/html",
        headers={"Content-Disposition": f"attachment; filename=codeguardian-report-{analysis.id[:8]}.html"},
    )


@router.get("/{analysis_id}/export/json")
async def export_json(analysis_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Analysis).options(selectinload(Analysis.findings)).where(Analysis.id == analysis_id)
    )
    analysis = result.scalars().first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis report not found.")

    json_data = ReportGenerator.generate_json(analysis)
    return json_data
