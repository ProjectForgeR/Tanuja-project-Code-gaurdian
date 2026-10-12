import asyncio
import json
import logging
import re
from typing import Any, Dict, Optional, Tuple
import httpx

from app.core.config import settings
from app.schemas.execution import ExecuteRequest, ExecuteResponse, ExecutionErrorDetail

logger = logging.getLogger(__name__)

# Map normalized language names to Judge0 language IDs
# Reference: https://ce.judge0.com/languages
LANGUAGE_MAP: Dict[str, int] = {
    "python": 92,        # Python 3.11.2
    "py": 92,
    "java": 91,          # Java (JDK 17.0.6)
    "c": 104,            # C (Clang 18.1.8)
    "cpp": 105,          # C++ (GCC 14.1.0)
    "c++": 105,
    "javascript": 102,   # JavaScript (Node.js 22.08.0)
    "js": 102,
}


class ExecutionService:
    @classmethod
    async def execute_code(cls, req: ExecuteRequest) -> ExecuteResponse:
        code = req.code.strip()
        lang_key = req.language.lower().strip()
        
        if not code:
            return ExecuteResponse(
                status="Execution Error",
                success=False,
                output="No code provided to execute.",
                stderr="No code provided.",
                language=req.language,
                error_detail=ExecutionErrorDetail(
                    error_type="Input Error",
                    what_went_wrong="The submitted source code is empty.",
                    why_it_happened="The editor did not contain any executable code lines.",
                    how_to_fix="Write or select a sample code before clicking 'Run Code'.",
                    concept_to_learn="Program Entry Point",
                ),
            )

        lang_id = LANGUAGE_MAP.get(lang_key)
        if not lang_id:
            return ExecuteResponse(
                status="Execution Error",
                success=False,
                output=f"Unsupported language '{req.language}'. Supported languages: Python, Java, C, C++, JavaScript.",
                stderr=f"Language '{req.language}' is not configured in execution engine.",
                language=req.language,
                error_detail=ExecutionErrorDetail(
                    error_type="Unsupported Language",
                    what_went_wrong=f"Language '{req.language}' cannot be executed.",
                    why_it_happened="The compiler only supports Python, Java, C, C++, and JavaScript.",
                    how_to_fix="Select one of the supported languages from the dropdown menu.",
                    concept_to_learn="Language Compatibility",
                ),
            )

        # 1a. HTML-in-JavaScript guard: reject HTML markup sent to Node.js executor
        _HTML_PATTERN = re.compile(
            r'(?i)(<!doctype\s+html|<html[\s>]|<head[\s>]|<body[\s>])',
        )
        if lang_key in ("javascript", "js") and _HTML_PATTERN.search(code):
            return ExecuteResponse(
                status="Language Mismatch",
                success=False,
                output=(
                    "HTML/CSS code cannot be executed by Node.js (JavaScript engine).\n\n"
                    "Node.js runs JavaScript (.js) files only. HTML pages are rendered "
                    "by a web browser — they are not executable programs.\n\n"
                    "👉 Switch the language dropdown to 'JavaScript / HTML' and write "
                    "pure JavaScript (e.g. console.log(\"Hello\")) to test JS code, "
                    "or open your HTML file directly in a browser."
                ),
                language=req.language,
                error_detail=ExecutionErrorDetail(
                    error_type="Language Mismatch",
                    raw_message="HTML markup detected in JavaScript execution context",
                    what_went_wrong=(
                        "HTML code (containing tags like <!DOCTYPE html>, <html>, "
                        "<head>, or <body>) was submitted to the JavaScript (Node.js) executor."
                    ),
                    why_it_happened=(
                        "Node.js is a server-side JavaScript runtime — it executes .js files. "
                        "HTML is a markup language interpreted by web browsers, not by Node.js."
                    ),
                    how_to_fix=(
                        "1. Select 'JavaScript / HTML' language and replace the HTML with "
                        "valid JavaScript code (e.g. console.log('Hello World')).\n"
                        "2. Or open your HTML file in a browser instead of running it here."
                    ),
                    concept_to_learn=(
                        "Execution Environments: Browser vs Node.js — "
                        "HTML/CSS/DOM is processed by the browser engine; "
                        "JavaScript logic runs in Node.js or the browser's JS engine."
                    ),
                ),
            )

        # 1. Execute using Judge0 sandbox
        judge_res, raw_err = await cls._submit_to_judge0(code, lang_id, req.stdin or "")
        
        if not judge_res:
            return ExecuteResponse(
                status="Execution Error",
                success=False,
                output=f"Execution engine failure: {raw_err}",
                stderr=str(raw_err),
                language=req.language,
                error_detail=ExecutionErrorDetail(
                    error_type="Service Error",
                    what_went_wrong="Could not reach sandboxed execution container.",
                    why_it_happened=str(raw_err),
                    how_to_fix="Please verify your internet connection or backend configuration.",
                    concept_to_learn="Sandboxed Remote Code Execution",
                ),
            )

        # Parse Judge0 response
        status_desc = judge_res.get("status", {}).get("description", "Unknown")
        status_id = judge_res.get("status", {}).get("id", 0)
        stdout = (judge_res.get("stdout") or "")
        stderr = (judge_res.get("stderr") or "")
        compile_output = (judge_res.get("compile_output") or "")
        exec_time = float(judge_res.get("time")) if judge_res.get("time") is not None else None
        memory_kb = int(judge_res.get("memory")) if judge_res.get("memory") is not None else None
        exit_code = judge_res.get("exit_code")

        # Judge0 status IDs:
        # 3: Accepted
        # 4: Wrong Answer (for judging)
        # 5: Time Limit Exceeded
        # 6: Compilation Error
        # 7-12: Runtime Errors (NZEC, SIGSEGV, SIGXFSZ, SIGFPE, SIGABRT, NZEC, etc.)
        # 13: Internal Error
        # 14: Exec Format Error
        
        is_success = (status_id == 3 and not compile_output and not stderr)

        # Categorize status
        if status_id == 3 and not compile_output and not stderr:
            final_status = "Execution Successful"
            final_output = stdout if stdout else "(Program executed successfully with no output)"
        elif status_id == 5 or "time limit" in status_desc.lower():
            final_status = "Time Limit Exceeded"
            final_output = stderr or "Program exceeded maximum execution time limit (infinite loop or blocked I/O)."
        elif status_id == 6 or compile_output:
            final_status = "Compilation Error"
            final_output = compile_output or stderr
        elif "syntaxerror" in (stderr + compile_output).lower():
            final_status = "Syntax Error"
            final_output = stderr or compile_output
        elif status_id in [7, 8, 9, 10, 11, 12] or stderr:
            final_status = "Runtime Error"
            final_output = stderr
        else:
            final_status = status_desc or "Execution Error"
            final_output = stderr or stdout or "Unknown execution state."

        # 2. Extract error line number & raw diagnostic message
        combined_error = (compile_output + "\n" + stderr).strip()
        error_line, error_summary = cls._extract_error_location(combined_error, lang_key, code)

        error_detail: Optional[ExecutionErrorDetail] = None
        if not is_success:
            # Generate beginner-friendly AI recommendation
            error_detail = await cls._generate_recommendation(
                code=code,
                language=lang_key,
                raw_error=combined_error,
                status=final_status,
                extracted_line=error_line,
                generate_ai=req.generate_ai_fix,
            )

        return ExecuteResponse(
            status=final_status,
            success=is_success,
            output=final_output.strip(),
            stdout=stdout.strip(),
            stderr=stderr.strip(),
            compile_output=compile_output.strip(),
            language=req.language,
            execution_time=exec_time,
            memory_usage_kb=memory_kb,
            exit_code=exit_code,
            error_detail=error_detail,
        )

    @classmethod
    async def _submit_to_judge0(
        cls, code: str, language_id: int, stdin: str
    ) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        url = f"{settings.JUDGE0_API_URL.rstrip('/')}/submissions?wait=true"
        headers = {"Content-Type": "application/json"}
        if settings.JUDGE0_API_KEY:
            headers["X-RapidAPI-Key"] = settings.JUDGE0_API_KEY
            if settings.JUDGE0_API_HOST:
                headers["X-RapidAPI-Host"] = settings.JUDGE0_API_HOST

        payload = {
            "source_code": code,
            "language_id": language_id,
            "stdin": stdin,
            "cpu_time_limit": min(settings.EXECUTION_TIMEOUT_SECONDS, 10.0),
            "wall_time_limit": min(settings.EXECUTION_TIMEOUT_SECONDS + 2.0, 15.0),
            "memory_limit": 128000,  # 128 MB
        }

        try:
            async with httpx.AsyncClient(timeout=settings.EXECUTION_TIMEOUT_SECONDS + 5.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code in [200, 201]:
                    return resp.json(), None
                return None, f"HTTP {resp.status_code}: {resp.text}"
        except httpx.TimeoutException:
            return None, "Connection to sandbox execution engine timed out."
        except Exception as e:
            return None, str(e)

    @classmethod
    def _extract_error_location(cls, error_text: str, language: str, code: str) -> Tuple[Optional[int], str]:
        if not error_text:
            return None, ""

        line_no: Optional[int] = None
        # Python: File "...", line 3, in ...
        py_match = re.search(r'line\s+(\d+)', error_text, re.IGNORECASE)
        if py_match:
            try:
                line_no = int(py_match.group(1))
            except ValueError:
                pass

        # C / C++ / Clang / GCC: main.cpp:3:10: error: ...
        if not line_no:
            gcc_match = re.search(r':(\d+):\d+:\s*(?:error|fatal error|warning):', error_text)
            if gcc_match:
                try:
                    line_no = int(gcc_match.group(1))
                except ValueError:
                    pass

        # Java: Main.java:3: error: ...
        if not line_no:
            java_match = re.search(r'\.java:(\d+):', error_text)
            if java_match:
                try:
                    line_no = int(java_match.group(1))
                except ValueError:
                    pass

        # JS (Node.js): /box/script.js:3
        if not line_no:
            js_match = re.search(r'(?:\.js|\.mjs):(\d+)', error_text)
            if js_match:
                try:
                    line_no = int(js_match.group(1))
                except ValueError:
                    pass

        return line_no, error_text.split("\n")[0] if error_text else ""

    @classmethod
    async def _generate_recommendation(
        cls,
        code: str,
        language: str,
        raw_error: str,
        status: str,
        extracted_line: Optional[int],
        generate_ai: bool = True,
    ) -> ExecutionErrorDetail:
        # 1. Deterministic baseline analysis
        error_lower = raw_error.lower()
        what_went_wrong = "An error occurred during program execution."
        why_it_happened = "The code could not be processed by the compiler or interpreter."
        how_to_fix = "Review the syntax or runtime logic on the highlighted line."
        concept_to_learn = "Syntax and Error Handling"
        corrected_code: Optional[str] = None

        lines = code.split("\n")
        err_idx = max(0, (extracted_line or 1) - 1)
        err_line = lines[err_idx] if err_idx < len(lines) else ""

        if "syntaxerror" in error_lower or "invalid syntax" in error_lower or "compilation error" in status.lower():
            what_went_wrong = f"Syntax or Compilation Error on Line {extracted_line or '1'}."
            why_it_happened = "The interpreter or compiler encountered an incomplete expression, dangling operator, missing operand, or missing token (such as a colon or semicolon)."
            how_to_fix = "Inspect the highlighted line and supply the missing operand, closing token, or correct the grammar."
            concept_to_learn = "Grammar & Token Syntax"

            # Intelligent Auto-Repair Patterns:
            # Pattern A: Dangling arithmetic/binary operators like `a + `, `a - `, `x * `, `x / `
            if re.search(r"[\+\-\*\/]\s*[\)\],;]?\s*$", err_line.strip()) or re.search(r"\(\s*[\w\d_]+\s*[\+\-\*\/]\s*\)", err_line):
                # Try to find available variables in earlier lines
                var_names = re.findall(r"^[ \t]*([a-zA-Z_][a-zA-Z0-9_]*)\s*=", code, re.MULTILINE)
                second_var = "b"
                if len(var_names) >= 2:
                    second_var = var_names[1]
                elif len(var_names) == 1:
                    second_var = var_names[0]
                
                # Replace incomplete binary expression with completed expression
                patched_line = re.sub(r"([\+\-\*\/])\s*(\)|\]|\;|\,)?\s*$", rf"\1 {second_var}\2", err_line)
                patched_line = re.sub(r"([\+\-\*\/])\s*\)", rf"\1 {second_var})", patched_line)
                if patched_line != err_line:
                    lines_copy = list(lines)
                    lines_copy[err_idx] = patched_line
                    corrected_code = "\n".join(lines_copy)
                    how_to_fix = f"Specify the missing operand after the operator on Line {extracted_line or 1} (e.g. `{patched_line.strip()}`)."

            # Pattern B: Missing colon in Python (if, for, while, def, class)
            elif language in ["python", "py"] and re.search(r"^\s*(?:if|for|while|def|class|elif|else|try|except|finally)\b.*[^:]\s*$", err_line):
                lines_copy = list(lines)
                lines_copy[err_idx] = err_line.rstrip() + ":"
                corrected_code = "\n".join(lines_copy)
                how_to_fix = f"Add a colon `:` at the end of the statement on Line {extracted_line or 1}."
                concept_to_learn = "Compound Statements & Block Delimiters"

            # Pattern C: Missing semicolon in C, C++, Java, JS
            elif language in ["c", "cpp", "java", "javascript", "js"] and ("expected ';'" in error_lower or "missing ';'" in error_lower or not err_line.strip().endswith(";")):
                if not err_line.strip().endswith(";") and not err_line.strip().endswith("{") and not err_line.strip().endswith("}"):
                    lines_copy = list(lines)
                    lines_copy[err_idx] = err_line.rstrip() + ";"
                    corrected_code = "\n".join(lines_copy)
                    how_to_fix = f"Add a terminating semicolon `;` at the end of Line {extracted_line or 1}."
                    concept_to_learn = "Statement Termination Semicolons"

            # Pattern D: Unmatched parentheses / brackets
            elif "unmatched" in error_lower or "was never closed" in error_lower:
                open_p = err_line.count("(") - err_line.count(")")
                if open_p > 0:
                    lines_copy = list(lines)
                    lines_copy[err_idx] = err_line.rstrip() + (")" * open_p)
                    corrected_code = "\n".join(lines_copy)
                    how_to_fix = f"Add {open_p} closing parenthesis `)` to balance the expression on Line {extracted_line or 1}."

        elif "zerodivisionerror" in error_lower or "/ by zero" in error_lower:
            what_went_wrong = f"Division by zero attempted on Line {extracted_line or '1'}."
            why_it_happened = "The program attempted an arithmetic division or modulo operation where the divisor evaluates to zero (0)."
            how_to_fix = "Guard against zero before performing division or specify a non-zero denominator."
            concept_to_learn = "Defensive Programming & Arithmetic Safeguards"
            # Auto patch denominator to safe non-zero value or ternary guard
            if "= 0" in code:
                corrected_code = code.replace("= 0", "= 1", 1)
            elif "/ 0" in code:
                corrected_code = code.replace("/ 0", "/ 1")

        elif "nameerror" in error_lower or "not defined" in error_lower:
            what_went_wrong = f"Undefined variable or identifier on Line {extracted_line or '1'}."
            why_it_happened = "The program tried to access a variable or function before it was defined or imported in the current scope."
            how_to_fix = "Ensure the variable name is spelled correctly and defined prior to this line."
            concept_to_learn = "Variable Scope & Symbol Resolution"
            # Match undefined variable name
            name_match = re.search(r"name\s+'([^']+)'\s+is not defined", raw_error)
            if name_match:
                missing_var = name_match.group(1)
                corrected_code = f"{missing_var} = 0\n" + code
                how_to_fix = f"Define `{missing_var}` with an initial value before referencing it."

        elif "typeerror" in error_lower:
            what_went_wrong = f"Type mismatch or invalid operation on Line {extracted_line or '1'}."
            why_it_happened = "An operator or function was passed arguments of incompatible data types (e.g. attempting to add string and integer without conversion)."
            how_to_fix = "Convert types explicitly (e.g., `int(...)`, `str(...)`, or `Number(...)`) before performing the operation."
            concept_to_learn = "Type Systems & Explicit Type Casting"

        elif "time limit" in status.lower():
            what_went_wrong = "Execution Time Limit Exceeded."
            why_it_happened = "A loop ran indefinitely without reaching a terminating condition (infinite loop), or the program blocked waiting for unprovided input."
            how_to_fix = "Ensure loops have valid increment/break conditions, or provide input in the STDIN input box if `input()`/`Scanner` is used."
            concept_to_learn = "Loop Termination & Algorithmic Complexity"

        # General fallback synthesis: if no specific patch was produced, provide best-effort syntax repair
        if not corrected_code and err_line:
            # Check if there is an unclosed parenthesis or missing token on err_line
            if err_line.count("(") > err_line.count(")"):
                lines_copy = list(lines)
                lines_copy[err_idx] = err_line.rstrip() + (")" * (err_line.count("(") - err_line.count(")")))
                corrected_code = "\n".join(lines_copy)
            elif err_line.count("{") > err_line.count("}"):
                lines_copy = list(lines)
                lines_copy[err_idx] = err_line.rstrip() + "}"
                corrected_code = "\n".join(lines_copy)

        # 2. If AI key is configured and requested, obtain deep AI explanation & corrected code
        api_key = settings.GEMINI_API_KEY or settings.OPENAI_API_KEY
        if generate_ai and api_key:
            try:
                ai_detail = await cls._query_ai_explainer(code, language, raw_error, extracted_line, api_key)
                if ai_detail:
                    return ai_detail
            except Exception as e:
                logger.warning(f"AI recommendation lookup failed: {e}. Using deterministic analysis.")

        return ExecutionErrorDetail(
            line_number=extracted_line,
            error_type=status,
            raw_message=raw_error[:500],
            what_went_wrong=what_went_wrong,
            why_it_happened=why_it_happened,
            how_to_fix=how_to_fix,
            recommended_patch=None,
            corrected_code=corrected_code,
            concept_to_learn=concept_to_learn,
        )

    @classmethod
    async def _query_ai_explainer(
        cls, code: str, language: str, raw_error: str, line_no: Optional[int], api_key: str
    ) -> Optional[ExecutionErrorDetail]:
        prompt = f"""You are an expert programming instructor and compiler diagnostician.
The user ran the following {language} code and encountered a real compiler/runtime error:

Source Code:
```
{code}
```

Error Message from Compiler/Interpreter:
```
{raw_error}
```

Line Indicated by Compiler: {line_no or 'Unknown'}

Provide a beginner-friendly diagnosis and full corrected code.
Respond ONLY with a valid JSON object matching this schema:
{{
  "what_went_wrong": "Short, clear summary of what broke",
  "why_it_happened": "Intuitive explanation of why the compiler or runtime failed",
  "line_number": {line_no or 1},
  "how_to_fix": "Step-by-step instruction on how to resolve the error",
  "concept_to_learn": "Key programming concept to avoid this mistake in the future",
  "corrected_code": "Full corrected executable code"
}}
"""
        # Call Gemini or OpenAI
        if settings.DEFAULT_AI_PROVIDER == "openai" or not settings.GEMINI_API_KEY:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    content = json.loads(data["choices"][0]["message"]["content"])
                    return ExecutionErrorDetail(
                        line_number=content.get("line_number") or line_no,
                        error_type="Compiler/Runtime Error",
                        raw_message=raw_error[:500],
                        what_went_wrong=content.get("what_went_wrong", ""),
                        why_it_happened=content.get("why_it_happened", ""),
                        how_to_fix=content.get("how_to_fix", ""),
                        concept_to_learn=content.get("concept_to_learn", ""),
                        corrected_code=content.get("corrected_code"),
                    )
        else:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.DEFAULT_AI_MODEL}:generateContent?key={api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    text = data["candidates"][0]["content"]["parts"][0]["text"]
                    content = json.loads(text)
                    return ExecutionErrorDetail(
                        line_number=content.get("line_number") or line_no,
                        error_type="Compiler/Runtime Error",
                        raw_message=raw_error[:500],
                        what_went_wrong=content.get("what_went_wrong", ""),
                        why_it_happened=content.get("why_it_happened", ""),
                        how_to_fix=content.get("how_to_fix", ""),
                        concept_to_learn=content.get("concept_to_learn", ""),
                        corrected_code=content.get("corrected_code"),
                    )

        return None
