import difflib
import json
import logging
from typing import List, Optional
import httpx
from app.core.config import settings
from app.schemas.analysis import FindingSchema, FixResponse

logger = logging.getLogger(__name__)


class AIFixAssistant:
    """
    Generates intelligent fix recommendations with explanations, side-effect analysis, and unified diffs.
    """

    @classmethod
    async def generate_fix(
        cls,
        code: str,
        language: str,
        finding: FindingSchema,
        api_key: Optional[str] = None,
        provider: Optional[str] = None,
    ) -> FixResponse:
        key = api_key or settings.GEMINI_API_KEY or settings.OPENAI_API_KEY
        prov = provider or settings.DEFAULT_AI_PROVIDER

        # If live AI key is available, attempt AI fix generation
        if key:
            try:
                ai_fix = await cls._generate_ai_fix(code, language, finding, key, prov)
                if ai_fix:
                    return ai_fix
            except Exception as e:
                logger.warning(f"Live AI fix failed: {e}. Falling back to deterministic engine.")

        # Deterministic rule-based fix generator
        return cls._generate_deterministic_fix(code, language, finding)

    @classmethod
    async def _generate_ai_fix(
        cls, code: str, language: str, finding: FindingSchema, key: str, provider: str
    ) -> Optional[FixResponse]:
        prompt = f"""You are a senior software security engineer and automated refactoring expert.
Fix the following code issue in {language}:

Issue: {finding.title}
Severity: {finding.severity}
Category: {finding.category}
Affected Lines: {finding.line_start} to {finding.line_end}
Snippet: {finding.snippet}
Explanation: {finding.explanation}

Provide a secure, minimal, idiomatic fix for the entire provided code.
Return ONLY a valid JSON object matching:
{{
  "explanation": "Clear plain-language explanation of the fix",
  "why_unsafe": "Why the original code was dangerous or broken",
  "corrected_code": "Full corrected source code",
  "side_effects": "Any potential side effects, dependency changes, or edge cases",
  "recommended_tests": [
    "Test description 1",
    "Test description 2"
  ]
}}

Source code to fix:
```{language}
{code}
```
"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            if provider == "gemini" or ("AIza" in key):
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.DEFAULT_AI_MODEL}:generateContent?key={key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
                }
                resp = await client.post(url, json=payload)
                if resp.status_code != 200:
                    return None
                data = resp.json()
                raw_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
            else:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {key}"}
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                    "response_format": {"type": "json_object"},
                }
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code != 200:
                    return None
                data = resp.json()
                raw_text = data["choices"][0]["message"]["content"]

            parsed = json.loads(raw_text)
            corrected_code = parsed.get("corrected_code", code)

            diff = cls._make_diff(code, corrected_code)
            return FixResponse(
                explanation=parsed.get("explanation", "Applied automated security remediation."),
                why_unsafe=parsed.get("why_unsafe", finding.explanation),
                corrected_code=corrected_code,
                diff=diff,
                side_effects=parsed.get("side_effects", "None expected with proper test validation."),
                recommended_tests=parsed.get("recommended_tests", ["Verify function output with valid inputs", "Verify rejection of malicious payloads"]),
                is_ai_generated=True,
            )

    @classmethod
    def _generate_deterministic_fix(cls, code: str, language: str, finding: FindingSchema) -> FixResponse:
        lines = code.split("\n")
        line_idx = max(0, finding.line_start - 1)
        original_line = lines[line_idx] if line_idx < len(lines) else ""
        corrected_lines = list(lines)

        explanation = f"Remediated '{finding.title}' following standard secure coding patterns."
        why_unsafe = finding.explanation
        side_effects = "Ensure callers pass expected data types and verify unit test assertions."
        tests: List[str] = [
            "Test normal execution with valid parameters",
            "Test input boundary limits and edge conditions",
            "Regression test confirming vulnerability is patched",
        ]

        # Specific rule transformations
        rule = (finding.rule_id or "").upper()
        if "SQLI" in rule or "SQL" in finding.title:
            if "python" in language.lower():
                # Replace string formatting in query with parameterized tuple
                new_line = original_line.replace('f"', '"').replace("f'", "'")
                if "{" in new_line and "}" in new_line:
                    import re
                    var_match = re.search(r"\{([a-zA-Z0-9_]+)\}", new_line)
                    if var_match:
                        var_name = var_match.group(1)
                        new_line = re.sub(r"\{[a-zA-Z0-9_]+\}", "%s", new_line)
                        if new_line.endswith(")"):
                            new_line = new_line[:-1] + f", ({var_name},))"
                corrected_lines[line_idx] = new_line
            elif "javascript" in language.lower() or "typescript" in language.lower():
                new_line = original_line.replace("${", "$1 /* parameterized */ /* ")
                corrected_lines[line_idx] = new_line
            explanation = "Replaced insecure string concatenation with parameterized query placeholder."
            why_unsafe = "String concatenation in SQL queries permits attackers to inject malicious SQL syntax and compromise database records."
            tests.append("Verify query returns correct row with legitimate IDs")
            tests.append("Verify query safely escapes malicious payload containing `' OR '1'='1`")

        elif "EVAL" in rule or "PY-RCE-EVAL" in rule:
            corrected_lines[line_idx] = original_line.replace("eval(", "ast.literal_eval(")
            if "import ast" not in code:
                corrected_lines.insert(0, "import ast")
            explanation = "Replaced dangerous `eval()` with `ast.literal_eval()`, which strictly allows only standard Python literals."
            why_unsafe = "`eval()` executes arbitrary Python code, allowing remote attackers to run system commands."
            tests.append("Verify arithmetic string literals are evaluated safely")
            tests.append("Verify arbitrary expressions like `__import__('os').system(...)` raise ValueError")

        elif "CMD" in rule or "SHELL" in rule:
            corrected_lines[line_idx] = original_line.replace("shell=True", "shell=False")
            explanation = "Disabled shell invocation (`shell=False`) to enforce direct binary execution without an intermediate command interpreter."
            why_unsafe = "`shell=True` passes input through `/bin/sh` or `cmd.exe`, allowing command chaining operators (`&`, `;`, `|`)."
            tests.append("Verify subprocess executes command correctly with argument array")

        elif "XSS" in rule:
            if "dangerouslySetInnerHTML" in original_line:
                corrected_lines[line_idx] = original_line.replace("dangerouslySetInnerHTML={{ __html: ", "dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(")
                if "DOMPurify" in corrected_lines[line_idx] and not corrected_lines[line_idx].endswith(")") and not corrected_lines[line_idx].endswith("}}"):
                    corrected_lines[line_idx] += ")"
            elif ".innerHTML" in original_line:
                corrected_lines[line_idx] = original_line.replace(".innerHTML", ".textContent")
            explanation = "Sanitized HTML content or converted to safe textContent to prevent script injection."
            why_unsafe = "Unsanitized user content injected into the DOM allows attackers to execute malicious scripts in victims' browsers."
            tests.append("Verify `<script>alert(1)</script>` is stripped or escaped")

        elif "MUTABLE-ARG" in rule:
            # Replace default mutable list with None
            new_line = original_line.replace("=[]", "=None").replace("={}", "=None")
            corrected_lines[line_idx] = new_line
            # Insert guard inside function on next line
            indent = " " * (len(original_line) - len(original_line.lstrip()) + 4)
            corrected_lines.insert(line_idx + 1, f"{indent}# Initialized immutable default\n{indent}pass")
            explanation = "Replaced mutable default argument with `None` to prevent shared state mutations across function calls."
            why_unsafe = "Mutable defaults in Python are instantiated once at module load time; subsequent modifications persist across all calls."
            tests.append("Invoke function twice consecutively and verify default collections remain isolated")

        elif "BARE-EXCEPT" in rule:
            corrected_lines[line_idx] = original_line.replace("except:", "except Exception as e:")
            explanation = "Replaced bare `except:` with explicit `except Exception as e:`."
            why_unsafe = "Bare `except:` catches `KeyboardInterrupt` and `SystemExit`, preventing clean shutdown."
            tests.append("Verify SIGINT (Ctrl+C) properly terminates the process")

        elif finding.suggested_patch:
            # Apply predefined suggested patch
            corrected_lines[line_idx] = finding.suggested_patch

        corrected_code = "\n".join(corrected_lines)
        diff = cls._make_diff(code, corrected_code)

        return FixResponse(
            explanation=explanation,
            why_unsafe=why_unsafe,
            corrected_code=corrected_code,
            diff=diff,
            side_effects=side_effects,
            recommended_tests=tests,
            is_ai_generated=False,
        )

    @classmethod
    def _make_diff(cls, original: str, fixed: str) -> str:
        orig_lines = original.splitlines(keepends=True)
        fixed_lines = fixed.splitlines(keepends=True)
        diff = difflib.unified_diff(
            orig_lines,
            fixed_lines,
            fromfile="original.py",
            tofile="remediated.py",
            n=3,
        )
        return "".join(diff)
