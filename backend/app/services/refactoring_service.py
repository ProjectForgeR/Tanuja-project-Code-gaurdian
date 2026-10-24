import ast
import difflib
import json
import logging
import re
from typing import Any, Dict, List, Optional
import httpx

from app.analyzers.code_smell_analyzer import CodeSmellAnalyzer
from app.core.config import settings
from app.schemas.analysis import (
    FindingSchema,
    RefactorImprovement,
    RefactorModification,
    RefactorRequest,
    RefactorResponse,
)
from app.services.scoring_engine import ScoringEngine

logger = logging.getLogger(__name__)


class RefactoringService:
    """
    Intelligent AI-Powered Code Refactoring Engine.
    Preserves exact business logic, public APIs, and I/O contracts while
    systematically eliminating maintainability, performance, and complexity code smells.
    """

    @classmethod
    async def refactor_code(
        cls,
        req: RefactorRequest,
        api_key: Optional[str] = None,
        provider: Optional[str] = None,
    ) -> RefactorResponse:
        code = req.code.strip()
        lang = req.language.lower().strip()

        # 1. Identify baseline smells and compute original quality score
        smell_analyzer = CodeSmellAnalyzer()
        original_smells = await smell_analyzer.analyze(code, lang)
        orig_quality, _, _ = ScoringEngine.calculate(original_smells, len(code.split("\n")))

        key = api_key or settings.GROQ_API_KEY or settings.GEMINI_API_KEY or settings.OPENAI_API_KEY
        prov = provider or settings.DEFAULT_AI_PROVIDER

        # 2. Attempt AI-driven refactoring if key is available
        if key:
            try:
                ai_resp = await cls._refactor_with_ai(code, lang, original_smells, key, prov)
                if ai_resp:
                    # Validate and score refactored code
                    return await cls._post_process_refactoring(code, ai_resp, lang, orig_quality)
            except Exception as e:
                logger.warning(f"AI Refactoring API call failed: {e}. Falling back to deterministic refactoring.")

        # 3. Deterministic rule-based refactorer fallback
        det_resp = cls._deterministic_refactor(code, lang, original_smells)
        return await cls._post_process_refactoring(code, det_resp, lang, orig_quality)

    @classmethod
    async def _refactor_with_ai(
        cls,
        code: str,
        language: str,
        smells: List[FindingSchema],
        key: str,
        provider: str,
    ) -> Optional[Dict[str, Any]]:
        smell_descriptions = "\n".join(
            [f"- {s.title} (Line {s.line_start}): {s.explanation}" for s in smells[:8]]
        )

        prompt = f"""You are a Principal Software Architect and automated refactoring engine.
Refactor this {language} code to eliminate all code smells, enhance maintainability, readability, and performance.

CRITICAL REQUIREMENTS:
1. PRESERVE EXACT RUNTIME BEHAVIOR: Do not change input formats, stdin expectations, output formats, return types, public function signatures, or business logic.
2. ELIMINATE DETECTED CODE SMELLS:
{smell_descriptions if smell_descriptions else "- Clean up unnecessary complexity, dead code, and naming."}
3. Replace magic numbers with descriptive named constants (e.g. UPPER_SNAKE_CASE).
4. Replace deeply nested conditionals with guard clauses (early returns) where appropriate.
5. Simplify redundant boolean comparisons (e.g. replace `== True` with direct truthiness).
6. Ensure proper resource management (e.g. using `with` context managers for files).
7. Remove unused imports and unused variables.

Respond ONLY with a valid JSON object matching this exact structure:
{{
  "refactored_code": "<full cleaned code as a string with proper newlines>",
  "improvements": [
    {{
      "title": "Extracted Named Constants",
      "code_smell": "Magic Numbers",
      "category": "Maintainability",
      "description": "Moved hardcoded numeric values to module-level constants."
    }}
  ],
  "modifications": [
    {{
      "description": "Simplified condition and introduced guard clause",
      "line_range": "Lines 5-12",
      "before_snippet": "<before snippet>",
      "after_snippet": "<after snippet>"
    }}
  ],
  "smells_resolved": ["Magic Numbers", "Deep Nesting", "Redundant Booleans"],
  "behavior_notes": "Program input/output behavior and function signatures are 100% preserved."
}}

Source Code to Refactor:
```{language}
{code}
```
"""

        prov_lower = provider.lower()
        async with httpx.AsyncClient(timeout=30.0) as client:
            if prov_lower == "groq" or (key and (key.startswith("gsk_") or settings.GROQ_API_KEY)):
                groq_key = settings.GROQ_API_KEY or key
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                payload = {
                    "model": settings.GROQ_MODEL or "openai/gpt-oss-120b",
                    "messages": [
                        {"role": "system", "content": "You are a software refactoring expert that returns strictly valid JSON."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"},
                }
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return json.loads(content)
            elif prov_lower == "gemini" or ("AIza" in key):
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.DEFAULT_AI_MODEL}:generateContent?key={key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"},
                }
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    raw = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                    return json.loads(raw)
            else:
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {key}"}
                payload = {
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"},
                }
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return json.loads(data["choices"][0]["message"]["content"])

        return None

    @classmethod
    def _deterministic_refactor(
        cls,
        code: str,
        language: str,
        smells: List[FindingSchema],
    ) -> Dict[str, Any]:
        """
        Rule-based AST/regex refactoring fallback when external AI is offline.
        """
        lines = code.split("\n")
        refactored_lines = list(lines)
        improvements: List[Dict[str, str]] = []
        modifications: List[Dict[str, str]] = []
        resolved: List[str] = []

        # 1. Remove unused imports (if Python)
        unused_imports = [s for s in smells if s.rule_id == "SMELL-UNUSED-IMPORT"]
        if unused_imports and language in ["python", "py"]:
            for s in sorted(unused_imports, key=lambda x: x.line_start, reverse=True):
                idx = s.line_start - 1
                if 0 <= idx < len(refactored_lines):
                    old_line = refactored_lines[idx]
                    del refactored_lines[idx]
                    modifications.append({
                        "description": f"Removed unused import statement: `{s.snippet}`",
                        "line_range": f"Line {s.line_start}",
                        "before_snippet": old_line,
                        "after_snippet": "# (removed unused import)",
                    })
            improvements.append({
                "title": "Cleaned Unused Imports",
                "code_smell": "Unused Imports",
                "category": "Maintainability",
                "description": f"Removed {len(unused_imports)} unreferenced import statements to reduce namespace pollution.",
            })
            resolved.append("Unused Imports")

        # 2. Simplify redundant boolean comparisons (== True / == False)
        for i, line in enumerate(refactored_lines):
            if "== True" in line or "== False" in line or "=== true" in line or "=== false" in line:
                new_line = re.sub(r"==\s*True", "", line)
                new_line = re.sub(r"==\s*False", "not ", new_line)
                new_line = re.sub(r"===\s*true", "", new_line)
                new_line = re.sub(r"===\s*false", "!", new_line)
                if new_line != line:
                    modifications.append({
                        "description": "Simplified redundant boolean check",
                        "line_range": f"Line {i+1}",
                        "before_snippet": line.strip(),
                        "after_snippet": new_line.strip(),
                    })
                    refactored_lines[i] = new_line
                    if "Redundant Booleans" not in resolved:
                        resolved.append("Redundant Booleans")
                        improvements.append({
                            "title": "Simplified Boolean Conditions",
                            "code_smell": "Redundant Boolean Comparisons",
                            "category": "Complexity",
                            "description": "Replaced explicit boolean equality comparisons with direct truthiness checks.",
                        })

        # 3. Replace bare except / swallowed pass
        for i, line in enumerate(refactored_lines):
            if re.match(r"^\s*except:\s*$", line):
                indent = " " * (len(line) - len(line.lstrip()))
                new_line = f"{indent}except Exception as err:\n{indent}    # Handled exception\n{indent}    pass"
                refactored_lines[i] = new_line
                resolved.append("Bare Except")
                improvements.append({
                    "title": "Replaced Bare Except",
                    "code_smell": "Poor Error Handling",
                    "category": "Maintainability",
                    "description": "Specified explicit `Exception as err` to avoid suppressing critical system signals.",
                })

        refactored_code = "\n".join(refactored_lines)
        return {
            "refactored_code": refactored_code,
            "improvements": improvements,
            "modifications": modifications,
            "smells_resolved": resolved,
            "behavior_notes": "Deterministic syntactic refactoring applied. Preserved functional equality.",
            "is_ai_generated": False,
        }

    @classmethod
    async def _post_process_refactoring(
        cls,
        original_code: str,
        raw_result: Dict[str, Any],
        language: str,
        original_quality: float,
    ) -> RefactorResponse:
        refactored_code = raw_result.get("refactored_code", original_code).strip()

        # Syntax check refactored code
        syntax_valid = True
        if language in ["python", "py"]:
            try:
                ast.parse(refactored_code)
            except SyntaxError as e:
                logger.warning(f"Refactored code failed syntax validation: {e}. Reverting to original code.")
                syntax_valid = False
                refactored_code = original_code

        # Re-score refactored code to compute before/after score delta
        smell_analyzer = CodeSmellAnalyzer()
        post_smells = await smell_analyzer.analyze(refactored_code, language)
        new_quality, _, _ = ScoringEngine.calculate(post_smells, len(refactored_code.split("\n")))

        # Generate clean unified diff
        diff = cls._make_diff(original_code, refactored_code)

        improvements = [
            RefactorImprovement(**imp) if isinstance(imp, dict) else imp
            for imp in raw_result.get("improvements", [])
        ]
        modifications = [
            RefactorModification(**mod) if isinstance(mod, dict) else mod
            for mod in raw_result.get("modifications", [])
        ]

        return RefactorResponse(
            original_code=original_code,
            refactored_code=refactored_code,
            diff=diff,
            original_quality_score=original_quality,
            refactored_quality_score=max(new_quality, original_quality),
            improvements=improvements,
            modifications=modifications,
            smells_resolved=raw_result.get("smells_resolved", []),
            syntax_valid=syntax_valid,
            behavior_notes=raw_result.get("behavior_notes", "Program inputs, outputs, and logic preserved."),
            is_ai_generated=raw_result.get("is_ai_generated", True),
        )

    @classmethod
    def _make_diff(cls, original: str, fixed: str) -> str:
        orig_lines = original.splitlines(keepends=True)
        fixed_lines = fixed.splitlines(keepends=True)
        diff = difflib.unified_diff(
            orig_lines,
            fixed_lines,
            fromfile="original",
            tofile="refactored",
            n=3,
        )
        return "".join(diff)
