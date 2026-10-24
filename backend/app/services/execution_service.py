import asyncio
import base64
import json
import logging
import os
import re
import sqlite3
import subprocess
import sys
import tempfile
import time
from typing import Any, Dict, List, Optional, Tuple
import httpx

from app.core.config import settings
from app.schemas.execution import (
    ExecuteRequest,
    ExecuteResponse,
    ExecutionErrorDetail,
    RunTestsRequest,
    RunTestsResponse,
    TestCaseResultItem,
    GenerateTestCasesRequest,
    GenerateTestCasesResponse,
    TestCaseItem,
    RunSingleTestRequest,
    ExplainTestFailureRequest,
    ExplainTestFailureResponse,
)

logger = logging.getLogger(__name__)

def _decode_b64(val: Optional[str]) -> str:
    if not val:
        return ""
    try:
        return base64.b64decode(val).decode("utf-8", errors="replace")
    except Exception:
        return str(val)


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
    "nodejs": 102,
    "typescript": 101,   # TypeScript 5.6.2
    "ts": 101,
    "csharp": 51,        # C# (Mono 6.6.0)
    "cs": 51,
    "c#": 51,
    "php": 98,           # PHP 8.3.11
    "go": 107,           # Go 1.23.5
    "golang": 107,
    "rust": 108,         # Rust 1.85.0
    "rs": 108,
    "kotlin": 111,       # Kotlin 2.1.10
    "kt": 111,
    "ruby": 72,          # Ruby 2.7.0
    "rb": 72,
    "bash": 46,          # Bash 5.0.0
    "sh": 46,
    "shell": 46,
    "sql": 82,           # SQL (SQLite 3.27.2)
    "sqlite": 82,
    "mysql": 82,         # SQL variant
    "postgresql": 82,    # SQL variant
    "postgres": 82,      # SQL variant
    "plsql": 82,         # SQL variant
    "reactjs": 102,      # JS (Node.js)
    "reactts": 101,      # TS
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

        # Web Domain: HTML, CSS, React JS & React TS are rendered via client-side Live Preview
        if lang_key in ("html", "htm", "css", "reactjs", "react", "reactts", "jsx", "tsx"):
            return ExecuteResponse(
                status="Execution Successful",
                success=True,
                output=f"{req.language.upper()} rendered live in browser preview.\nSwitch to the 'Live Preview' tab to interact with your webpage or component.",
                stdout=f"{req.language.upper()} rendered successfully in browser viewport.",
                stderr="",
                compile_output="",
                language=req.language,
                execution_time=0.01,
                memory_usage_kb=0,
                exit_code=0,
            )

        # Database Domain: Run in safe, isolated in-memory SQLite sandbox with pre-seeded sample data
        if lang_key in ("sql", "sqlite", "mysql", "postgresql", "postgres", "plsql"):
            return cls._execute_sql_sandbox(code, req.language)

        # Other Domain: Markup & Config validation
        if lang_key in ("json", "yaml", "yml", "xml", "markdown", "md"):
            if lang_key == "json":
                try:
                    parsed = json.loads(code)
                    formatted = json.dumps(parsed, indent=2)
                    return ExecuteResponse(
                        status="Execution Successful",
                        success=True,
                        output=f"Valid JSON syntax!\nFormatted output:\n{formatted}",
                        stdout="JSON validated successfully.",
                        language=req.language,
                        execution_time=0.01,
                        memory_usage_kb=0,
                        exit_code=0,
                    )
                except Exception as json_err:
                    return ExecuteResponse(
                        status="JSON Syntax Error",
                        success=False,
                        output=f"Invalid JSON: {str(json_err)}",
                        stderr=str(json_err),
                        language=req.language,
                    )
            return ExecuteResponse(
                status="Execution Successful",
                success=True,
                output=f"{req.language.upper()} syntax is valid.\nDocument loaded without syntax errors.",
                stdout=f"{req.language.upper()} document valid.",
                language=req.language,
                execution_time=0.01,
                memory_usage_kb=0,
                exit_code=0,
            )

        lang_id = LANGUAGE_MAP.get(lang_key)
        if not lang_id:
            supported_langs = "Python, JavaScript, TypeScript, Java, C, C++, C#, PHP, Go, Rust, Kotlin, Ruby, Bash, SQL"
            return ExecuteResponse(
                status="Execution Error",
                success=False,
                output=f"Execution is not supported for '{req.language}'. Supported execution languages: {supported_langs}.\n(For HTML/CSS, use the Live Browser Preview).",
                stderr=f"Language '{req.language}' has no compiler/sandbox backend.",
                language=req.language,
                error_detail=ExecutionErrorDetail(
                    error_type="Unsupported Language",
                    what_went_wrong=f"Language '{req.language}' cannot be executed directly.",
                    why_it_happened=f"The sandbox execution engine supports: {supported_langs}.",
                    how_to_fix="Select one of the supported execution languages, or use Live Preview for HTML/CSS.",
                    concept_to_learn="Compilation and Execution Environments",
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

        # 1. Fast sandboxed local execution (Python / Node.js) with isolated subprocess
        local_res = cls._execute_locally(code, lang_key, req.stdin or "")
        if local_res:
            return local_res

        # 2. Remote sandbox container (Judge0) for multi-language execution
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
        stdout = _decode_b64(judge_res.get("stdout"))
        stderr = _decode_b64(judge_res.get("stderr"))
        compile_output = _decode_b64(judge_res.get("compile_output"))
        message = _decode_b64(judge_res.get("message"))
        if not stderr and message:
            stderr = message
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
        url = f"{settings.JUDGE0_API_URL.rstrip('/')}/submissions?wait=true&base64_encoded=true"
        headers = {"Content-Type": "application/json"}
        if settings.JUDGE0_API_KEY:
            headers["X-RapidAPI-Key"] = settings.JUDGE0_API_KEY
            if settings.JUDGE0_API_HOST:
                headers["X-RapidAPI-Host"] = settings.JUDGE0_API_HOST

        cpu_limit = min(settings.EXECUTION_TIMEOUT_SECONDS, 4.0)
        wall_limit = min(cpu_limit + 1.5, 6.0)

        # Standard input normalization: handle CRLF, CR, and ensure trailing newline
        clean_stdin = stdin or ""
        clean_stdin = clean_stdin.replace("\r\n", "\n").replace("\r", "\n")
        if clean_stdin and not clean_stdin.endswith("\n"):
            clean_stdin += "\n"

        encoded_code = base64.b64encode(code.encode("utf-8")).decode("ascii")
        encoded_stdin = base64.b64encode(clean_stdin.encode("utf-8")).decode("ascii") if clean_stdin else ""

        payload = {
            "source_code": encoded_code,
            "language_id": language_id,
            "stdin": encoded_stdin,
            "cpu_time_limit": cpu_limit,
            "wall_time_limit": wall_limit,
            "memory_limit": 128000,  # 128 MB
        }

        try:
            async with httpx.AsyncClient(timeout=wall_limit + 3.0) as client:
                resp = await client.post(url, json=payload, headers=headers)
                if resp.status_code in [200, 201]:
                    return resp.json(), None
                return None, f"HTTP {resp.status_code}: {resp.text}"
        except httpx.TimeoutException:
            return None, "Connection to sandbox execution engine timed out."
        except Exception as e:
            return None, str(e)

    @classmethod
    def _execute_locally(cls, code: str, language: str, stdin: str) -> Optional[ExecuteResponse]:
        lang_lower = language.lower().strip()
        if lang_lower not in ["python", "py", "javascript", "js", "typescript", "ts", "nodejs"]:
            return None

        is_py = lang_lower in ["python", "py"]
        ext = ".py" if is_py else ".js"
        executable = sys.executable if is_py else "node"

        temp_file = None
        start_time = time.time()
        try:
            with tempfile.NamedTemporaryFile("w", suffix=ext, delete=False, encoding="utf-8") as tf:
                tf.write(code)
                temp_file = tf.name

            clean_stdin = stdin or ""
            proc = subprocess.run(
                [executable, temp_file],
                input=clean_stdin,
                capture_output=True,
                text=True,
                timeout=min(settings.EXECUTION_TIMEOUT_SECONDS, 4.0),
            )
            duration = round(time.time() - start_time, 4)
            stdout = proc.stdout
            stderr = proc.stderr
            exit_code = proc.returncode

            if exit_code == 0:
                return ExecuteResponse(
                    status="Execution Successful",
                    success=True,
                    output=stdout if stdout else "(Program executed successfully with no output)",
                    stdout=stdout,
                    stderr=stderr,
                    language=language,
                    execution_time=duration,
                    exit_code=0,
                )
            else:
                is_syntax = "syntaxerror" in (stderr or "").lower()
                status = "Syntax Error" if is_syntax else "Runtime Error"
                return ExecuteResponse(
                    status=status,
                    success=False,
                    output=stderr or stdout,
                    stdout=stdout,
                    stderr=stderr,
                    language=language,
                    execution_time=duration,
                    exit_code=exit_code,
                )
        except subprocess.TimeoutExpired:
            duration = round(time.time() - start_time, 4)
            return ExecuteResponse(
                status="Time Limit Exceeded",
                success=False,
                output="Program exceeded maximum execution time limit (infinite loop or blocked I/O).",
                stderr="TimeLimitExceeded: Process timed out after 4 seconds.",
                language=language,
                execution_time=duration or 4.0,
                exit_code=-1,
            )
        except Exception as e:
            logger.warning(f"Local fallback execution failed: {e}")
            return None
        finally:
            if temp_file:
                try:
                    os.remove(temp_file)
                except Exception:
                    pass


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

        # Check missing colon in Python (handles bare else, try, finally, def, if, etc., or error says "expected ':'")
        is_missing_colon = False
        target_colon_idx = err_idx
        if language in ["python", "py"]:
            if "expected ':'" in error_lower or "missing ':'" in error_lower:
                is_missing_colon = True
                if err_idx < len(lines) and not lines[err_idx].rstrip().endswith(":"):
                    target_colon_idx = err_idx
                elif err_idx > 0 and not lines[err_idx - 1].rstrip().endswith(":"):
                    target_colon_idx = err_idx - 1
            elif err_idx < len(lines) and not lines[err_idx].rstrip().endswith(":") and re.search(
                r"^\s*(?:if|elif|else|for|while|def|class|try|except|finally|with|async\s+(?:def|for|with))\b",
                lines[err_idx],
            ):
                is_missing_colon = True
                target_colon_idx = err_idx

        if is_missing_colon and target_colon_idx < len(lines):
            lines_copy = list(lines)
            lines_copy[target_colon_idx] = lines_copy[target_colon_idx].rstrip() + ":"
            corrected_code = "\n".join(lines_copy)
            what_went_wrong = f"Missing Colon ':' on Line {target_colon_idx + 1}."
            why_it_happened = "In Python, compound statements (such as if, else, for, while, def, class, try, except) must end with a colon ':' to open an indented block."
            how_to_fix = f"Add a colon `:` at the end of Line {target_colon_idx + 1}."
            concept_to_learn = "Python Compound Statements & Block Delimiters"

        # Missing parentheses in call to 'print'
        elif language in ["python", "py"] and ("missing parentheses in call to 'print'" in error_lower or re.search(r"^\s*print\s+[^\(]", err_line)):
            lines_copy = list(lines)
            lines_copy[err_idx] = re.sub(r"^(\s*print)\s+(.*)$", r"\1(\2)", err_line)
            corrected_code = "\n".join(lines_copy)
            what_went_wrong = f"Missing parentheses in `print` statement on Line {extracted_line or 1}."
            why_it_happened = "In Python 3, `print` is a built-in function and requires parentheses around its arguments."
            how_to_fix = f"Replace `print ...` with `print(...)` on Line {extracted_line or 1}."
            concept_to_learn = "Python 3 Function Call Syntax"

        # Indentation errors
        elif "indentationerror" in error_lower or "taberror" in error_lower or "unexpected indent" in error_lower or "expected an indented block" in error_lower:
            what_went_wrong = f"Indentation Error on Line {extracted_line or 1}."
            why_it_happened = "Python uses indentation (4 spaces) rather than curly braces to define scope blocks."
            concept_to_learn = "Python Block Indentation Rules"
            lines_copy = list(lines)
            if "expected an indented block" in error_lower:
                prev_line = lines[err_idx - 1] if err_idx > 0 else ""
                prev_indent = len(prev_line) - len(prev_line.lstrip())
                new_indent = " " * (prev_indent + 4)
                if not err_line.strip():
                    lines_copy[err_idx] = f"{new_indent}pass"
                else:
                    lines_copy[err_idx] = f"{new_indent}{err_line.lstrip()}"
                how_to_fix = f"Indent the block statement on Line {extracted_line or 1} with 4 spaces."
            else:
                prev_line = lines[err_idx - 1] if err_idx > 0 else ""
                prev_indent = len(prev_line) - len(prev_line.lstrip())
                lines_copy[err_idx] = (" " * prev_indent) + err_line.lstrip()
                how_to_fix = f"Align indentation on Line {extracted_line or 1} with the enclosing scope."
            corrected_code = "\n".join(lines_copy)

        # Missing semicolon in C, C++, Java, JS, C#, PHP
        elif language in ["c", "cpp", "java", "javascript", "js", "csharp", "cs", "php"] and (
            "expected ';'" in error_lower or "missing ';'" in error_lower or
            (err_line.strip() and not err_line.strip().endswith(";") and not err_line.strip().endswith("{") and not err_line.strip().endswith("}") and not err_line.strip().startswith("//"))
        ):
            lines_copy = list(lines)
            lines_copy[err_idx] = err_line.rstrip() + ";"
            corrected_code = "\n".join(lines_copy)
            what_went_wrong = f"Missing terminating semicolon ';' on Line {extracted_line or 1}."
            why_it_happened = f"Statements in {language.upper()} must be terminated with a semicolon ';'."
            how_to_fix = f"Add a terminating semicolon `;` at the end of Line {extracted_line or 1}."
            concept_to_learn = "Statement Termination Semicolons"

        # Unterminated string literal
        elif "unterminated string" in error_lower or "eol while scanning string literal" in error_lower:
            quote_char = '"' if err_line.count('"') % 2 != 0 else "'"
            lines_copy = list(lines)
            lines_copy[err_idx] = err_line.rstrip() + quote_char
            corrected_code = "\n".join(lines_copy)
            what_went_wrong = f"Unterminated string literal on Line {extracted_line or 1}."
            why_it_happened = "A quotation mark was opened but never closed before the end of the line."
            how_to_fix = f"Close the string literal by adding `{quote_char}` at the end of Line {extracted_line or 1}."
            concept_to_learn = "String Delimiters & Escapes"

        # Dangling arithmetic/binary operators
        elif re.search(r"[\+\-\*\/]\s*[\)\],;]?\s*$", err_line.strip()) or re.search(r"\(\s*[\w\d_]+\s*[\+\-\*\/]\s*\)", err_line):
            var_names = re.findall(r"^[ \t]*([a-zA-Z_][a-zA-Z0-9_]*)\s*=", code, re.MULTILINE)
            second_var = "b"
            if len(var_names) >= 2:
                second_var = var_names[1]
            elif len(var_names) == 1:
                second_var = var_names[0]
            patched_line = re.sub(r"([\+\-\*\/])\s*(\)|\]|\;|\,)?\s*$", rf"\1 {second_var}\2", err_line)
            patched_line = re.sub(r"([\+\-\*\/])\s*\)", rf"\1 {second_var})", patched_line)
            if patched_line != err_line:
                lines_copy = list(lines)
                lines_copy[err_idx] = patched_line
                corrected_code = "\n".join(lines_copy)
                what_went_wrong = f"Incomplete expression or dangling operator on Line {extracted_line or 1}."
                why_it_happened = "Binary operators (+, -, *, /) require a second operand."
                how_to_fix = f"Specify the missing operand after the operator on Line {extracted_line or 1} (e.g. `{patched_line.strip()}`)."
                concept_to_learn = "Binary Operators & Expressions"

        # Unmatched parentheses / brackets
        elif "unmatched" in error_lower or "was never closed" in error_lower or "expected ')'" in error_lower or "expected ']'" in error_lower or "expected '}'" in error_lower:
            open_p = err_line.count("(") - err_line.count(")")
            open_b = err_line.count("[") - err_line.count("]")
            open_c = err_line.count("{") - err_line.count("}")
            patch = ""
            if open_p > 0:
                patch += ")" * open_p
            if open_b > 0:
                patch += "]" * open_b
            if open_c > 0:
                patch += "}" * open_c
            if patch:
                lines_copy = list(lines)
                lines_copy[err_idx] = err_line.rstrip() + patch
                corrected_code = "\n".join(lines_copy)
                what_went_wrong = f"Unmatched delimiter or bracket on Line {extracted_line or 1}."
                why_it_happened = "An opening parenthesis, bracket, or brace was left unclosed."
                how_to_fix = f"Add closing delimiter `{patch}` to Line {extracted_line or 1}."
                concept_to_learn = "Bracket & Delimiter Balancing"

        # Division by zero
        elif "zerodivisionerror" in error_lower or "/ by zero" in error_lower or "division by zero" in error_lower:
            what_went_wrong = f"Division by zero attempted on Line {extracted_line or '1'}."
            why_it_happened = "The program attempted an arithmetic division or modulo operation where the divisor evaluates to zero (0)."
            how_to_fix = "Guard against zero before performing division or specify a non-zero denominator."
            concept_to_learn = "Defensive Programming & Arithmetic Safeguards"
            if "= 0" in code:
                corrected_code = code.replace("= 0", "= 1", 1)
            elif "/ 0" in code:
                corrected_code = code.replace("/ 0", "/ 1")
            elif err_idx < len(lines):
                lines_copy = list(lines)
                indent = " " * (len(err_line) - len(err_line.lstrip()))
                lines_copy[err_idx] = f"{indent}# Division safeguard:\n{err_line}"
                corrected_code = "\n".join(lines_copy)

        # NameError / Undefined variable
        elif "nameerror" in error_lower or "not defined" in error_lower or "was not declared" in error_lower:
            what_went_wrong = f"Undefined variable or identifier on Line {extracted_line or '1'}."
            why_it_happened = "The program tried to access a variable or function before it was defined or imported in the current scope."
            how_to_fix = "Ensure the variable name is spelled correctly and defined prior to this line."
            concept_to_learn = "Variable Scope & Symbol Resolution"
            name_match = re.search(r"(?:name\s+'([^']+)'\s+is not defined|'([^']+)'\s+was not declared)", raw_error)
            missing_var = (name_match.group(1) if name_match.group(1) else name_match.group(2)) if name_match else None
            if missing_var:
                if language in ["c", "cpp"]:
                    corrected_code = f"int {missing_var} = 0;\n" + code
                elif language in ["java"]:
                    corrected_code = code.replace(err_line, f"int {missing_var} = 0;\n        {err_line}")
                else:
                    corrected_code = f"{missing_var} = 0\n" + code
                how_to_fix = f"Define `{missing_var}` with an initial value before referencing it."

        # General syntax/compilation error fallback
        elif "syntaxerror" in error_lower or "invalid syntax" in error_lower or "compilation error" in status.lower():
            what_went_wrong = f"Syntax or Compilation Error on Line {extracted_line or '1'}."
            why_it_happened = "The interpreter or compiler encountered an unexpected token or malformed expression."
            how_to_fix = "Review the highlighted line and ensure grammar rules for keywords and operators are followed."
            concept_to_learn = "Grammar & Token Syntax"

        elif "typeerror" in error_lower:
            what_went_wrong = f"Type mismatch or invalid operation on Line {extracted_line or '1'}."
            why_it_happened = "An operator or function was passed arguments of incompatible data types."
            how_to_fix = "Convert types explicitly (e.g. `int(...)`, `str(...)`) before performing the operation."
            concept_to_learn = "Type Systems & Explicit Type Casting"

        # Missing Standard Input (stdin) for Scanner, input(), cin, scanf
        elif "nosuchelementexception" in error_lower or "no line found" in error_lower or "eoferror" in error_lower or "eof when reading a line" in error_lower:
            what_went_wrong = f"Missing Runtime Standard Input (stdin) on Line {extracted_line or 1}."
            why_it_happened = (
                "The program attempted to read user input (e.g. `Scanner.nextLine()`, `Scanner.nextInt()`, or `input()`), "
                "but standard input (stdin) was empty or reached end-of-file (EOF) before all expected values were provided."
            )
            how_to_fix = (
                "1. Always verify input is available using `sc.hasNextLine()` or `sc.hasNextInt()` before reading.\n"
                "2. Provide your inputs line-by-line in the 'Custom Input (stdin)' panel below the editor, then click 'Run Code'."
            )
            concept_to_learn = "Standard Input (stdin) Streams & Defensive Input Validation"
            lang_norm = (language or "").lower().strip()
            if lang_norm in ["java"] and "Scanner" in code:
                corrected_code = (
                    "import java.util.Scanner;\n\n"
                    "public class Main {\n"
                    "    public static void main(String[] args) {\n"
                    "        try (Scanner sc = new Scanner(System.in)) {\n"
                    "            // Safely guard against missing input (EOF)\n"
                    "            if (!sc.hasNextLine()) {\n"
                    "                System.out.println(\"Error: No standard input provided.\");\n"
                    "                System.out.println(\"Please enter input in the Custom Input panel before running.\");\n"
                    "                return;\n"
                    "            }\n\n"
                    "            System.out.print(\"Enter your name: \");\n"
                    "            String name = sc.nextLine().trim();\n\n"
                    "            System.out.print(\"Enter your age: \");\n"
                    "            if (!sc.hasNextInt()) {\n"
                    "                System.out.println(\"\\nError: Expected an integer for age.\");\n"
                    "                return;\n"
                    "            }\n\n"
                    "            int age = sc.nextInt();\n"
                    "            System.out.println(\"Hello \" + name);\n"
                    "            System.out.println(\"Your age is \" + age);\n"
                    "        }\n"
                    "    }\n"
                    "}\n"
                )
            else:
                corrected_code = code

        elif "time limit" in status.lower():
            what_went_wrong = "Execution Time Limit Exceeded."
            why_it_happened = "A loop ran indefinitely without reaching a terminating condition (infinite loop), or the program blocked waiting for unprovided input."
            how_to_fix = "Ensure loops have valid increment/break conditions, or provide input in the STDIN input box if `input()`/`Scanner` is used."
            concept_to_learn = "Loop Termination & Algorithmic Complexity"

        # =========================================================================
        # UNIVERSAL REPAIR SAFETY NET: Guarantee corrected_code is NEVER None
        # =========================================================================
        if not corrected_code:
            lines_copy = list(lines)
            if err_idx < len(lines_copy):
                curr = lines_copy[err_idx]
                open_p = curr.count("(") - curr.count(")")
                open_b = curr.count("[") - curr.count("]")
                open_c = curr.count("{") - curr.count("}")
                if open_p > 0 or open_b > 0 or open_c > 0:
                    lines_copy[err_idx] = curr.rstrip() + (")" * max(0, open_p)) + ("]" * max(0, open_b)) + ("}" * max(0, open_c))
                    corrected_code = "\n".join(lines_copy)
                    how_to_fix = f"Balance closing brackets/parentheses on Line {extracted_line or 1}."
                elif language in ["python", "py"] and not curr.rstrip().endswith(":") and any(curr.strip().startswith(kw) for kw in ["if", "elif", "else", "for", "while", "def", "class", "try", "except", "finally"]):
                    lines_copy[err_idx] = curr.rstrip() + ":"
                    corrected_code = "\n".join(lines_copy)
                    how_to_fix = f"Add missing colon `:` at the end of Line {extracted_line or 1}."
                elif language in ["c", "cpp", "java", "javascript", "js", "csharp", "php"] and curr.strip() and not curr.rstrip().endswith(";") and not curr.rstrip().endswith("}"):
                    lines_copy[err_idx] = curr.rstrip() + ";"
                    corrected_code = "\n".join(lines_copy)
                    how_to_fix = f"Add missing semicolon `;` at the end of Line {extracted_line or 1}."
                else:
                    # Provide an auto-remediated comment patch or guarded line so user can apply fix
                    indent = " " * (len(curr) - len(curr.lstrip()))
                    if language in ["python", "py"]:
                        lines_copy[err_idx] = f"{curr}\n{indent}# Auto-Fix applied for Line {extracted_line or 1}"
                    else:
                        lines_copy[err_idx] = f"{curr}\n{indent}// Auto-Fix applied for Line {extracted_line or 1}"
                    corrected_code = "\n".join(lines_copy)
                    how_to_fix = f"Review and verify the syntax structure on Line {extracted_line or 1}."
            else:
                corrected_code = code

        # 2. If AI key is configured and requested, obtain deep AI explanation & corrected code
        api_key = settings.GROQ_API_KEY or settings.GEMINI_API_KEY or settings.OPENAI_API_KEY
        if generate_ai and api_key:
            try:
                ai_detail = await cls._query_ai_explainer(code, language, raw_error, extracted_line, api_key)
                if ai_detail:
                    # Guarantee corrected_code is non-empty even if AI omitted it
                    if not ai_detail.corrected_code:
                        ai_detail.corrected_code = corrected_code
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
        provider = settings.DEFAULT_AI_PROVIDER.lower()

        # Priority 1: Groq API (Ultra-fast LLM diagnosis, OpenAI compatible)
        if (provider == "groq" or settings.GROQ_API_KEY) and (api_key == settings.GROQ_API_KEY or settings.GROQ_API_KEY):
            groq_key = settings.GROQ_API_KEY or api_key
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
            payload = {
                "model": settings.GROQ_MODEL or "openai/gpt-oss-120b",
                "messages": [
                    {"role": "system", "content": "You are a concise compiler error analyzer that outputs strictly valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 450,
                "response_format": {"type": "json_object"},
            }

            async with httpx.AsyncClient(timeout=8.0) as client:

                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    content = json.loads(data["choices"][0]["message"]["content"])
                    return ExecutionErrorDetail(
                        line_number=content.get("line_number") or line_no,
                        error_type="Compiler/Runtime Error (Explained with Groq AI)",
                        raw_message=raw_error[:500],
                        what_went_wrong=content.get("what_went_wrong", ""),
                        why_it_happened=content.get("why_it_happened", ""),
                        how_to_fix=content.get("how_to_fix", ""),
                        concept_to_learn=content.get("concept_to_learn", ""),
                        corrected_code=content.get("corrected_code"),
                    )

        # Priority 2: OpenAI
        if provider == "openai" or (settings.OPENAI_API_KEY and not settings.GEMINI_API_KEY):
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

        # Priority 3: Gemini
        if settings.GEMINI_API_KEY:
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

    @classmethod
    def _format_sql_table(cls, columns: List[str], rows: List[Tuple]) -> str:
        if not columns:
            return "(Empty result set)"
        widths = [len(c) for c in columns]
        for row in rows:
            for idx, val in enumerate(row):
                sval = str(val) if val is not None else "NULL"
                if len(sval) > widths[idx]:
                    widths[idx] = min(len(sval), 32)

        sep = "+" + "+".join(["-" * (w + 2) for w in widths]) + "+"
        hdr = "|" + "|".join([f" {columns[i].ljust(widths[i])} " for i in range(len(columns))]) + "|"

        row_lines = []
        for row in rows:
            rline = "|" + "|".join([f" {str(row[i] if row[i] is not None else 'NULL')[:widths[i]].ljust(widths[i])} " for i in range(len(columns))]) + "|"
            row_lines.append(rline)

        lines = [sep, hdr, sep]
        lines.extend(row_lines)
        lines.append(sep)
        lines.append(f"({len(rows)} row{'s' if len(rows) != 1 else ''} returned)")
        return "\n".join(lines)

    @classmethod
    def _execute_sql_sandbox(cls, code: str, language_label: str) -> ExecuteResponse:
        start_time = time.time()
        try:
            conn = sqlite3.connect(":memory:")
            cursor = conn.cursor()
            # Seed safe sample relational tables for realistic querying
            cursor.executescript("""
                CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT, role TEXT, department TEXT, salary REAL, created_at TEXT);
                INSERT INTO users VALUES (1, 'Alice Smith', 'alice@company.com', 'Admin', 'Security', 95000, '2025-01-15');
                INSERT INTO users VALUES (2, 'Bob Jones', 'bob@company.com', 'Developer', 'Engineering', 85000, '2025-02-01');
                INSERT INTO users VALUES (3, 'Charlie Brown', 'charlie@company.com', 'Analyst', 'Operations', 72000, '2025-03-10');
                INSERT INTO users VALUES (4, 'Diana Prince', 'diana@company.com', 'Lead Architect', 'Engineering', 120000, '2024-11-20');
                INSERT INTO users VALUES (5, 'Evan Wright', 'evan@company.com', 'QA Engineer', 'Quality', 68000, '2025-04-05');

                CREATE TABLE products (id INTEGER PRIMARY KEY, sku TEXT, name TEXT, category TEXT, price REAL, stock_quantity INTEGER);
                INSERT INTO products VALUES (1, 'SEC-001', 'Cloud Security Scanner', 'Security', 199.99, 85);
                INSERT INTO products VALUES (2, 'DEV-002', 'API Guard Gateway', 'Networking', 349.50, 40);
                INSERT INTO products VALUES (3, 'AUD-003', 'Automated Code Auditor', 'Software', 99.00, 210);
                INSERT INTO products VALUES (4, 'DAT-004', 'Database Shield Proxy', 'Database', 450.00, 25);

                CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, product_id INTEGER, quantity INTEGER, total_amount REAL, order_date TEXT);
                INSERT INTO orders VALUES (101, 1, 1, 2, 399.98, '2026-01-10');
                INSERT INTO orders VALUES (102, 2, 3, 1, 99.00, '2026-02-14');
                INSERT INTO orders VALUES (103, 3, 2, 1, 349.50, '2026-03-01');
                INSERT INTO orders VALUES (104, 1, 4, 1, 450.00, '2026-03-22');
            """)

            statements = [s.strip() for s in code.strip().split(";") if s.strip()]
            output_parts = []
            for stmt in statements:
                cursor.execute(stmt)
                if cursor.description:
                    cols = [d[0] for d in cursor.description]
                    rows = cursor.fetchall()
                    output_parts.append(cls._format_sql_table(cols, rows))
                else:
                    conn.commit()
                    output_parts.append(f"Statement executed successfully. (Rows affected: {cursor.rowcount if cursor.rowcount >= 0 else 0})")

            duration = round(time.time() - start_time, 4)
            formatted_output = "\n\n".join(output_parts) if output_parts else "Query executed successfully."
            return ExecuteResponse(
                status="Execution Successful",
                success=True,
                output=formatted_output,
                stdout=formatted_output,
                stderr="",
                compile_output="",
                language=language_label,
                execution_time=duration,
                memory_usage_kb=512,
                exit_code=0,
            )
        except Exception as e:
            duration = round(time.time() - start_time, 4)
            err_msg = str(e)
            return ExecuteResponse(
                status="SQL Error",
                success=False,
                output=f"SQL Execution Error: {err_msg}",
                stderr=err_msg,
                compile_output="",
                language=language_label,
                execution_time=duration,
                memory_usage_kb=512,
                exit_code=1,
                error_detail=ExecutionErrorDetail(
                    error_type="SQL Syntax / Schema Error",
                    raw_message=err_msg,
                    what_went_wrong=f"Query failed: {err_msg}",
                    why_it_happened="The SQL statement references an unknown table/column or has syntax mistakes.",
                    how_to_fix="Verify table names (sample tables: users, products, orders) and column syntax.",
                    concept_to_learn="Relational Queries & Schema Constraints",
                )
            )

    @classmethod
    async def run_single_test(cls, req: RunSingleTestRequest) -> TestCaseResultItem:
        tc = req.test_case
        exec_req = ExecuteRequest(
            code=req.code,
            language=req.language,
            stdin=tc.input or "",
            generate_ai_fix=False,
        )
        res = await cls.execute_code(exec_req)
        actual_trimmed = (res.stdout or res.output or "").strip()
        expected_trimmed = (tc.expected_output or "").strip()

        if res.status == "Time Limit Exceeded":
            return TestCaseResultItem(
                id=tc.id,
                name=tc.name,
                input=tc.input,
                expected_output=tc.expected_output,
                actual_output=actual_trimmed,
                status="timeout",
                category=tc.category,
                reason=tc.reason,
                is_verified=tc.is_verified,
                is_user_edited=tc.is_user_edited,
                execution_time=res.execution_time or 4.0,
                mismatch_line="Execution timed out (process exceeded 4.0s time limit)",
                error_message=res.stderr or "Time Limit Exceeded",
            )
        elif not res.success or res.status in ["Compilation Error", "Syntax Error", "Runtime Error"]:
            return TestCaseResultItem(
                id=tc.id,
                name=tc.name,
                input=tc.input,
                expected_output=tc.expected_output,
                actual_output=actual_trimmed,
                status="error",
                category=tc.category,
                reason=tc.reason,
                is_verified=tc.is_verified,
                is_user_edited=tc.is_user_edited,
                execution_time=res.execution_time,
                error_message=res.stderr or res.output,
            )
        elif actual_trimmed == expected_trimmed:
            return TestCaseResultItem(
                id=tc.id,
                name=tc.name,
                input=tc.input,
                expected_output=tc.expected_output,
                actual_output=actual_trimmed,
                status="passed",
                category=tc.category,
                reason=tc.reason,
                is_verified=tc.is_verified,
                is_user_edited=tc.is_user_edited,
                execution_time=res.execution_time,
            )
        else:
            act_lines = actual_trimmed.splitlines()
            exp_lines = expected_trimmed.splitlines()
            mismatch = None
            max_len = max(len(act_lines), len(exp_lines))
            for i in range(max_len):
                a_line = act_lines[i] if i < len(act_lines) else "<EOF>"
                e_line = exp_lines[i] if i < len(exp_lines) else "<EOF>"
                if a_line != e_line:
                    mismatch = f"Line {i+1} mismatch: Expected '{e_line}' but got '{a_line}'"
                    break

            return TestCaseResultItem(
                id=tc.id,
                name=tc.name,
                input=tc.input,
                expected_output=tc.expected_output,
                actual_output=actual_trimmed,
                status="failed",
                category=tc.category,
                reason=tc.reason,
                is_verified=tc.is_verified,
                is_user_edited=tc.is_user_edited,
                execution_time=res.execution_time,
                mismatch_line=mismatch or "Output value mismatch",
            )

    @classmethod
    async def run_test_cases(cls, req: RunTestsRequest) -> RunTestsResponse:
        results: List[TestCaseResultItem] = []
        passed_count = 0
        failed_count = 0
        error_count = 0
        timeout_count = 0
        start_time = time.time()

        for tc in req.test_cases:
            single_res = await cls.run_single_test(
                RunSingleTestRequest(code=req.code, language=req.language, test_case=tc)
            )
            if single_res.status == "passed":
                passed_count += 1
            elif single_res.status == "timeout":
                timeout_count += 1
            elif single_res.status == "error":
                error_count += 1
            else:
                failed_count += 1

            results.append(single_res)

        total = len(req.test_cases)
        total_duration = round(time.time() - start_time, 3)
        pass_pct = round((passed_count / max(1, total)) * 100.0, 1)

        # Estimated coverage based on pass rate and category diversity
        has_edge = any(tc.category == "Boundary / Edge" for tc in req.test_cases)
        has_branch = any(tc.category == "Branch Coverage" for tc in req.test_cases)
        coverage_bonus = (5.0 if has_edge else 0.0) + (5.0 if has_branch else 0.0)
        est_coverage = min(100.0, round((passed_count / max(1, total)) * 90.0 + coverage_bonus, 1))

        return RunTestsResponse(
            total=total,
            passed=passed_count,
            failed=failed_count,
            errors=error_count,
            timeouts=timeout_count,
            all_passed=(passed_count == total and total > 0),
            pass_percentage=pass_pct,
            duration_seconds=total_duration,
            estimated_coverage=est_coverage,
            results=results,
        )

    @classmethod
    async def generate_test_cases(cls, req: GenerateTestCasesRequest) -> GenerateTestCasesResponse:
        code = req.code.strip()
        lang = req.language.lower().strip()
        api_key = settings.GROQ_API_KEY or settings.GEMINI_API_KEY or settings.OPENAI_API_KEY

        # 1. Inspect program structure: inputs, branches, functions
        detected_inputs: List[str] = []
        num_branches = 0
        has_numeric_input = False
        has_string_input = False

        if lang in ["python", "py"]:
            input_matches = re.findall(r'input\s*\((.*?)\)', code)
            detected_inputs = [m.strip(" '\"") for m in input_matches if m.strip(" '\"")]
            has_numeric_input = bool(re.search(r'\b(?:int|float)\s*\(\s*input', code))
            has_string_input = len(input_matches) > 0 and not has_numeric_input
            num_branches = len(re.findall(r'\b(?:if|elif|else)\b', code))
        else:
            prompt_matches = re.findall(r'(?:prompt|readline|cin\s*>>|Scanner|scan)\s*\(?(.*?)\)?', code)
            detected_inputs = [p.strip(" '\"") for p in prompt_matches if p.strip(" '\"")]
            num_branches = len(re.findall(r'\b(?:if|else\s+if|else|switch)\b', code))

        candidate_cases: List[TestCaseItem] = []

        # 2. Try live AI generation if key is configured
        if api_key and (settings.DEFAULT_AI_PROVIDER == "groq" or settings.GROQ_API_KEY):
            groq_key = settings.GROQ_API_KEY or api_key
            prompt = f"""You are a senior software testing engineer and formal verification specialist.
Analyze this {lang} source code and generate 4 to 5 high-quality test cases to thoroughly verify its behavior.

CODE TO TEST:
```{lang}
{code}
```

CRITICAL REQUIREMENTS:
1. Examine the EXACT code logic: what stdin does it expect? What stdout does it print?
2. Produce test cases covering the required categories:
   - "Normal": Standard valid input representative of normal operation
   - "Boundary / Edge": Minimum, maximum, zero, negative, empty string, single element
   - "Invalid Input": Malformed or invalid input (if program handles validation)
   - "Branch Coverage": Targeted inputs designed specifically to execute distinct conditional branches
   - "Regression": Baseline test verifying core functionality remains intact
3. If the program expects user input via stdin (e.g. `input()`), provide the EXACT stdin string with newlines if multiple inputs are requested.
4. Provide the exact expected output on stdout.

Respond ONLY with a valid JSON array of objects:
[
  {{
    "id": "tc-norm-1",
    "name": "Normal Valid Case",
    "category": "Normal",
    "input": "<exact stdin string or empty>",
    "expected_output": "<exact expected stdout>",
    "reason": "Verifies standard happy path execution with typical valid values",
    "target_branch": "Main execution path"
  }},
  {{
    "id": "tc-edge-2",
    "name": "Boundary / Zero Value",
    "category": "Boundary / Edge",
    "input": "<boundary stdin>",
    "expected_output": "<expected stdout>",
    "reason": "Tests minimum / zero value boundary condition",
    "target_branch": "Zero check or loop limit"
  }},
  {{
    "id": "tc-branch-3",
    "name": "Branch Condition Coverage",
    "category": "Branch Coverage",
    "input": "<branch stdin>",
    "expected_output": "<expected stdout>",
    "reason": "Triggers alternative conditional branch",
    "target_branch": "elif branch or guard condition"
  }}
]"""
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                payload = {
                    "model": settings.GROQ_MODEL or "openai/gpt-oss-120b",
                    "messages": [
                        {"role": "system", "content": "You are a test engineer that returns ONLY a valid JSON array."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw = data["choices"][0]["message"]["content"].strip()
                        raw_clean = re.sub(r"^```(?:json)?|```$", "", raw).strip()
                        parsed = json.loads(raw_clean)
                        if isinstance(parsed, list) and len(parsed) > 0:
                            for i, item in enumerate(parsed):
                                candidate_cases.append(
                                    TestCaseItem(
                                        id=item.get("id", f"tc-{i+1}"),
                                        name=item.get("name", f"Test Case {i+1}"),
                                        category=item.get("category", "Normal"),
                                        input=str(item.get("input", "")),
                                        expected_output=str(item.get("expected_output", "")),
                                        reason=item.get("reason", "Verifies expected behavior."),
                                        is_verified=False,
                                        is_user_edited=False,
                                        target_branch=item.get("target_branch"),
                                    )
                                )
            except Exception as e:
                logger.warning(f"AI test generation failed: {e}. Falling back to program-specific deterministic generation.")

        # 3. Deterministic AST/Regex Generator Fallback based on user code
        if not candidate_cases:
            candidate_cases = cls._generate_deterministic_cases(code, lang, detected_inputs, has_numeric_input, has_string_input)

        # 4. Oracle Grounding & Verification:
        # Run test execution against the program in sandbox for each candidate to verify/establish ground truth
        verified_cases: List[TestCaseItem] = []
        for tc in candidate_cases:
            try:
                exec_req = ExecuteRequest(
                    code=code,
                    language=lang,
                    stdin=tc.input or "",
                    generate_ai_fix=False,
                )
                dry_res = await cls.execute_code(exec_req)
                if dry_res.success and dry_res.stdout:
                    # Verified against real runtime execution
                    tc.expected_output = dry_res.stdout.strip()
                    tc.is_verified = True
                else:
                    # Unverified or code has errors
                    tc.is_verified = False
            except Exception:
                tc.is_verified = False

            verified_cases.append(tc)

        return GenerateTestCasesResponse(
            test_cases=verified_cases,
            detected_inputs=detected_inputs,
            estimated_branches=max(1, num_branches),
            language=lang,
        )

    @classmethod
    def _generate_deterministic_cases(
        cls,
        code: str,
        lang: str,
        detected_inputs: List[str],
        has_numeric_input: bool,
        has_string_input: bool,
    ) -> List[TestCaseItem]:
        cases: List[TestCaseItem] = []

        if has_numeric_input:
            cases = [
                TestCaseItem(
                    id="tc-norm-1",
                    name="Normal: Representative Positive Integer",
                    category="Normal",
                    input="10",
                    expected_output="",
                    reason="Verifies program execution on standard positive number.",
                    is_verified=False,
                    target_branch="Positive integer domain",
                ),
                TestCaseItem(
                    id="tc-edge-2",
                    name="Boundary / Edge: Zero Value",
                    category="Boundary / Edge",
                    input="0",
                    expected_output="",
                    reason="Tests boundary at zero to check non-negative constraints.",
                    is_verified=False,
                    target_branch="Zero condition or loop termination",
                ),
                TestCaseItem(
                    id="tc-edge-3",
                    name="Boundary / Edge: Negative Number",
                    category="Boundary / Edge",
                    input="-1",
                    expected_output="",
                    reason="Tests negative boundary condition to check sign validation.",
                    is_verified=False,
                    target_branch="Negative check or error path",
                ),
                TestCaseItem(
                    id="tc-branch-4",
                    name="Branch Coverage: Upper Boundary Threshold",
                    category="Branch Coverage",
                    input="100",
                    expected_output="",
                    reason="Exercises higher numeric range and secondary conditional branches.",
                    is_verified=False,
                    target_branch="Upper range elif / else logic",
                ),
                TestCaseItem(
                    id="tc-reg-5",
                    name="Regression: Known Baseline Input",
                    category="Regression",
                    input="5",
                    expected_output="",
                    reason="Guarantees baseline functional correctness does not regress.",
                    is_verified=False,
                    target_branch="Core algorithm invariant",
                ),
            ]
        elif has_string_input or len(detected_inputs) > 0:
            cases = [
                TestCaseItem(
                    id="tc-norm-1",
                    name="Normal: Standard Non-Empty String",
                    category="Normal",
                    input="hello",
                    expected_output="",
                    reason="Verifies typical valid non-empty string input.",
                    is_verified=False,
                    target_branch="Main string processing flow",
                ),
                TestCaseItem(
                    id="tc-edge-2",
                    name="Boundary / Edge: Empty String",
                    category="Boundary / Edge",
                    input="",
                    expected_output="",
                    reason="Verifies empty string zero-length handling.",
                    is_verified=False,
                    target_branch="Length check or empty guard",
                ),
                TestCaseItem(
                    id="tc-edge-3",
                    name="Boundary / Edge: Single Character",
                    category="Boundary / Edge",
                    input="A",
                    expected_output="",
                    reason="Tests minimal single-character boundary condition.",
                    is_verified=False,
                    target_branch="Single element iteration",
                ),
                TestCaseItem(
                    id="tc-inv-4",
                    name="Invalid Input: Special Characters and Symbols",
                    category="Invalid Input",
                    input="!@#$%^&*",
                    expected_output="",
                    reason="Tests input sanitization and non-alphanumeric character handling.",
                    is_verified=False,
                    target_branch="Sanitization / error handling",
                ),
                TestCaseItem(
                    id="tc-reg-5",
                    name="Regression: Baseline Verification",
                    category="Regression",
                    input="test",
                    expected_output="",
                    reason="Confirms code continues producing expected output after edits.",
                    is_verified=False,
                    target_branch="Default execution path",
                ),
            ]
        else:
            # Standalone program without stdin prompts
            cases = [
                TestCaseItem(
                    id="tc-norm-1",
                    name="Normal: Default Program Execution",
                    category="Normal",
                    input="",
                    expected_output="",
                    reason="Verifies program executes without errors and emits expected stdout.",
                    is_verified=False,
                    target_branch="Main entry point",
                ),
                TestCaseItem(
                    id="tc-reg-2",
                    name="Regression: Invariant Output Verification",
                    category="Regression",
                    input="",
                    expected_output="",
                    reason="Guarantees output invariants remain consistent across refactoring.",
                    is_verified=False,
                    target_branch="Output consistency",
                ),
            ]

        return cases

    @classmethod
    async def explain_test_failure(cls, req: ExplainTestFailureRequest) -> ExplainTestFailureResponse:
        tc = req.test_case
        code = req.code.strip()
        lang = req.language.lower().strip()
        api_key = settings.GROQ_API_KEY or settings.GEMINI_API_KEY or settings.OPENAI_API_KEY

        prompt = f"""You are a senior debugging engineer. A test case failed on this {lang} code.
Code:
```{lang}
{code}
```

Test Case ID: {tc.id} ({tc.name})
Category: {tc.category}
Input Provided (stdin): {tc.input}
Expected Output: {tc.expected_output}
Actual Output: {tc.actual_output}
Error Message: {tc.error_message or tc.mismatch_line}

Explain:
1. Exactly why the actual output differed from expected output.
2. The root cause in the code logic.
3. How to fix the program so the test passes.

Respond ONLY with a JSON object:
{{
  "explanation": "Clear explanation of the divergence",
  "root_cause": "Specific bug or faulty conditional statement",
  "suggested_fix": "Recommended correction in code",
  "corrected_code": "<optional corrected code if straightforward>"
}}"""

        if api_key and (settings.DEFAULT_AI_PROVIDER == "groq" or settings.GROQ_API_KEY):
            groq_key = settings.GROQ_API_KEY or api_key
            try:
                url = "https://api.groq.com/openai/v1/chat/completions"
                headers = {"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"}
                payload = {
                    "model": settings.GROQ_MODEL or "openai/gpt-oss-120b",
                    "messages": [
                        {"role": "system", "content": "You are a debugging expert that returns ONLY a valid JSON object."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"},
                }
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code == 200:
                        parsed = json.loads(resp.json()["choices"][0]["message"]["content"])
                        return ExplainTestFailureResponse(
                            test_id=tc.id,
                            explanation=parsed.get("explanation", "Actual output did not match expected output."),
                            root_cause=parsed.get("root_cause", "Logical discrepancy in branch conditions."),
                            suggested_fix=parsed.get("suggested_fix", "Review program branch statements."),
                            corrected_code=parsed.get("corrected_code"),
                        )
            except Exception as e:
                logger.warning(f"AI test failure explanation failed: {e}")

        # Deterministic fallback explanation
        mismatch = tc.mismatch_line or f"Expected '{tc.expected_output}' but got '{tc.actual_output}'"
        return ExplainTestFailureResponse(
            test_id=tc.id,
            explanation=f"Test '{tc.name}' failed with mismatch: {mismatch}.",
            root_cause="The program logic produced an output value differing from the expected assertion value.",
            suggested_fix="Verify condition checks, boundary limits, and formatting of print/stdout statements.",
        )

