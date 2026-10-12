import ast
import re
import uuid
from typing import List
from app.analyzers.base import BaseAnalyzer
from app.schemas.analysis import FindingSchema


# Signatures that strongly indicate non-Python code
_HTML_SIGNATURES = re.compile(
    r"(?i)(<!doctype\s+html|<html[\s>]|<body[\s>]|<head[\s>]|<script[\s>]|<style[\s>])",
    re.MULTILINE,
)
_CSS_ONLY = re.compile(r"^\s*[\.\#\*]?[a-zA-Z][a-zA-Z0-9_\-]*\s*\{", re.MULTILINE)


def _looks_like_html_or_css(code: str) -> bool:
    if _HTML_SIGNATURES.search(code):
        return True
    # Pure CSS: many lines match "selector { property: value; }"
    css_matches = len(re.findall(r"\{[^}]{0,200}\}", code))
    total_lines = code.count("\n") + 1
    return css_matches > 0 and css_matches / max(total_lines, 1) > 0.2


class PythonAstAnalyzer(BaseAnalyzer):
    async def analyze(self, code: str, language: str, filename: str = "main.py") -> List[FindingSchema]:
        if language.lower() not in ["python", "py"]:
            return []

        findings: List[FindingSchema] = []
        lines = code.split("\n")

        # ── Language Mismatch Guard ────────────────────────────────────────────
        # If the code looks like HTML/CSS/JS but was declared as Python,
        # skip the Python AST entirely and return a helpful advisory instead
        # of a meaningless "invalid decimal literal" SyntaxError.
        if _looks_like_html_or_css(code):
            findings.append(
                FindingSchema(
                    id=str(uuid.uuid4()),
                    title="Language Mismatch: HTML/CSS/JS Code Submitted as Python",
                    severity="Medium",
                    category="Code Smell",
                    line_start=1,
                    line_end=1,
                    col_start=1,
                    col_end=1,
                    snippet=lines[0][:120] if lines else "",
                    explanation=(
                        "The submitted code appears to be HTML, CSS, or JavaScript "
                        "but the selected language is 'Python'. The Python AST parser "
                        "cannot analyze this code and would produce false syntax errors. "
                        "Please change the language selector to 'JavaScript' or 'TypeScript' "
                        "for HTML/JS files, then re-run the analysis."
                    ),
                    impact="Analysis results are inaccurate when the wrong language is selected.",
                    recommended_fix=(
                        "Switch the Language dropdown to 'JavaScript' or 'TypeScript' "
                        "for HTML/JS code, then click 'Analyze Code' again."
                    ),
                    confidence="High",
                    detection_method="Language Mismatch Detector",
                    rule_id="META-LANG-MISMATCH",
                )
            )
            return findings

        # 1. Parse AST; if syntax error, report immediately
        try:
            tree = ast.parse(code, filename=filename)
        except SyntaxError as e:
            line_no = e.lineno or 1
            col_no = e.offset or 1
            snippet = lines[line_no - 1] if 0 <= line_no - 1 < len(lines) else ""
            findings.append(
                FindingSchema(
                    id=str(uuid.uuid4()),
                    title=f"Python Syntax Error: {e.msg}",
                    severity="Critical",
                    category="Bug",
                    line_start=line_no,
                    line_end=line_no,
                    col_start=col_no,
                    col_end=col_no + 1,
                    snippet=snippet,
                    explanation=f"The Python parser encountered a syntax error: '{e.msg}'. This code cannot execute.",
                    impact="Application crashes upon execution with a SyntaxError.",
                    recommended_fix="Correct the syntax error at the indicated line.",
                    confidence="High",
                    detection_method="Python AST Parser",
                    rule_id="PY-SYNTAX-001",
                )
            )
            return findings

        # 2. Traverse AST nodes
        for node in ast.walk(tree):
            # Check function definitions for mutable default arguments
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                for default in node.args.defaults:
                    if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                        line_no = getattr(default, "lineno", node.lineno)
                        snippet = lines[line_no - 1] if 0 <= line_no - 1 < len(lines) else ""
                        findings.append(
                            FindingSchema(
                                id=str(uuid.uuid4()),
                                title=f"Mutable Default Argument in '{node.name}'",
                                severity="Medium",
                                category="Bug",
                                line_start=line_no,
                                line_end=line_no,
                                col_start=getattr(default, "col_offset", 0) + 1,
                                col_end=getattr(default, "end_col_offset", 0) + 1,
                                snippet=snippet,
                                explanation="Default argument values are evaluated once when the function is defined, not each time it is called. Modifying mutable defaults mutates state across subsequent calls.",
                                impact="Subsequent invocations will unexpectedly retain modifications made in previous calls.",
                                recommended_fix="Use None as default value and initialize inside the function: `items = items if items is not None else []`",
                                confidence="High",
                                detection_method="Python AST Analysis",
                                rule_id="PY-MUTABLE-ARG",
                                suggested_patch=f"def {node.name}(..., param=None):\n    if param is None:\n        param = []",
                            )
                        )

            # Check calls for eval, exec, pickle, tempfile
            elif isinstance(node, ast.Call):
                func_name = ""
                if isinstance(node.func, ast.Name):
                    func_name = node.func.id
                elif isinstance(node.func, ast.Attribute):
                    func_name = f"{getattr(node.func.value, 'id', '')}.{node.func.attr}"

                line_no = getattr(node, "lineno", 1)
                snippet = lines[line_no - 1] if 0 <= line_no - 1 < len(lines) else ""

                if func_name in ["eval", "exec"]:
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title=f"Dangerous Dynamic Code Execution: {func_name}()",
                            severity="Critical",
                            category="Security",
                            line_start=line_no,
                            line_end=line_no,
                            col_start=getattr(node, "col_offset", 0) + 1,
                            col_end=getattr(node, "end_col_offset", 0) + 1,
                            snippet=snippet,
                            explanation=f"Directly calling `{func_name}()` allows execution of arbitrary Python code. If input originates from an untrusted source, attackers can achieve Remote Code Execution (RCE).",
                            impact="Complete server compromise and arbitrary code execution.",
                            recommended_fix="Refactor code to use safe parsing such as `ast.literal_eval()` or structured dispatch dictionaries.",
                            confidence="High",
                            detection_method="Python AST Analysis",
                            rule_id="PY-RCE-EVAL",
                            suggested_patch="import ast\nresult = ast.literal_eval(user_input)",
                        )
                    )

                elif func_name in ["pickle.loads", "pickle.load", "_pickle.loads"]:
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title="Insecure Deserialization via pickle",
                            severity="Critical",
                            category="Security",
                            line_start=line_no,
                            line_end=line_no,
                            snippet=snippet,
                            explanation="Pickle deserialization is inherently unsafe. An attacker can construct malicious payloads executing arbitrary system commands upon unpickling.",
                            impact="Arbitrary remote code execution via serialized object payloads.",
                            recommended_fix="Use safe serialization formats such as JSON, Protocol Buffers, or HMAC verification.",
                            confidence="High",
                            detection_method="Python AST Analysis",
                            rule_id="PY-DESER-PICKLE",
                        )
                    )

                elif func_name in ["os.system", "posix.system"]:
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title="Command Injection via os.system",
                            severity="Critical",
                            category="Security",
                            line_start=line_no,
                            line_end=line_no,
                            snippet=snippet,
                            explanation="`os.system()` passes commands directly to the shell. Untrusted parameters enable attackers to inject arbitrary shell commands.",
                            impact="Unauthorized shell command execution on host operating system.",
                            recommended_fix="Use `subprocess.run([...], check=True, shell=False)` with arguments passed as a list, avoiding the shell.",
                            confidence="High",
                            detection_method="Python AST Analysis",
                            rule_id="PY-CMD-INJECT",
                        )
                    )

                elif func_name == "tempfile.mktemp":
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title="Insecure Temporary File Creation",
                            severity="High",
                            category="Security",
                            line_start=line_no,
                            line_end=line_no,
                            snippet=snippet,
                            explanation="`tempfile.mktemp()` is deprecated and vulnerable to race conditions (TOCTOU: Time of check to time of use).",
                            impact="Local file hijacking and symlink attacks.",
                            recommended_fix="Use `tempfile.NamedTemporaryFile()` or `tempfile.mkstemp()` instead.",
                            confidence="High",
                            detection_method="Python AST Analysis",
                            rule_id="PY-INSECURE-TEMP",
                        )
                    )

            # Check bare except clauses
            elif isinstance(node, ast.ExceptHandler):
                if node.type is None:
                    line_no = getattr(node, "lineno", 1)
                    snippet = lines[line_no - 1] if 0 <= line_no - 1 < len(lines) else ""
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title="Bare 'except:' Clause Hiding Critical Failures",
                            severity="Medium",
                            category="Bug",
                            line_start=line_no,
                            line_end=line_no,
                            snippet=snippet,
                            explanation="A bare `except:` catches `KeyboardInterrupt`, `SystemExit`, and memory errors in addition to standard exceptions, suppressing critical system signals and bugs.",
                            impact="Makes debugging exceptionally difficult and prevents clean application termination.",
                            recommended_fix="Catch specific exceptions: `except (ValueError, KeyError) as e:` or at minimum `except Exception as e:`.",
                            confidence="High",
                            detection_method="Python AST Analysis",
                            rule_id="PY-BARE-EXCEPT",
                            suggested_patch="except Exception as e:\n    logger.error(f'Handled error: {e}')",
                        )
                    )

            # Check assert statements
            elif isinstance(node, ast.Assert):
                line_no = getattr(node, "lineno", 1)
                snippet = lines[line_no - 1] if 0 <= line_no - 1 < len(lines) else ""
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Use of 'assert' Statement in Production Code",
                        severity="Low",
                        category="Code Smell",
                        line_start=line_no,
                        line_end=line_no,
                        snippet=snippet,
                        explanation="Assert statements are completely ignored when Python is run in optimized mode (`python -O`). Never rely on assert for input validation or business rules.",
                        impact="Security checks or validations can be silently bypassed in production.",
                        recommended_fix="Replace with explicit exception raising: `if not condition: raise ValueError(...)`.",
                        confidence="High",
                        detection_method="Python AST Analysis",
                        rule_id="PY-ASSERT-PROD",
                    )
                )

        return findings
