from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class FindingSchema(BaseModel):
    id: Optional[str] = None
    title: str
    severity: str  # Critical, High, Medium, Low, Informational
    category: str  # Security, Bug, Code Smell, Maintainability
    line_start: int = 1
    line_end: int = 1
    col_start: int = 1
    col_end: int = 1
    snippet: Optional[str] = None
    explanation: str
    impact: Optional[str] = None
    recommended_fix: Optional[str] = None
    confidence: str = "High"  # High, Medium, Low
    detection_method: str = "Static Analysis"
    suggested_patch: Optional[str] = None
    rule_id: Optional[str] = None
    duplicate_group_id: Optional[str] = None

    model_config = {"from_attributes": True}


class DuplicateGroupSchema(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    count: int = 1
    similarity_score: float = 1.0
    finding_ids: List[str] = []

    model_config = {"from_attributes": True}


class RiskBreakdownSchema(BaseModel):
    impact_score: float = 0.0
    exploitability_score: float = 0.0
    confidence_score: float = 0.0
    scope_score: float = 0.0
    summary: str = ""
    factors: List[str] = []


class AnalyzeRequest(BaseModel):
    code: str = Field(..., max_length=1024 * 1024)
    language: str = Field(..., description="python, javascript, typescript, java, cpp, go")
    filename: Optional[str] = "main"
    run_ai: bool = False
    demo_mode: bool = False


class AnalyzeResponse(BaseModel):
    id: str
    title: str
    language: str
    quality_score: float  # 0 to 100 (100 is cleanest)
    risk_score: float  # 0 to 100 (100 is most dangerous)
    duration_ms: int
    status: str = "completed"
    created_at: Optional[datetime] = None
    findings_count: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    code_smells_count: int = 0
    maintainability_count: int = 0
    performance_count: int = 0
    security_count: int = 0
    complexity_metrics: Dict[str, Any] = Field(default_factory=dict)
    findings: List[FindingSchema] = []
    duplicate_groups: List[DuplicateGroupSchema] = []
    risk_breakdown: RiskBreakdownSchema
    ai_status: Optional[str] = None

    model_config = {"from_attributes": True}


class RefactorImprovement(BaseModel):
    title: str
    code_smell: str
    category: str = "Maintainability"
    description: str


class RefactorModification(BaseModel):
    description: str
    line_range: str
    before_snippet: str
    after_snippet: str


class RefactorRequest(BaseModel):
    code: str
    language: str
    finding_ids: Optional[List[str]] = None
    target_smell: Optional[str] = None


class RefactorResponse(BaseModel):
    original_code: str
    refactored_code: str
    diff: str
    original_quality_score: float
    refactored_quality_score: float
    improvements: List[RefactorImprovement] = []
    modifications: List[RefactorModification] = []
    smells_resolved: List[str] = []
    syntax_valid: bool = True
    behavior_notes: str = ""
    is_ai_generated: bool = True


class FixRequest(BaseModel):
    code: str
    language: str
    finding: FindingSchema


class FixResponse(BaseModel):
    explanation: str
    why_unsafe: str
    corrected_code: str
    diff: str
    side_effects: str
    recommended_tests: List[str]
    is_ai_generated: bool = False


class TestGenerateRequest(BaseModel):
    code: str
    language: str
    finding: Optional[FindingSchema] = None
    framework: Optional[str] = None  # pytest, jest, junit, etc.


class TestGenerateResponse(BaseModel):
    tests_code: str
    framework: str
    test_cases_breakdown: List[str]
    run_command_hint: str
    is_ai_generated: bool = False


class CompareRequest(BaseModel):
    analysis_id_1: str
    analysis_id_2: str


class CompareResponse(BaseModel):
    analysis_1: Dict[str, Any]
    analysis_2: Dict[str, Any]
    quality_score_delta: float
    risk_score_delta: float
    findings_delta: int
    resolved_findings: List[FindingSchema]
    new_findings: List[FindingSchema]
    persisting_findings: List[FindingSchema]


# ---------------------------------------------------------------------------
# Explain Errors with AI — Request / Response schemas
# ---------------------------------------------------------------------------

class ExplainRequest(BaseModel):
    code: str = Field(..., max_length=1024 * 1024)
    language: str = Field(..., description="python, javascript, typescript, java, cpp, go")
    findings: List[FindingSchema] = Field(default_factory=list)


class FindingExplanationSchema(BaseModel):
    finding_id: str
    title: str
    severity: str
    line: int = 1
    what: str = ""
    why: str = ""
    impact: str = ""
    fix: str = ""
    corrected_code: str = ""
    prevention: str = ""


class ExplainResponse(BaseModel):
    success: bool = True
    language: str
    explanations: List[FindingExplanationSchema] = []
    ai_used: bool = False
    message: str = ""
