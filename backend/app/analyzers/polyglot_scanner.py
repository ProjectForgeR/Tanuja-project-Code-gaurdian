import re
import uuid
from typing import Any, Dict, List
from app.analyzers.base import BaseAnalyzer
from app.schemas.analysis import FindingSchema


class PolyglotScanner(BaseAnalyzer):
    """
    High-precision security and bug scanner supporting Python, JavaScript, TypeScript, Java, C++, Go,
    C#, PHP, Rust, Kotlin, Swift, Ruby, SQL, Bash, CSS, and HTML.
    """

    async def analyze(self, code: str, language: str, filename: str = "main") -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        lang = language.lower()
        lines = code.split("\n")

        # 1. Hardcoded Secrets (Language Agnostic)
        findings.extend(self._scan_secrets(lines))

        # 2. Language-Specific Scanners
        if lang in ["python", "py"]:
            findings.extend(self._scan_python(lines, code))
        elif lang in ["javascript", "js", "typescript", "ts", "reactjs", "react", "jsx", "nodejs", "node", "reactts", "tsx"]:
            findings.extend(self._scan_javascript(lines, code))
            # Also run HTML-specific checks if HTML tags are present
            if "<html" in code.lower() or "<!doctype" in code.lower():
                findings.extend(self._scan_html(lines, code))
        elif lang in ["html", "htm"]:
            findings.extend(self._scan_html(lines, code))
            findings.extend(self._scan_javascript(lines, code))
        elif lang in ["java", "kotlin"]:
            findings.extend(self._scan_java(lines, code))
        elif lang in ["csharp", "cs", "c#"]:
            findings.extend(self._scan_java(lines, code))
            findings.append(
                self._lang_info_finding(
                    lang,
                    "C# is analyzed using Java-compatible semantic patterns. Support is limited; specialized Roslyn rules are recommended.",
                )
            )
        elif lang in ["cpp", "c", "c++"]:
            findings.extend(self._scan_cpp(lines, code))
        elif lang in ["go", "golang"]:
            findings.extend(self._scan_go(lines, code))
        elif lang in ["php"]:
            findings.extend(self._scan_php(lines, code))
        elif lang in ["rust", "rs"]:
            findings.extend(self._scan_rust(lines, code))
        elif lang in ["swift"]:
            findings.extend(self._scan_generic(lang, lines, code))
        elif lang in ["ruby", "rb"]:
            findings.extend(self._scan_ruby(lines, code))
        elif lang in ["css"]:
            findings.extend(self._scan_css(lines, code))
        elif lang in ["sql", "mysql", "postgresql", "plsql"]:
            findings.extend(self._scan_sql(lines, code))
        elif lang in ["bash", "shell", "sh"]:
            findings.extend(self._scan_bash(lines, code))
        elif lang in ["json", "yaml", "yml", "xml", "markdown", "md"]:
            findings.append(
                self._lang_info_finding(
                    lang,
                    "Static analysis not applicable to config/markup files. Use a linter for validation.",
                )
            )
        else:
            findings.extend(self._scan_generic(lang, lines, code))

        # 3. Universal Code Smells (nesting depth, empty catches)
        if lang not in ["json", "yaml", "yml", "xml", "markdown", "md", "css"]:
            findings.extend(self._scan_smells(lines, lang))

        return findings

    def _scan_secrets(self, lines: List[str]) -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        secret_patterns = [
            (
                r"AKIA[0-9A-Z]{16}",
                "Hardcoded AWS Access Key ID",
                "Critical",
                "Hardcoded cloud credentials in source code allow anyone with code access to compromise AWS infrastructure.",
                "Rotate the compromised key immediately and use AWS IAM roles or environment variables.",
                "CWE-798",
            ),
            (
                r"-----BEGIN (?:RSA|EC|OPENSSH|DSA|PGP)? PRIVATE KEY-----",
                "Hardcoded Private Cryptographic Key",
                "Critical",
                "Private cryptographic keys must never be committed to code repositories.",
                "Remove private key from source and load securely from KMS or environment secrets.",
                "CWE-798",
            ),
            (
                r"""(?i)(?:api_key|apikey|secret_key|jwt_secret|auth_token|db_password)\s*=\s*['\"][a-zA-Z0-9_\-\.]{8,}['\"]""",
                "Hardcoded API Secret or Authentication Token",
                "High",
                "Static credentials hardcoded in source code lead to credential leakage in version control.",
                "Store secrets in environment variables (.env) or a secret manager.",
                "CWE-798",
            ),
        ]

        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith(("//", "#", "/*", "*")):
                continue
            for pattern, title, severity, explanation, fix, cwe in secret_patterns:
                match = re.search(pattern, line)
                if match:
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title=title,
                            severity=severity,
                            category="Security",
                            line_start=i + 1,
                            line_end=i + 1,
                            col_start=match.start() + 1,
                            col_end=match.end() + 1,
                            snippet=line.strip(),
                            explanation=f"{explanation} (Ref: {cwe})",
                            impact="Unauthorized authentication and potential data breach.",
                            recommended_fix=fix,
                            confidence="High",
                            detection_method="Polyglot Security Rule",
                            rule_id=f"SEC-{cwe}",
                            suggested_patch="# Load from environment\nsecret = os.getenv('SECRET_KEY')",
                        )
                    )
        return findings

    def _scan_python(self, lines: List[str], code: str) -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        for i, line in enumerate(lines):
            # SQL Injection via string interpolation in cursor.execute
            if re.search(r"""cursor\.execute\s*\(\s*(?:f['\"].*\{|['\"].*%\s*\(|['\"].*\.format\()""", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="SQL Injection via String Formatting in Query",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Query string is constructed using dynamic string formatting instead of parameterized placeholders. This allows SQL injection attacks (CWE-89).",
                        impact="Attackers can read, modify, or drop database tables and bypass authentication.",
                        recommended_fix="Use parameterized queries: `cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))`",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="PY-SQLI-CWE89",
                        suggested_patch="cursor.execute('SELECT * FROM users WHERE username = %s', (username,))",
                    )
                )

            # Insecure Hash Algorithms (MD5 / SHA1)
            if re.search(r"hashlib\.(md5|sha1)\s*\(", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Use of Broken Cryptographic Hash (MD5/SHA1)",
                        severity="Medium",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="MD5 and SHA-1 have known collision vulnerabilities (CWE-328) and must not be used for security-sensitive purposes or password hashing.",
                        impact="Cryptographic collision attacks and predictable hash values.",
                        recommended_fix="Use SHA-256 (`hashlib.sha256()`) or Argon2 / bcrypt for passwords.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="PY-WEAK-HASH-CWE328",
                        suggested_patch="import hashlib\nhashlib.sha256(data.encode()).hexdigest()",
                    )
                )

            # Command injection with shell=True in subprocess
            if "shell=True" in line and "subprocess" in line:
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Command Injection via subprocess with shell=True",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Passing `shell=True` to subprocess invokes an intermediate shell, allowing command chaining (`&&`, `;`, `|`) from untrusted parameters (CWE-78).",
                        impact="Arbitrary remote command execution with privileges of the server.",
                        recommended_fix="Set `shell=False` and pass arguments as an array of strings: `subprocess.run(['cmd', arg1], shell=False)`",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="PY-CMD-SHELL-TRUE",
                        suggested_patch="subprocess.run(['ls', '-la', directory], check=True, shell=False)",
                    )
                )

            # Leftover debug print
            if re.match(r"^\s*print\s*\(", line) and ("debug" in line.lower() or "password" in line.lower() or "token" in line.lower()):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Sensitive Data Logged via print() Statement",
                        severity="Low",
                        category="Code Smell",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Printing sensitive information to standard output can expose credentials in application logs (CWE-532).",
                        impact="Information disclosure in production stdout logs.",
                        recommended_fix="Use a structured logging library with appropriate log levels and field redaction.",
                        confidence="Medium",
                        detection_method="Polyglot Security Rule",
                        rule_id="PY-SENSITIVE-PRINT",
                    )
                )

        return findings

    def _scan_javascript(self, lines: List[str], code: str) -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        for i, line in enumerate(lines):
            # Cross-Site Scripting (XSS)
            if re.search(r"dangerouslySetInnerHTML\s*=", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Potential XSS via dangerouslySetInnerHTML",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Directly injecting unsanitized HTML into React components opens the application to Cross-Site Scripting (XSS - CWE-79).",
                        impact="Attacker can steal session cookies, tokens, or perform actions on behalf of victims.",
                        recommended_fix="Sanitize content with DOMPurify (`DOMPurify.sanitize(...)`) before rendering.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="JS-XSS-DANGEROUS-HTML",
                        suggested_patch="<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />",
                    )
                )

            if re.search(r"\.innerHTML\s*=", line) or re.search(r"document\.write\s*\(", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="DOM-based XSS via innerHTML / document.write",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Writing untrusted strings to `innerHTML` or `document.write` bypasses HTML entity encoding, allowing script injection (CWE-79).",
                        impact="Arbitrary JavaScript execution in user browser sessions.",
                        recommended_fix="Use `.textContent` or `.innerText` instead of `.innerHTML`.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="JS-DOM-XSS",
                        suggested_patch="element.textContent = userMessage;",
                    )
                )

            # SQL Injection in JS/TS
            if re.search(r"""(?:db|pool|client)\.query\s*\(\s*`[^`]*\$\{""", line) or re.search(r"""(?:db|pool|client)\.query\s*\(\s*['\"].*\+\s*[a-zA-Z]""", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="SQL Injection via Template Literal Concatenation",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="SQL query built using template literal `${...}` or string concatenation is susceptible to SQL injection (CWE-89).",
                        impact="Full database compromise, bypass of access controls, or data exfiltration.",
                        recommended_fix="Use parameterized queries: `db.query('SELECT * FROM users WHERE id = $1', [userId])`",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="JS-SQLI-CWE89",
                        suggested_patch="await db.query('SELECT * FROM accounts WHERE id = $1', [accountId]);",
                    )
                )

            # eval() or new Function() in JS
            if re.search(r"\beval\s*\(", line) or re.search(r"new\s+Function\s*\(", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Arbitrary Code Execution via eval() or new Function()",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Calling `eval()` evaluates arbitrary code in the caller privilege context, allowing RCE (CWE-95).",
                        impact="Arbitrary code execution inside Node.js or browser sandbox.",
                        recommended_fix="Parse JSON with `JSON.parse()` or use safe lookup tables.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="JS-EVAL-RCE",
                    )
                )

            # Prototype pollution
            if "__proto__" in line or "constructor.prototype" in line:
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Potential Prototype Pollution Vulnerability",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Accessing `__proto__` can lead to Prototype Pollution (CWE-1321), altering object prototypes globally across the runtime.",
                        impact="Denial of service, authentication bypass, or remote code execution in Node.js.",
                        recommended_fix="Reject keys matching `__proto__` or `prototype` before merging objects or use `Map` / `Object.create(null)`.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="JS-PROTO-POLLUTION",
                    )
                )

            # Storing sensitive auth tokens or passwords in localStorage/sessionStorage
            if re.search(r"""(?:localStorage|sessionStorage)\.setItem\s*\(\s*['\"](?:token|auth|jwt|password|secret|key|accessToken)['\"]""", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Sensitive Token Stored in Web Storage (CWE-922 / CWE-312)",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Storing sensitive authentication tokens in localStorage or sessionStorage exposes them to XSS attacks (CWE-922). Any malicious script executing in the page context can access web storage.",
                        impact="Session hijacking, token exfiltration, and full account compromise via XSS.",
                        recommended_fix="Store authentication tokens in secure, HttpOnly, SameSite cookies or maintain them in-memory with silent refresh.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="JS-LOCALSTORAGE-TOKEN",
                        suggested_patch="// Recommended: Use HttpOnly Cookie\n// res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });",
                    )
                )

            # Insecure plain-text credentials in request body or query params
            if re.search(r"""(?:password|passwd|pwd)\s*:\s*['\"][^'\"]{1,}['\"]""", line, re.IGNORECASE) and not re.search(r"""(?:placeholder|type|name|id)\s*=""", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Hardcoded Password or Credential in Client-Side Code",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="A static password or secret credential is hardcoded in the client-side bundle (CWE-798). All users and visitors can inspect this credential in browser developer tools.",
                        impact="Immediate account compromise and unauthorized access.",
                        recommended_fix="Remove hardcoded credentials from frontend source code. Always prompt the user for input or use environment variables in server environments.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="JS-HARDCODED-PASS",
                    )
                )

            # Insecure HTTP protocol used in authentication or API calls
            if re.search(r"""http://[a-zA-Z0-9\.\-]+(?:/api|/login|/auth|/signin)""", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Insecure Plaintext HTTP URL Used for Authentication Endpoint",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Authentication requests sent over unencrypted HTTP transmission allow network eavesdroppers to intercept credentials in plaintext (CWE-319).",
                        impact="Man-in-the-middle (MitM) credential interception and token theft.",
                        recommended_fix="Always use secure HTTPS protocol (`https://...`) for all API and authentication calls.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="JS-CLEARTEXT-HTTP",
                        suggested_patch=line.replace("http://", "https://"),
                    )
                )

            # Uncontrolled input in React forms (missing state binding or input sanitization)
            if re.search(r"""<input[^>]+type=['\"]password['\"][^>]*>""", line, re.IGNORECASE) and not re.search(r"""(?:value|onChange|ref)\b""", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Uncontrolled Password Input Field in Component",
                        severity="Low",
                        category="Bug",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Password input element is uncontrolled without React state binding (`value` and `onChange`) or form validation.",
                        impact="Potential form state desynchronization and unvalidated input submission.",
                        recommended_fix="Bind input with `value={password}` and `onChange={(e) => setPassword(e.target.value)}`.",
                        confidence="Medium",
                        detection_method="Polyglot Quality Rule",
                        rule_id="REACT-UNCONTROLLED-INPUT",
                    )
                )

        return findings

    def _scan_java(self, lines: List[str], code: str) -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        for i, line in enumerate(lines):
            # SQL Injection in Java
            if re.search(r"""(executeQuery|executeUpdate)\s*\(\s*['\"].*\+\s*[a-zA-Z]""", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="SQL Injection via String Concatenation in JDBC",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="JDBC query built via string concatenation allows SQL Injection (CWE-89).",
                        impact="Unauthorized database queries and potential data destruction.",
                        recommended_fix="Use `PreparedStatement` with parameterized placeholders (`?`).",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="JAVA-SQLI-JDBC",
                        suggested_patch="PreparedStatement ps = conn.prepareStatement('SELECT * FROM users WHERE id = ?');\nps.setString(1, userId);",
                    )
                )

            # Command execution
            if "Runtime.getRuntime().exec(" in line or "ProcessBuilder(" in line:
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Potential Command Injection via Runtime.exec()",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Executing shell commands via `Runtime.getRuntime().exec` with user-controlled input can lead to OS command injection (CWE-78).",
                        impact="Remote server execution of operating system commands.",
                        recommended_fix="Sanitize and whitelist arguments strictly, or use native Java APIs instead of shell commands.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="JAVA-CMD-EXEC",
                    )
                )

            # Resource leak: FileInputStream / Connection without try-with-resources
            if ("new FileInputStream(" in line or "DriverManager.getConnection(" in line) and "try (" not in line:
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Unclosed Resource Leak (Missing try-with-resources)",
                        severity="Medium",
                        category="Bug",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Opening file streams or database connections without try-with-resources can exhaust file descriptors or connection pools (CWE-775).",
                        impact="Application degradation and connection pool starvation under load.",
                        recommended_fix="Wrap resource acquisition in `try (ResourceType r = ...) { ... }`.",
                        confidence="Medium",
                        detection_method="Polyglot Security Rule",
                        rule_id="JAVA-RESOURCE-LEAK",
                        suggested_patch="try (FileInputStream fis = new FileInputStream(file)) {\n    // process\n}",
                    )
                )

            # Unchecked Scanner reads without hasNext check (causes NoSuchElementException)
            if re.search(r"\b\w+\.(nextLine|nextInt|nextLong|nextDouble|next)\s*\(", line):
                if not re.search(r"hasNext(Line|Int|Long|Double)?", code):
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title="Unchecked Scanner Input (Causes NoSuchElementException on EOF)",
                            severity="High",
                            category="Bug",
                            line_start=i + 1,
                            line_end=i + 1,
                            snippet=line.strip(),
                            explanation="Calling `Scanner.nextLine()` or `nextInt()` without first checking `sc.hasNextLine()` or `sc.hasNextInt()` causes a fatal runtime `java.util.NoSuchElementException: No line found` if standard input is empty, truncated, or runs in a non-interactive environment.",
                            impact="Program terminates abruptly with an unhandled runtime exception.",
                            recommended_fix="Wrap input reading in `if (sc.hasNextLine())` or `if (sc.hasNextInt())` guards and provide graceful fallbacks or error messages.",
                            confidence="High",
                            detection_method="Polyglot Scanner Rule",
                            rule_id="JAVA-UNCHECKED-SCANNER",
                            suggested_patch="if (sc.hasNextLine()) {\n    String val = sc.nextLine();\n} else {\n    System.out.println(\"Error: No input provided.\");\n}",
                        )
                    )
        return findings

    def _scan_cpp(self, lines: List[str], code: str) -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        unsafe_cpp_funcs = [
            ("strcpy", "Buffer Overflow via Unchecked strcpy()", "Critical", "strcpy does not check destination buffer boundaries (CWE-120).", "Use `strncpy` or `std::string`.", "CPP-STRCPY-BOF"),
            ("gets", "Dangerous Unbounded Input via gets()", "Critical", "gets() does not check buffer limits and was removed in C11 (CWE-242).", "Use `fgets()` or `std::getline`.", "CPP-GETS-BOF"),
            ("sprintf", "Buffer Overflow via sprintf()", "High", "sprintf lacks boundary checks on destination buffer (CWE-120).", "Use `snprintf()` specifying maximum length.", "CPP-SPRINTF-BOF"),
            ("strcat", "Buffer Overflow via strcat()", "High", "strcat does not verify remaining destination capacity (CWE-120).", "Use `strncat` or `std::string::append`.", "CPP-STRCAT-BOF"),
        ]

        for i, line in enumerate(lines):
            for func, title, severity, explanation, fix, rule in unsafe_cpp_funcs:
                if re.search(rf"\b{func}\s*\(", line):
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title=title,
                            severity=severity,
                            category="Security",
                            line_start=i + 1,
                            line_end=i + 1,
                            snippet=line.strip(),
                            explanation=f"{explanation} Buffer overflow can overwrite stack pointers and result in arbitrary code execution.",
                            impact="Memory corruption, crash, or control-flow hijack.",
                            recommended_fix=fix,
                            confidence="High",
                            detection_method="Polyglot Security Rule",
                            rule_id=rule,
                        )
                    )
        return findings

    def _scan_go(self, lines: List[str], code: str) -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        for i, line in enumerate(lines):
            # SQL Injection in Go
            if re.search(r"""(db\.Query|db\.Exec)\s*\(\s*fmt\.Sprintf\(""", line) or re.search(r"""(db\.Query|db\.Exec)\s*\(\s*".*"\s*\+\s*[a-zA-Z]""", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="SQL Injection via fmt.Sprintf in Go Database Query",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Constructing Go SQL queries with `fmt.Sprintf` leads to SQL Injection (CWE-89).",
                        impact="Full database compromise or data manipulation.",
                        recommended_fix="Use parameterized queries: `db.Query('SELECT * FROM users WHERE id = $1', userId)`",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="GO-SQLI-CWE89",
                        suggested_patch="rows, err := db.Query('SELECT * FROM accounts WHERE id = $1', accountId)",
                    )
                )

            # Mutex Lock without defer Unlock
            if re.search(r"\b([a-zA-Z0-9_]+)\.Lock\(\)", line):
                # Check if subsequent 3 lines contain defer Unlock
                window = "\n".join(lines[i:min(i + 5, len(lines))])
                if "Unlock()" not in window:
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title="Potential Deadlock: Mutex.Lock() without defer Unlock()",
                            severity="Medium",
                            category="Bug",
                            line_start=i + 1,
                            line_end=i + 1,
                            snippet=line.strip(),
                            explanation="Acquiring a mutex lock without immediate `defer mu.Unlock()` can cause permanent deadlocks if a panic occurs or early return is hit.",
                            impact="Deadlock freezing concurrent goroutines permanently.",
                            recommended_fix="Immediately follow `mu.Lock()` with `defer mu.Unlock()`.",
                            confidence="High",
                            detection_method="Polyglot Security Rule",
                            rule_id="GO-MUTEX-DEADLOCK",
                            suggested_patch="mu.Lock()\ndefer mu.Unlock()",
                        )
                    )
        return findings

    def _scan_html(self, lines: List[str], code: str) -> List[FindingSchema]:
        """Security scanner for HTML/JS-in-HTML code."""
        findings: List[FindingSchema] = []
        for i, line in enumerate(lines):
            stripped = line.strip()

            # Inline event handler XSS (onclick, onload, onerror, etc.)
            if re.search(r'\bon\w+\s*=\s*["\'][^"\']*["\']', line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Inline Event Handler Enables DOM-based XSS",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation=(
                            "Inline event handlers (onclick, onload, onerror, etc.) bypass Content "
                            "Security Policy and allow attackers to inject executable JavaScript if "
                            "any part of the attribute value is user-controlled (CWE-79)."
                        ),
                        impact="Arbitrary JavaScript execution in the victim's browser.",
                        recommended_fix=(
                            "Move event handlers to external JS files using addEventListener(). "
                            "Never include user-supplied data in inline handlers."
                        ),
                        confidence="Medium",
                        detection_method="HTML Security Scanner",
                        rule_id="HTML-INLINE-HANDLER-XSS",
                        suggested_patch='document.querySelector("#btn").addEventListener("click", handler);',
                    )
                )

            # document.write() in script blocks
            if re.search(r"document\.write\s*\(", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="DOM XSS via document.write()",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation=(
                            "document.write() injects raw HTML into the page. If any argument "
                            "contains user input, attackers can inject arbitrary script tags (CWE-79)."
                        ),
                        impact="Session hijacking, cookie theft, arbitrary code execution in browser.",
                        recommended_fix="Use element.textContent or element.insertAdjacentText() instead.",
                        confidence="High",
                        detection_method="HTML Security Scanner",
                        rule_id="HTML-DOCUMENT-WRITE-XSS",
                        suggested_patch="element.textContent = userValue;",
                    )
                )

            # eval() inside script tags
            if re.search(r"\beval\s*\(", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Dangerous eval() in Script Block",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation=(
                            "eval() executes arbitrary JavaScript code strings. "
                            "If any user-controlled data reaches eval(), it results in "
                            "Remote Code Execution within the browser context (CWE-95)."
                        ),
                        impact="Arbitrary JavaScript execution, full session compromise.",
                        recommended_fix="Use JSON.parse() for data, or structured dispatch maps instead of eval().",
                        confidence="High",
                        detection_method="HTML Security Scanner",
                        rule_id="HTML-EVAL-RCE",
                    )
                )

            # Form with action pointing to HTTP (not HTTPS) — mixed content
            if re.search(r'<form[^>]+action\s*=\s*["\']http://', line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Form Submits to Insecure HTTP Endpoint",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation=(
                            "This form submits user data (possibly credentials) to an HTTP endpoint. "
                            "Data is transmitted in plaintext, allowing network attackers to "
                            "intercept credentials (CWE-319)."
                        ),
                        impact="Man-in-the-middle attack, credential theft.",
                        recommended_fix='Change the form action to use "https://" to encrypt data in transit.',
                        confidence="High",
                        detection_method="HTML Security Scanner",
                        rule_id="HTML-HTTP-FORM-ACTION",
                    )
                )

            # Hardcoded password in input default value
            if re.search(r'<input[^>]+(?:name|id)=["\'](?:password|pwd|passwd)["\'][^>]+value=["\'][^"\']+["\']', line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Hardcoded Password Value in Input Field",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation=(
                            "A password input field has a hardcoded default value in the HTML source. "
                            "This credential is visible to anyone who views page source (CWE-798)."
                        ),
                        impact="Credential exposure to anyone with access to the HTML source.",
                        recommended_fix="Never hardcode passwords in HTML. Use server-side pre-fill only for non-sensitive fields.",
                        confidence="High",
                        detection_method="HTML Security Scanner",
                        rule_id="HTML-HARDCODED-PASSWORD",
                    )
                )

            # Missing autocomplete=off on password fields
            if re.search(r'<input[^>]+type=["\']password["\']', line, re.IGNORECASE):
                if "autocomplete" not in line.lower():
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title="Password Field Missing autocomplete='off'",
                            severity="Low",
                            category="Code Smell",
                            line_start=i + 1,
                            line_end=i + 1,
                            snippet=stripped[:120],
                            explanation=(
                                "Password fields without autocomplete='off' may be cached by "
                                "browsers, creating security risks on shared computers (CWE-522)."
                            ),
                            impact="Password auto-fill on shared/public computers.",
                            recommended_fix='Add autocomplete="off" or autocomplete="new-password" to the input.',
                            confidence="Medium",
                            detection_method="HTML Security Scanner",
                            rule_id="HTML-AUTOCOMPLETE-PWD",
                            suggested_patch='<input type="password" name="pwd" autocomplete="new-password">',
                        )
                    )

            # src or href pointing to http:// (mixed content)
            if re.search(r'(?:src|href)\s*=\s*["\']http://', line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Mixed Content: External Resource Loaded over HTTP",
                        severity="Medium",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation=(
                            "Loading scripts, styles, or images over HTTP on an HTTPS page is "
                            "'mixed content'. Modern browsers block it; if allowed, the resource "
                            "can be tampered with in transit (CWE-311)."
                        ),
                        impact="Resource tampering, man-in-the-middle code injection.",
                        recommended_fix='Change all resource URLs from "http://" to "https://".',
                        confidence="High",
                        detection_method="HTML Security Scanner",
                        rule_id="HTML-MIXED-CONTENT",
                    )
                )

        # Check for missing Content-Security-Policy meta tag in entire document
        if "<html" in code.lower() and "content-security-policy" not in code.lower():
            findings.append(
                FindingSchema(
                    id=str(uuid.uuid4()),
                    title="Missing Content-Security-Policy (CSP) Meta Tag",
                    severity="Medium",
                    category="Security",
                    line_start=1,
                    line_end=1,
                    col_start=1,
                    col_end=1,
                    snippet="<head>...</head>",
                    explanation=(
                        "No Content-Security-Policy header or meta tag was detected in this HTML document. "
                        "CSP is the primary browser-enforced defense against XSS and data injection attacks."
                    ),
                    impact="XSS attacks succeed without CSP restrictions on script sources.",
                    recommended_fix=(
                        "Add a CSP meta tag to <head>: "
                        '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\'">'
                    ),
                    confidence="High",
                    detection_method="HTML Security Scanner",
                    rule_id="HTML-MISSING-CSP",
                )
            )

        return findings

    def _scan_smells(self, lines: List[str], language: str) -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        for i, line in enumerate(lines):
            indent_level = (len(line) - len(line.lstrip())) // 4
            if indent_level >= 5 and any(kw in line for kw in ["if", "for", "while", "switch"]):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Excessive Cyclomatic Nesting Depth",
                        severity="Low",
                        category="Code Smell",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation=f"Block is nested {indent_level} levels deep. High nesting complexity severely reduces readability and increases bug defect rates.",
                        impact="High cognitive load and elevated defect probability.",
                        recommended_fix="Refactor into guard clauses (early returns) or extract nested blocks into dedicated helper functions.",
                        confidence="Medium",
                        detection_method="Polyglot Quality Rule",
                        rule_id="SMELL-NESTING-DEPTH",
                    )
                )

            # Empty catch block in JS/Java
            if re.search(r"catch\s*\([^\)]*\)\s*\{\s*\}", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Empty Exception Catch Block",
                        severity="Medium",
                        category="Bug",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=line.strip(),
                        explanation="Catching an exception and completely swallowing it hides failures and makes diagnosing bugs impossible (CWE-390).",
                        impact="Silent system failures and unhandled edge cases.",
                        recommended_fix="Log the error or rethrow a domain-specific exception.",
                        confidence="High",
                        detection_method="Polyglot Quality Rule",
                        rule_id="SMELL-EMPTY-CATCH",
                    )
                )
        return findings

    def _lang_info_finding(self, lang: str, message: str) -> FindingSchema:
        """Create an Informational finding for language analysis status."""
        return FindingSchema(
            id=str(uuid.uuid4()),
            title=f"Analysis Support: {lang}",
            severity="Informational",
            category="Analysis Info",
            line_start=1,
            line_end=1,
            col_start=1,
            col_end=1,
            snippet="",
            explanation=message,
            impact="Advisory notification regarding language-specific analysis capabilities.",
            recommended_fix="For comprehensive language-specific analysis, integrate a dedicated static analyzer or linter.",
            confidence="High",
            detection_method="Language Router",
            rule_id=f"INFO-LANG-{lang.upper()}",
        )

    def _scan_generic(self, lang: str, lines: List[str], code: str) -> List[FindingSchema]:
        """Generic analysis finding for languages with limited scanner coverage."""
        return [
            self._lang_info_finding(
                lang,
                f"Basic analysis support for {lang}. Detailed syntax rules and security linters are limited for this language.",
            )
        ]

    def _scan_php(self, lines: List[str], code: str) -> List[FindingSchema]:
        """PHP security and bug scanner."""
        findings: List[FindingSchema] = []
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith(("//", "#", "/*", "*")):
                continue

            # eval( - Critical, arbitrary code execution (CWE-95)
            if re.search(r"\beval\s*\(", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Arbitrary Code Execution via eval()",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="The eval() function executes arbitrary PHP code strings. Untrusted input reaching eval() enables Remote Code Execution (CWE-95).",
                        recommended_fix="Avoid eval(). Use structured data formats (such as JSON) or static dispatch tables instead.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="PHP-EVAL-RCE",
                    )
                )

            # mysql_query( - High, deprecated API and SQLi risk (CWE-89)
            if re.search(r"\bmysql_query\s*\(", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Use of Deprecated mysql_query() API",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="The mysql_* extension is deprecated and removed in modern PHP. It lacks parameterized queries, significantly increasing SQL injection risk (CWE-89).",
                        recommended_fix="Migrate to PDO with prepared statements: `$stmt = $pdo->prepare('SELECT ...'); $stmt->execute([...]);`",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="PHP-DEPRECATED-MYSQL",
                    )
                )

            # $_GET[ or $_POST[ used directly in SQL string - Critical, SQLi (CWE-89)
            if re.search(r"\$_(?:GET|POST|REQUEST)\[", line) and any(
                kw in line.upper() for kw in ["SELECT", "INSERT", "UPDATE", "DELETE", "WHERE", "QUERY"]
            ):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Direct Superglobal in SQL Query (SQL Injection)",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="User input from $_GET, $_POST, or $_REQUEST is directly interpolated into a database query string without sanitization or parameter binding (CWE-89).",
                        recommended_fix="Use PDO or MySQLi prepared statements with bound parameters.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="PHP-SQLI-SUPERGLOBAL",
                    )
                )

            # system( or exec( - Critical, command injection (CWE-78)
            if re.search(r"\b(system|exec|shell_exec|passthru)\s*\(", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Command Injection via system() or exec()",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Executing shell commands directly risks OS Command Injection if arguments contain untrusted user data (CWE-78).",
                        recommended_fix="Avoid executing system commands. If unavoidable, sanitize arguments using escapeshellarg() or escapeshellcmd().",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="PHP-COMMAND-INJECTION",
                    )
                )

            # include($_ or require($_ - Critical, LFI (CWE-98)
            if re.search(r"\b(include|require|include_once|require_once)\s*\(?\s*\$_(?:GET|POST|REQUEST|COOKIE)\[", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="File Inclusion (LFI/RFI) via Dynamic include/require",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Passing user input from superglobals directly to include or require allows Local File Inclusion (LFI) or Remote File Inclusion (RFI) (CWE-98).",
                        recommended_fix="Never pass user input to file inclusion statements. Use an allowlist of permitted filenames.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="PHP-FILE-INCLUSION",
                    )
                )

            # password_hash missing for password storage - Medium suggestion
            if re.search(r"\b(md5|sha1)\s*\(\s*.*(?:pass|pwd)", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Weak Hash Algorithm Used for Password Storage",
                        severity="Medium",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="MD5 and SHA-1 are cryptographically broken for password hashing and vulnerable to collision and rainbow table attacks (CWE-328 / CWE-916).",
                        recommended_fix="Use PHP's native password_hash($password, PASSWORD_DEFAULT) and password_verify().",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="PHP-WEAK-PASSWORD-HASH",
                    )
                )

        # Global check: password handling without password_hash()
        if any(kw in code.lower() for kw in ["password", "passwd", "pwd"]) and any(
            kw in code.lower() for kw in ["insert into", "update ", "users", "account"]
        ) and "password_hash" not in code:
            if not any(f.rule_id == "PHP-WEAK-PASSWORD-HASH" for f in findings):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Missing password_hash() for Password Storage",
                        severity="Medium",
                        category="Security",
                        line_start=1,
                        line_end=1,
                        snippet="",
                        explanation="Password storage logic detected, but password_hash() is not used. Passwords must be securely hashed with bcrypt or Argon2 (CWE-916).",
                        recommended_fix="Store passwords hashed using `password_hash($password, PASSWORD_DEFAULT)` and verify with `password_verify()`.",
                        confidence="Medium",
                        detection_method="Polyglot Security Rule",
                        rule_id="PHP-MISSING-PASSWORD-HASH",
                    )
                )

        return findings

    def _scan_sql(self, lines: List[str], code: str) -> List[FindingSchema]:
        """SQL injection and query pattern scanner."""
        findings: List[FindingSchema] = []
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith(("--", "/*", "*")):
                continue

            # Dynamic WHERE clauses with string concatenation patterns
            if re.search(r"WHERE.*\+\s*['\"@\$\w]|WHERE.*\|\|\s*['\"@\$\w]|WHERE.*CONCAT\s*\(", line, re.IGNORECASE) or re.search(r"WHERE.*['\"]\s*\+\s*", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Dynamic String Concatenation in WHERE Clause",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Constructing WHERE clauses using dynamic string concatenation allows SQL injection attacks (CWE-89).",
                        recommended_fix="Use parameterized queries / prepared statements instead of dynamic string concatenation.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="SQL-DYNAMIC-WHERE-CONCAT",
                    )
                )

            # UNION SELECT patterns (often SQLi probe)
            if re.search(r"\bUNION(?:\s+ALL)?\s+SELECT\b", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="UNION SELECT Pattern Detected",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="UNION SELECT queries can be used in SQL injection probes to extract schema and confidential data across tables (CWE-89).",
                        recommended_fix="Ensure UNION queries are strictly parameterized and cannot be injected by untrusted input.",
                        confidence="Medium",
                        detection_method="Polyglot Security Rule",
                        rule_id="SQL-UNION-SELECT",
                    )
                )

            # DROP TABLE or TRUNCATE in general code (destructive)
            if re.search(r"\b(DROP\s+TABLE|DROP\s+DATABASE|TRUNCATE\s+TABLE|TRUNCATE\s+\w+)\b", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Destructive DDL Command (DROP TABLE / TRUNCATE)",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="DROP and TRUNCATE commands destructively wipe entire tables or databases without rollback capabilities (CWE-284).",
                        recommended_fix="Restrict DDL commands to controlled database migration scripts and avoid running them from general application code.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="SQL-DESTRUCTIVE-DDL",
                    )
                )

            # SELECT * (performance/security code smell)
            if re.search(r"\bSELECT\s+\*\s+FROM\b", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Use of Wildcard SELECT * Code Smell",
                        severity="Low",
                        category="Code Smell",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Wildcard SELECT * fetches all columns, increasing network I/O, breaking schema caching, and potentially leaking sensitive new columns.",
                        recommended_fix="Specify only required column names explicitly (e.g., SELECT id, username FROM ...).",
                        confidence="High",
                        detection_method="Polyglot Quality Rule",
                        rule_id="SQL-SELECT-STAR",
                    )
                )

        # No WHERE clause on DELETE or UPDATE -> High severity
        statements = [s.strip() for s in code.split(";") if s.strip()]
        for stmt in statements:
            is_del = bool(re.search(r"\bDELETE\s+FROM\s+\w+", stmt, re.IGNORECASE))
            is_upd = bool(re.search(r"\bUPDATE\s+\w+\s+SET\b", stmt, re.IGNORECASE))
            if (is_del or is_upd) and not re.search(r"\bWHERE\b", stmt, re.IGNORECASE):
                first_line = stmt.split("\n")[0].strip()
                match_line = 1
                for idx, l in enumerate(lines):
                    if first_line in l:
                        match_line = idx + 1
                        break
                op = "DELETE" if is_del else "UPDATE"
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title=f"Unrestricted {op} Statement Without WHERE Clause",
                        severity="High",
                        category="Bug",
                        line_start=match_line,
                        line_end=match_line,
                        snippet=stmt[:120],
                        explanation=f"{op} statement does not contain a WHERE clause, which will modify or delete ALL rows across the target table.",
                        recommended_fix=f"Add a specific WHERE clause to constrain the {op} operation: `{op} ... WHERE id = :id`.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id=f"SQL-UNRESTRICTED-{op}",
                    )
                )

        return findings

    def _scan_bash(self, lines: List[str], code: str) -> List[FindingSchema]:
        """Shell script security and quality scanner."""
        findings: List[FindingSchema] = []
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith("#"):
                continue

            # eval - Critical, arbitrary code execution
            if re.search(r"\beval\s+", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Arbitrary Code Execution via eval",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="The eval command executes string arguments as shell commands, enabling arbitrary code execution if untrusted input is evaluated (CWE-78).",
                        recommended_fix="Avoid eval. Use native shell arrays or parameter expansion.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="BASH-EVAL-RCE",
                    )
                )

            # rm -rf / or rm -rf * - Critical, destructive command
            if re.search(
                r"rm\s+(?:-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*\s+|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*\s+)(?:/|\*|/\*|\.\/\*|\$dir\/\*)",
                line,
            ):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Catastrophic Destructive Command (rm -rf / or rm -rf *)",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Executing rm -rf on root, wildcards, or unvalidated paths will delete critical filesystem files indiscriminately.",
                        recommended_fix="Validate directory variables, check path safety, and avoid unconstrained wildcards in recursive deletion.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="BASH-DESTRUCTIVE-RM",
                    )
                )

            # curl ... | bash or wget ... | sh - Critical, remote code execution
            if re.search(r"(?:curl|wget)\b.*\|\s*(?:bash|sh|zsh|source)\b", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Piping Remote Content to Shell (curl/wget | sh)",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Piping downloaded remote scripts directly to a shell allows remote attackers or MITM intercepts to execute arbitrary code (CWE-494).",
                        recommended_fix="Download the script first, verify checksum/GPG signature, and review contents prior to execution.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="BASH-PIPE-TO-SHELL",
                    )
                )

            # chmod 777 - Low, excessive permissions
            if re.search(r"\bchmod\s+(?:-R\s+)?777\b", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Overly Permissive File Permissions (chmod 777)",
                        severity="Low",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="chmod 777 grants read, write, and execute permissions to all users, violating the principle of least privilege (CWE-732).",
                        recommended_fix="Use restrictive permissions such as chmod 755 for executables or chmod 644 for regular files.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="BASH-CHMOD-777",
                    )
                )

            # Unquoted variables used in commands (simple heuristic: $var not in "$var") -> Medium
            if not stripped.startswith(("#", "for ", "while ", "if ", "elif ", "case ")):
                unquoted_matches = re.findall(r'(?<!["\'\\\$])\$([a-zA-Z_]\w*)(?!["\'])', line)
                if unquoted_matches:
                    var_name = unquoted_matches[0]
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title=f"Unquoted Variable Expansion (${var_name})",
                            severity="Medium",
                            category="Bug",
                            line_start=i + 1,
                            line_end=i + 1,
                            snippet=stripped[:120],
                            explanation=f"Variable expansion `${var_name}` is not enclosed in double quotes, leading to word splitting and globbing issues.",
                            recommended_fix=f'Enclose variable expansions in double quotes: `"${var_name}"`.',
                            confidence="Medium",
                            detection_method="Polyglot Quality Rule",
                            rule_id="BASH-UNQUOTED-VARIABLE",
                        )
                    )

        return findings

    def _scan_css(self, lines: List[str], code: str) -> List[FindingSchema]:
        """CSS stylesheet scanner."""
        findings: List[FindingSchema] = []
        important_count = 0
        first_important_line = 1

        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith(("/*", "*")):
                continue

            # CSS expressions: expression( -> High (IE CSS injection XSS)
            if re.search(r"\bexpression\s*\(", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Dangerous CSS Expression (IE XSS)",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="CSS expressions allow arbitrary JavaScript execution in legacy Internet Explorer browsers, enabling Cross-Site Scripting (XSS) (CWE-79).",
                        recommended_fix="Remove dynamic CSS expressions and use standard CSS or JavaScript logic instead.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="CSS-EXPRESSION-XSS",
                    )
                )

            # CSS imports from http:// -> Medium (mixed content)
            if re.search(r"@import\s+(?:url\s*\(\s*)?['\"]http://", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Insecure HTTP Stylesheet Import (Mixed Content)",
                        severity="Medium",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Importing stylesheets over insecure HTTP triggers mixed-content security blocks and exposes assets to MITM tampering (CWE-319).",
                        recommended_fix="Update @import URL to use secure HTTPS protocol.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="CSS-INSECURE-HTTP-IMPORT",
                    )
                )

            if "!important" in line.lower():
                important_count += line.lower().count("!important")
                if important_count == 1:
                    first_important_line = i + 1

        # !important overuse (more than 3 occurrences) -> Low code smell
        if important_count > 3:
            findings.append(
                FindingSchema(
                    id=str(uuid.uuid4()),
                    title="Overuse of !important Declarations",
                    severity="Low",
                    category="Code Smell",
                    line_start=first_important_line,
                    line_end=first_important_line,
                    snippet="... !important ...",
                    explanation=f"Detected {important_count} uses of !important. Overusing !important breaks stylesheet cascading rules and harms maintainability.",
                    recommended_fix="Refactor selector specificity instead of overriding with !important.",
                    confidence="High",
                    detection_method="Polyglot Quality Rule",
                    rule_id="CSS-IMPORTANT-OVERUSE",
                )
            )

        return findings

    def _scan_rust(self, lines: List[str], code: str) -> List[FindingSchema]:
        """Rust security and quality scanner."""
        findings: List[FindingSchema] = []
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith(("//", "/*", "*")):
                # TODO/FIXME comments -> Low informational
                if re.search(r"//\s*(?:TODO|FIXME)\b", line, re.IGNORECASE):
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title="Unresolved TODO/FIXME Comment",
                            severity="Low",
                            category="Code Smell",
                            line_start=i + 1,
                            line_end=i + 1,
                            snippet=stripped[:120],
                            explanation="Unresolved TODO or FIXME comment denotes unfinished logic or technical debt.",
                            recommended_fix="Address the comment or convert it into a tracked issue in your backlog.",
                            confidence="High",
                            detection_method="Polyglot Quality Rule",
                            rule_id="RUST-TODO-COMMENT",
                        )
                    )
                continue

            # unsafe { blocks -> Medium, requires review
            if re.search(r"\bunsafe\s*\{", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Unsafe Rust Block Requires Audit",
                        severity="Medium",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Unsafe blocks bypass Rust's compiler memory-safety guarantees and can introduce undefined behavior or memory corruption.",
                        recommended_fix="Audit unsafe block to guarantee memory safety invariants, or replace with safe standard library abstractions.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="RUST-UNSAFE-BLOCK",
                    )
                )

            # unwrap() calls -> Low, can panic at runtime
            if re.search(r"\.unwrap\s*\(\s*\)", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Unchecked unwrap() May Panic at Runtime",
                        severity="Low",
                        category="Bug",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Calling unwrap() will panic at runtime if the Result is Err or the Option is None.",
                        recommended_fix="Handle errors gracefully using `?`, `match`, `unwrap_or`, or `if let`.",
                        confidence="High",
                        detection_method="Polyglot Quality Rule",
                        rule_id="RUST-UNWRAP-PANIC",
                    )
                )

            # expect( calls -> Low, can panic at runtime
            if re.search(r"\.expect\s*\(", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Unchecked expect() May Panic at Runtime",
                        severity="Low",
                        category="Bug",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Calling expect() panics if Result is Err or Option is None.",
                        recommended_fix="Propagate errors with `?` or handle error variants safely instead of panicking.",
                        confidence="High",
                        detection_method="Polyglot Quality Rule",
                        rule_id="RUST-EXPECT-PANIC",
                    )
                )

        return findings

    def _scan_ruby(self, lines: List[str], code: str) -> List[FindingSchema]:
        """Ruby security scanner."""
        findings: List[FindingSchema] = []
        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith("#"):
                continue

            # eval( -> Critical
            if re.search(r"\beval\s*\(|\beval\s+[\"'\$@]", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Arbitrary Code Execution via eval()",
                        severity="Critical",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Dynamic eval() executes arbitrary Ruby code strings. If untrusted input reaches eval(), attackers can execute arbitrary code (CWE-95).",
                        recommended_fix="Avoid eval(). Use safe data deserialization or structured method dispatch.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="RUBY-EVAL-RCE",
                    )
                )

            # `...` backtick shell execution -> High
            if re.search(r"(?<!\\)`[^`\n]+`", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Command Execution via Backticks",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Backticks execute external shell commands. If dynamic variables are interpolated, this can result in command injection (CWE-78).",
                        recommended_fix="Use Open3.capture3 with argument arrays instead of backtick shell execution.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="RUBY-BACKTICK-COMMAND",
                    )
                )

            # system( with string interpolation -> High
            if re.search(r"\b(?:system|exec)\s*\(?.*#\{", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Command Injection via system() with String Interpolation",
                        severity="High",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="String interpolation in system() or exec() calls allows arguments to break out of shell commands (CWE-78).",
                        recommended_fix="Pass command and arguments as separate array elements: `system('cmd', arg1, arg2)` to bypass shell interpretation.",
                        confidence="High",
                        detection_method="Polyglot Security Rule",
                        rule_id="RUBY-SYSTEM-INTERPOLATION",
                    )
                )

            # puts password patterns -> Medium (sensitive data logging)
            if re.search(r"\b(?:puts|p|print|logger\.\w+)\s*.*(?:password|passwd|secret|token|api_key|auth)\b", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Potential Sensitive Credential Logging",
                        severity="Medium",
                        category="Security",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped[:120],
                        explanation="Printing or logging passwords and authentication credentials leaks secrets into console output or system logs (CWE-532).",
                        recommended_fix="Filter out and redact sensitive credentials before logging or printing.",
                        confidence="Medium",
                        detection_method="Polyglot Security Rule",
                        rule_id="RUBY-LOG-SENSITIVE-DATA",
                    )
                )

        return findings
