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


class RunTestsRequest(BaseModel):
    code: str
    language: str
    test_cases: List[TestCaseItem]


class TestCaseResultItem(BaseModel):
    id: str
    name: str
    input: str
    expected_output: str
    actual_output: str = ""
    status: str = "not_run"  # "passed" | "failed" | "error"
    execution_time: Optional[float] = None
    mismatch_line: Optional[str] = None
    error_message: Optional[str] = None


class RunTestsResponse(BaseModel):
    total: int
    passed: int
    failed: int
    errors: int
    all_passed: bool
    results: List[TestCaseResultItem]


class GenerateTestCasesRequest(BaseModel):
    code: str
    language: str


class GenerateTestCasesResponse(BaseModel):
    test_cases: List[TestCaseItem]
