from typing import List, Optional
from pydantic import BaseModel, Field


class ExecuteRequest(BaseModel):
    code: str = Field(..., description="Source code to execute")
    language: str = Field(..., description="Programming language: python, java, c, cpp, javascript, sql, etc.")
    stdin: Optional[str] = Field(default="", description="Optional standard input string")
    generate_ai_fix: Optional[bool] = Field(default=True, description="Whether to generate AI recommendations if execution produces an error")


class ExecutionErrorDetail(BaseModel):
    line_number: Optional[int] = None
    error_type: str = "Syntax/Runtime Error"
    raw_message: str = ""
    what_went_wrong: str = ""
    why_it_happened: str = ""
    how_to_fix: str = ""
    recommended_patch: Optional[str] = None
    corrected_code: Optional[str] = None
    concept_to_learn: str = ""


class ExecuteResponse(BaseModel):
    status: str  # "Execution Successful", "Compilation Error", "Syntax Error", "Runtime Error", "Time Limit Exceeded", "Execution Error"
    success: bool
    output: str = ""
    stdout: str = ""
    stderr: str = ""
    compile_output: str = ""
    language: str
    execution_time: Optional[float] = None  # in seconds
    memory_usage_kb: Optional[int] = None  # in KB
    exit_code: Optional[int] = None
    error_detail: Optional[ExecutionErrorDetail] = None


class TestCaseItem(BaseModel):
    id: str
    name: str
    input: str = ""
    expected_output: str = ""
    category: str = "Normal"  # "Normal" | "Boundary / Edge" | "Invalid Input" | "Branch Coverage" | "Regression"
    reason: str = ""
    is_verified: bool = False
    is_user_edited: bool = False
    target_branch: Optional[str] = None


class RunTestsRequest(BaseModel):
    code: str
    language: str
    test_cases: List[TestCaseItem]


class RunSingleTestRequest(BaseModel):
    code: str
    language: str
    test_case: TestCaseItem


class TestCaseResultItem(BaseModel):
    id: str
    name: str
    input: str
    expected_output: str
    actual_output: str = ""
    status: str = "not_run"  # "passed" | "failed" | "error" | "timeout"
    category: str = "Normal"
    reason: str = ""
    is_verified: bool = False
    is_user_edited: bool = False
    execution_time: Optional[float] = None
    mismatch_line: Optional[str] = None
    error_message: Optional[str] = None
    failure_explanation: Optional[str] = None


class RunTestsResponse(BaseModel):
    total: int
    passed: int
    failed: int
    errors: int
    timeouts: int = 0
    all_passed: bool
    pass_percentage: float = 0.0
    duration_seconds: float = 0.0
    estimated_coverage: float = 0.0
    results: List[TestCaseResultItem]


class GenerateTestCasesRequest(BaseModel):
    code: str
    language: str
    focus_category: Optional[str] = None


class GenerateTestCasesResponse(BaseModel):
    test_cases: List[TestCaseItem]
    detected_inputs: List[str] = []
    estimated_branches: int = 0
    language: str = "python"


class ExplainTestFailureRequest(BaseModel):
    code: str
    language: str
    test_case: TestCaseResultItem


class ExplainTestFailureResponse(BaseModel):
    test_id: str
    explanation: str
    root_cause: str
    suggested_fix: str
    corrected_code: Optional[str] = None
