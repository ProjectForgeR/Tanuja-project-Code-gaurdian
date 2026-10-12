import pytest
from app.analyzers.python_ast import PythonAstAnalyzer
from app.analyzers.polyglot_scanner import PolyglotScanner
from app.services.scoring_engine import ScoringEngine
from app.services.duplicate_detector import DuplicateDetector
from app.services.ai_fix_assistant import AIFixAssistant
from app.services.test_generator import TestGenerator
from app.schemas.analysis import FindingSchema


@pytest.mark.asyncio
async def test_python_ast_eval_detection():
    code = """
def run_code(user_input):
    return eval(user_input)
"""
    analyzer = PythonAstAnalyzer()
    findings = await analyzer.analyze(code, "python")
    assert len(findings) >= 1
    eval_finding = next(f for f in findings if "EVAL" in f.rule_id)
    assert eval_finding.severity == "Critical"
    assert eval_finding.category == "Security"
    assert eval_finding.line_start == 3


@pytest.mark.asyncio
async def test_python_ast_mutable_default():
    code = """
def append_item(val, items=[]):
    items.append(val)
    return items
"""
    analyzer = PythonAstAnalyzer()
    findings = await analyzer.analyze(code, "python")
    assert any("MUTABLE-ARG" in f.rule_id for f in findings)


@pytest.mark.asyncio
async def test_polyglot_sql_injection():
    code = """
def get_user(cursor, username):
    cursor.execute(f"SELECT * FROM users WHERE name = '{username}'")
"""
    scanner = PolyglotScanner()
    findings = await scanner.analyze(code, "python")
    assert any("SQLI" in f.rule_id for f in findings)


@pytest.mark.asyncio
async def test_polyglot_js_xss():
    code = """
function render(input) {
    element.innerHTML = input;
}
"""
    scanner = PolyglotScanner()
    findings = await scanner.analyze(code, "javascript")
    assert any("DOM-XSS" in f.rule_id for f in findings)


@pytest.mark.asyncio
async def test_scoring_engine_clean_code():
    quality, risk, breakdown = ScoringEngine.calculate([], 20)
    assert quality == 100.0
    assert risk == 0.0
    assert len(breakdown.factors) >= 1


@pytest.mark.asyncio
async def test_scoring_engine_with_critical():
    f = FindingSchema(
        title="SQL Injection",
        severity="Critical",
        category="Security",
        line_start=5,
        explanation="CWE-89",
    )
    quality, risk, breakdown = ScoringEngine.calculate([f], 20)
    assert quality < 80.0
    assert risk > 20.0
    assert breakdown.impact_score > 0


@pytest.mark.asyncio
async def test_duplicate_detector():
    f1 = FindingSchema(
        id="1",
        title="SQL Injection vulnerability in query",
        severity="Critical",
        category="Security",
        rule_id="SQLI-001",
        line_start=10,
        explanation="Unescaped query",
    )
    f2 = FindingSchema(
        id="2",
        title="SQL Injection vulnerability in query",
        severity="Critical",
        category="Security",
        rule_id="SQLI-001",
        line_start=15,
        explanation="Unescaped query",
    )
    findings, groups = DuplicateDetector.group_duplicates([f1, f2])
    assert len(groups) == 1
    assert groups[0].count == 2
    assert findings[0].duplicate_group_id == groups[0].id


@pytest.mark.asyncio
async def test_ai_fix_assistant():
    code = "cursor.execute(f\"SELECT * FROM users WHERE id = '{uid}'\")"
    f = FindingSchema(
        title="SQL Injection",
        severity="Critical",
        category="Security",
        rule_id="PY-SQLI-CWE89",
        line_start=1,
        snippet=code,
        explanation="Direct injection",
    )
    fix_res = await AIFixAssistant.generate_fix(code, "python", f)
    assert fix_res.corrected_code is not None
    assert len(fix_res.recommended_tests) >= 1
    assert "remediated" in fix_res.diff or len(fix_res.diff) > 0


@pytest.mark.asyncio
async def test_test_generator():
    code = "def authenticate(user, password): pass"
    f = FindingSchema(
        title="SQL Injection",
        severity="Critical",
        category="Security",
        rule_id="PY-SQLI-CWE89",
        line_start=1,
        explanation="Direct injection",
    )
    test_res = await TestGenerator.generate_tests(code, "python", f, "pytest")
    assert "pytest" in test_res.framework
    assert "test_normal_case" in test_res.tests_code
    assert "test_malicious_input" in test_res.tests_code
