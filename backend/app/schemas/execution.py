from typing import Optional
from pydantic import BaseModel, Field


class ExecuteRequest(BaseModel):
    code: str = Field(..., description="Source code to execute")
    language: str = Field(..., description="Programming language: python, java, c, cpp, javascript")
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
