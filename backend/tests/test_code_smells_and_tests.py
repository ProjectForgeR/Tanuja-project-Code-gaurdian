import asyncio
import pytest
from app.analyzers.code_smell_analyzer import CodeSmellAnalyzer
from app.schemas.analysis import RefactorRequest
from app.schemas.execution import (
    ExecuteRequest,
    GenerateTestCasesRequest,
    RunSingleTestRequest,
    RunTestsRequest,
    TestCaseItem,
    TestCaseResultItem,
    ExplainTestFailureRequest,
)
from app.services.execution_service import ExecutionService
from app.services.refactoring_service import RefactoringService


@pytest.mark.asyncio
async def test_code_smell_analyzer_python():
    analyzer = CodeSmellAnalyzer()
    code = """import math
import sys

TIMEOUT = 86400

def complex_operation(p1, p2, p3, p4, p5, p6):
    temp = 1000
    unused_var = 42
    if p1 > 0:
        if p2 > 0:
            if p3 > 0:
                if p1 > 0 and p2 > 0 and p3 > 0 and p4 > 0:
                    return True
    if p5 == True:
        return False
    return False
    print("Unreachable dead code")
"""
    findings = await analyzer.analyze(code, "python")
    titles = [f.title for f in findings]
    rules = [f.rule_id for f in findings]

    # Verify key code smells are identified
    assert any("Unused Import" in t for t in titles)
    assert any("Long Parameter List" in t for t in titles)
    assert any("Deeply Nested" in t for t in titles)
    assert any("Complex Conditional" in t for t in titles)
    assert any("Unreachable Dead Code" in t for t in titles)
    assert any("Redundant Boolean" in t for t in titles)
    assert any("Unused Local Variable" in t for t in titles)


@pytest.mark.asyncio
async def test_duplicate_code_detection():
    analyzer = CodeSmellAnalyzer()
    code = """def calc_a():
    x = 10 * 20
    y = x + 30
    total = x * y + 100
    return total

def calc_b():
    x = 10 * 20
    y = x + 30
    total = x * y + 100
    return total + 1
"""
    findings = await analyzer.analyze(code, "python")
    dup_findings = [f for f in findings if f.rule_id == "SMELL-DUPLICATE-CODE"]
    assert len(dup_findings) >= 1
    assert "Duplicate Code Block Detected" in dup_findings[0].title


@pytest.mark.asyncio
async def test_resource_leak_and_swallowed_exception():
    analyzer = CodeSmellAnalyzer()
    code = """def read_data(filepath):
    f = open(filepath, 'r')
    try:
        content = f.read()
    except:
        pass
    return content
"""
    findings = await analyzer.analyze(code, "python")
    rules = [f.rule_id for f in findings]
    assert "SMELL-RESOURCE-LEAK" in rules
    assert "SMELL-SWALLOWED-EXCEPTION" in rules


@pytest.mark.asyncio
async def test_refactoring_service():
    code = """import math

def calculate(val):
    if val == True:
        return True
    return False
"""
    req = RefactorRequest(code=code, language="python")
    res = await RefactoringService.refactor_code(req)

    assert res.syntax_valid is True
    assert res.original_quality_score >= 0.0
    assert res.refactored_quality_score >= res.original_quality_score
    assert len(res.diff) > 0


@pytest.mark.asyncio
async def test_generate_test_cases_dynamic():
    code = """def check_age():
    age = int(input("Enter age: "))
    if age < 0:
        print("Invalid age")
    elif age >= 18:
        print("Adult")
    else:
        print("Minor")

check_age()
"""
    req = GenerateTestCasesRequest(code=code, language="python")
    res = await ExecutionService.generate_test_cases(req)

    assert len(res.test_cases) >= 3
    categories = [tc.category for tc in res.test_cases]
    assert "Normal" in categories or "Boundary / Edge" in categories


@pytest.mark.asyncio
async def test_run_test_cases_pass_and_fail():
    code = """n = int(input())
if n % 2 == 0:
    print("EVEN")
else:
    print("ODD")
"""
    test_cases = [
        TestCaseItem(id="tc-1", name="Even Check", input="4\n", expected_output="EVEN", category="Normal"),
        TestCaseItem(id="tc-2", name="Odd Check", input="7\n", expected_output="ODD", category="Normal"),
        TestCaseItem(id="tc-3", name="Deliberate Fail", input="2\n", expected_output="ODD", category="Boundary / Edge"),
    ]
    req = RunTestsRequest(code=code, language="python", test_cases=test_cases)
    res = await ExecutionService.run_test_cases(req)

    assert res.total == 3
    assert res.passed == 2
    assert res.failed == 1
    assert res.all_passed is False
    assert res.pass_percentage == 66.7


@pytest.mark.asyncio
async def test_run_single_test_and_timeout():
    # 1. Normal single test
    code = "print(int(input()) * 2)"
    tc = TestCaseItem(id="tc-single", name="Multiply", input="5\n", expected_output="10", category="Normal")
    res = await ExecutionService.run_single_test(
        RunSingleTestRequest(code=code, language="python", test_case=tc)
    )
    assert res.status == "passed"
    assert res.actual_output == "10"

    # 2. Infinite loop timeout test
    infinite_code = "while True: pass"
    tc_timeout = TestCaseItem(id="tc-loop", name="Infinite Loop", input="", expected_output="done", category="Boundary / Edge")
    timeout_res = await ExecutionService.run_single_test(
        RunSingleTestRequest(code=infinite_code, language="python", test_case=tc_timeout)
    )
    assert timeout_res.status == "timeout"


@pytest.mark.asyncio
async def test_explain_test_failure():
    code = "print('Wrong Output')"
    failed_tc = TestCaseResultItem(
        id="tc-f1",
        name="Failed Test",
        input="",
        expected_output="Expected Correct Output",
        actual_output="Wrong Output",
        status="failed",
        category="Normal",
        mismatch_line="Line 1 mismatch: Expected 'Expected Correct Output' but got 'Wrong Output'",
    )
    req = ExplainTestFailureRequest(code=code, language="python", test_case=failed_tc)
    explanation = await ExecutionService.explain_test_failure(req)

    assert explanation.test_id == "tc-f1"
    assert len(explanation.explanation) > 0
    assert len(explanation.suggested_fix) > 0
