import ast
import re
import uuid
from typing import Any, Dict, List, Set, Tuple
from app.analyzers.base import BaseAnalyzer
from app.schemas.analysis import FindingSchema


class CodeSmellAnalyzer(BaseAnalyzer):
    """
    Intelligent Code Smell and Maintainability Analyzer.
    Detects 20 essential code smells using deep AST inspection for Python
    and high-precision structural pattern scanning for polyglot languages.
    """

    async def analyze(self, code: str, language: str, filename: str = "main") -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        lang = (language or "python").lower().strip()
        lines = code.split("\n")

        # 1. Duplicate code block analysis (Language-Agnostic)
        findings.extend(self._detect_duplicate_code(lines))

        # 2. Language-Specific Analysis
        if lang in ["python", "py"]:
            findings.extend(self._analyze_python_smells(code, lines))
        else:
            findings.extend(self._analyze_polyglot_smells(code, lines, lang))

        return findings

    # ─────────────────────────────────────────────────────────────────────────────
    # 1. DUPLICATE CODE DETECTION
    # ─────────────────────────────────────────────────────────────────────────────
    def _detect_duplicate_code(self, lines: List[str]) -> List[FindingSchema]:
        findings: List[FindingSchema] = []
        min_block_size = 3
        cleaned_lines = [line.strip() for line in lines]

        # Ignore empty lines, simple braces/comments
        def is_significant(l: str) -> bool:
            return len(l) > 6 and not l.startswith(("#", "//", "/*", "*", "{", "}", "import ", "from "))

        blocks: Dict[str, List[int]] = {}
        for i in range(len(cleaned_lines) - min_block_size + 1):
            chunk = [cleaned_lines[i + k] for k in range(min_block_size)]
            if all(is_significant(c) for c in chunk):
                key = "\n".join(chunk)
                if key not in blocks:
                    blocks[key] = []
                blocks[key].append(i + 1)

        # Flag duplicate blocks that appear in distinct line spans
        reported_spans: Set[int] = set()
        for key, occurrences in blocks.items():
            if len(occurrences) >= 2:
                first_line = occurrences[0]
                second_line = occurrences[1]
                if abs(first_line - second_line) >= min_block_size and first_line not in reported_spans:
                    reported_spans.add(first_line)
                    reported_spans.add(second_line)
                    snippet = "\n".join(lines[second_line - 1 : second_line - 1 + min_block_size])
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title="Duplicate Code Block Detected",
                            severity="Medium",
                            category="Code Smell",
                            line_start=second_line,
                            line_end=second_line + min_block_size - 1,
                            snippet=snippet,
                            explanation=(
                                f"Identical code sequence of {min_block_size} lines is duplicated at line {first_line} "
                                f"and line {second_line}. Violates the DRY (Don't Repeat Yourself) principle."
                            ),
                            impact="Increases maintenance burden; bug fixes applied in one location may be missed in copies.",
                            recommended_fix="Extract duplicate logic into a shared helper function or utility module.",
                            confidence="High",
                            detection_method="Static Token Hash Matching",
                            rule_id="SMELL-DUPLICATE-CODE",
                            suggested_patch=f"# Extract shared routine:\ndef shared_routine():\n{snippet}",
                        )
                    )
        return findings

    # ─────────────────────────────────────────────────────────────────────────────
    # 2. PYTHON DEEP AST CODE SMELL ANALYSIS
    # ─────────────────────────────────────────────────────────────────────────────
    def _analyze_python_smells(self, code: str, lines: List[str]) -> List[FindingSchema]:
        findings: List[FindingSchema] = []

        try:
            tree = ast.parse(code)
            # Annotate parents for nesting depth calculations
            for parent in ast.walk(tree):
                for child in ast.iter_child_nodes(parent):
                    setattr(child, "parent", parent)
        except SyntaxError:
            # Syntax errors are handled by PythonAstAnalyzer
            return []

        # Track global variables, imports, and symbols
        imported_symbols: Dict[str, Tuple[int, str]] = {}  # symbol_name -> (line, original_stmt)
        used_names: Set[str] = set()

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    name = alias.asname or alias.name
                    imported_symbols[name] = (node.lineno, alias.name)
            elif isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    name = alias.asname or alias.name
                    imported_symbols[name] = (node.lineno, alias.name)
            elif isinstance(node, ast.Name):
                if isinstance(node.ctx, ast.Load):
                    used_names.add(node.id)

        # 2.1 Unused Imports
        for sym, (line_no, orig_name) in imported_symbols.items():
            if sym not in used_names and sym != "__all__":
                snippet = lines[line_no - 1] if 0 <= line_no - 1 < len(lines) else f"import {orig_name}"
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title=f"Unused Import Statement: '{sym}'",
                        severity="Low",
                        category="Code Smell",
                        line_start=line_no,
                        line_end=line_no,
                        snippet=snippet.strip(),
                        explanation=f"The imported module or symbol '{sym}' is never referenced in this file.",
                        impact="Unnecessary imports increase memory overhead, slow load times, and create confusing dependencies.",
                        recommended_fix=f"Remove the unused import `{snippet.strip()}`.",
                        confidence="High",
                        detection_method="Python AST Scope Tracker",
                        rule_id="SMELL-UNUSED-IMPORT",
                    )
                )

        # Walk classes and functions
        for node in ast.walk(tree):
            # 2.2 Long Methods / Functions (> 35 lines)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                end_lineno = getattr(node, "end_lineno", node.lineno)
                func_length = end_lineno - node.lineno + 1
                if func_length > 35:
                    snippet = lines[node.lineno - 1] if 0 <= node.lineno - 1 < len(lines) else ""
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title=f"Long Function: '{node.name}' ({func_length} lines)",
                            severity="Medium",
                            category="Code Smell",
                            line_start=node.lineno,
                            line_end=end_lineno,
                            snippet=snippet.strip(),
                            explanation=(
                                f"Function '{node.name}' spans {func_length} lines, exceeding the recommended "
                                f"threshold of 35 lines. Long functions tend to handle multiple responsibilities."
                            ),
                            impact="Decreases readability, makes unit testing difficult, and increases regression risk.",
                            recommended_fix="Decompose function into smaller, single-purpose helper functions.",
                            confidence="High",
                            detection_method="Python AST Complexity Metric",
                            rule_id="SMELL-LONG-METHOD",
                        )
                    )

                # 2.3 Long Parameter List (>= 5 arguments)
                arg_count = len(node.args.args)
                if arg_count >= 5:
                    arg_names = [a.arg for a in node.args.args]
                    snippet = lines[node.lineno - 1] if 0 <= node.lineno - 1 < len(lines) else ""
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title=f"Long Parameter List in '{node.name}' ({arg_count} parameters)",
                            severity="Medium",
                            category="Code Smell",
                            line_start=node.lineno,
                            line_end=node.lineno,
                            snippet=snippet.strip(),
                            explanation=(
                                f"Function '{node.name}' takes {arg_count} parameters ({', '.join(arg_names)}). "
                                f"Functions with 5+ parameters are difficult to invoke correctly and suggest excessive coupling."
                            ),
                            impact="Callers can easily transpose arguments of matching types, leading to subtle runtime bugs.",
                            recommended_fix="Group related parameters into a Pydantic model, dataclass, or configuration dictionary.",
                            confidence="High",
                            detection_method="Python AST Signature Analyzer",
                            rule_id="SMELL-LONG-PARAM-LIST",
                            suggested_patch=f"from dataclasses import dataclass\n\n@dataclass\nclass {node.name.capitalize()}Options:\n    # Define grouped parameters",
                        )
                    )

                # 2.4 Cyclomatic Complexity / God Function (> 8 decision points)
                complexity = self._calculate_cyclomatic_complexity(node)
                if complexity > 8:
                    snippet = lines[node.lineno - 1] if 0 <= node.lineno - 1 < len(lines) else ""
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title=f"High Cyclomatic Complexity in '{node.name}' (Score: {complexity})",
                            severity="High",
                            category="Code Smell",
                            line_start=node.lineno,
                            line_end=end_lineno,
                            snippet=snippet.strip(),
                            explanation=(
                                f"Function '{node.name}' has a cyclomatic complexity score of {complexity} "
                                f"(threshold is 8). It contains excessive branching paths and conditional decisions."
                            ),
                            impact="Exponential increase in possible execution paths makes comprehensive testing nearly impossible.",
                            recommended_fix="Use strategy pattern, table-driven lookups, or polymorphism to eliminate nested branches.",
                            confidence="High",
                            detection_method="McCabe Cyclomatic Metric",
                            rule_id="SMELL-COMPLEXITY-GOD-FUNC",
                        )
                    )

                # 2.5 Unused Local Variables in Function
                assigned_vars: Dict[str, int] = {}
                loaded_vars: Set[str] = set()
                for sub_node in ast.walk(node):
                    if isinstance(sub_node, ast.Name):
                        if isinstance(sub_node.ctx, ast.Store):
                            # Ignore special/dummy variables like '_' or '__'
                            if not sub_node.id.startswith("_") and sub_node.id not in [a.arg for a in node.args.args]:
                                assigned_vars[sub_node.id] = sub_node.lineno
                        elif isinstance(sub_node.ctx, ast.Load):
                            loaded_vars.add(sub_node.id)

                for var_name, var_line in assigned_vars.items():
                    if var_name not in loaded_vars:
                        snippet = lines[var_line - 1] if 0 <= var_line - 1 < len(lines) else f"{var_name} = ..."
                        findings.append(
                            FindingSchema(
                                id=str(uuid.uuid4()),
                                title=f"Unused Local Variable: '{var_name}'",
                                severity="Low",
                                category="Code Smell",
                                line_start=var_line,
                                line_end=var_line,
                                snippet=snippet.strip(),
                                explanation=f"Variable '{var_name}' is assigned on line {var_line} but its value is never used.",
                                impact="Dead assignments clutter code, obscure intentions, and can hide abandoned logic.",
                                recommended_fix=f"Remove variable assignment or prefix with an underscore `_{var_name}` if intentional.",
                                confidence="High",
                                detection_method="Python AST Scope Tracker",
                                rule_id="SMELL-UNUSED-VARIABLE",
                            )
                        )

            # 2.6 Large Classes (> 150 lines or > 8 methods)
            elif isinstance(node, ast.ClassDef):
                end_lineno = getattr(node, "end_lineno", node.lineno)
                class_length = end_lineno - node.lineno + 1
                methods = [n for n in node.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
                if class_length > 150 or len(methods) > 8:
                    snippet = lines[node.lineno - 1] if 0 <= node.lineno - 1 < len(lines) else ""
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title=f"Large Class / Potential God Class: '{node.name}' ({class_length} lines, {len(methods)} methods)",
                            severity="Medium",
                            category="Code Smell",
                            line_start=node.lineno,
                            line_end=end_lineno,
                            snippet=snippet.strip(),
                            explanation=(
                                f"Class '{node.name}' has {class_length} lines and {len(methods)} methods. "
                                f"Classes of this size frequently violate the Single Responsibility Principle."
                            ),
                            impact="Creates tight coupling across unrelated behaviors and hampers reusability.",
                            recommended_fix="Decompose class into cohesive smaller classes following single responsibility.",
                            confidence="High",
                            detection_method="Python AST Class Metric",
                            rule_id="SMELL-LARGE-CLASS",
                        )
                    )

            # 2.7 Dead / Unreachable Code (statements after unconditional return, raise, break, continue)
            if hasattr(node, "body") and isinstance(node.body, list):
                for idx, stmt in enumerate(node.body):
                    if isinstance(stmt, (ast.Return, ast.Raise, ast.Break, ast.Continue)):
                        if idx + 1 < len(node.body):
                            dead_stmt = node.body[idx + 1]
                            dead_line = getattr(dead_stmt, "lineno", stmt.lineno + 1)
                            snippet = lines[dead_line - 1] if 0 <= dead_line - 1 < len(lines) else ""
                            findings.append(
                                FindingSchema(
                                    id=str(uuid.uuid4()),
                                    title="Unreachable Dead Code Detected",
                                    severity="High",
                                    category="Code Smell",
                                    line_start=dead_line,
                                    line_end=getattr(dead_stmt, "end_lineno", dead_line),
                                    snippet=snippet.strip(),
                                    explanation=f"Statements following an unconditional `{stmt.__class__.__name__.lower()}` can never be reached during execution.",
                                    impact="Dead code adds confusion, misleads developers, and indicates incomplete refactoring.",
                                    recommended_fix="Remove the unreachable code block or fix preceding control flow.",
                                    confidence="High",
                                    detection_method="Python AST Control Flow Analysis",
                                    rule_id="SMELL-DEAD-CODE",
                                )
                            )
                            break

            # 2.8 Deeply Nested Conditional Statements (nesting depth >= 3)
            if isinstance(node, (ast.If, ast.While, ast.For)):
                depth = self._get_ast_nesting_depth(node)
                if depth >= 3:
                    snippet = lines[node.lineno - 1] if 0 <= node.lineno - 1 < len(lines) else ""
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title=f"Deeply Nested Control Flow (Nesting Level: {depth})",
                            severity="Medium",
                            category="Code Smell",
                            line_start=node.lineno,
                            line_end=node.lineno,
                            snippet=snippet.strip(),
                            explanation=f"Statement is nested {depth} levels deep inside control structures (if/for/while).",
                            impact="Creates an 'arrow anti-pattern', making logic exceedingly hard to track and reason about.",
                            recommended_fix="Use guard clauses with early returns or extract inner loops into dedicated helpers.",
                            confidence="High",
                            detection_method="Python AST Depth Metric",
                            rule_id="SMELL-DEEP-NESTING",
                        )
                    )

            # 2.9 Complex Conditional Expressions (>= 3 boolean operators)
            if isinstance(node, ast.If):
                bool_ops_count = self._count_bool_ops(node.test)
                if bool_ops_count >= 3:
                    snippet = lines[node.lineno - 1] if 0 <= node.lineno - 1 < len(lines) else ""
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title=f"Complex Conditional Expression ({bool_ops_count} boolean operators)",
                            severity="Low",
                            category="Code Smell",
                            line_start=node.lineno,
                            line_end=node.lineno,
                            snippet=snippet.strip(),
                            explanation=f"Conditional expression contains {bool_ops_count} logical operators (`and`/`or`) without intermediate variables.",
                            impact="Hard to read, verify, and debug when edge conditions fail.",
                            recommended_fix="Extract sub-conditions into descriptive boolean variables (e.g., `is_eligible = ...`).",
                            confidence="High",
                            detection_method="Python AST Expression Inspector",
                            rule_id="SMELL-COMPLEX-CONDITIONAL",
                        )
                    )

            # 2.10 Unnecessary Code Complexity (e.g., if x == True:, return True if cond else False)
            if isinstance(node, ast.Compare):
                for comp in node.comparators:
                    if isinstance(comp, ast.Constant) and isinstance(comp.value, bool):
                        snippet = lines[node.lineno - 1] if 0 <= node.lineno - 1 < len(lines) else ""
                        findings.append(
                            FindingSchema(
                                id=str(uuid.uuid4()),
                                title="Redundant Boolean Comparison (`== True` or `== False`)",
                                severity="Low",
                                category="Code Smell",
                                line_start=node.lineno,
                                line_end=node.lineno,
                                snippet=snippet.strip(),
                                explanation="Comparing an expression directly to `True` or `False` is redundant and unidiomatic.",
                                impact="Adds visual clutter and violates Python PEP 8 style standards.",
                                recommended_fix="Simplify to `if condition:` or `if not condition:` directly.",
                                confidence="High",
                                detection_method="Python AST Expression Inspector",
                                rule_id="SMELL-REDUNDANT-BOOLEAN",
                            )
                        )

            # 2.11 Magic Numbers and Hardcoded Constants
            if isinstance(node, ast.Constant):
                val = node.value
                # Check for unnamed non-trivial numeric literals
                if isinstance(val, (int, float)) and val not in [0, 1, 2, -1, 0.0, 1.0, 0.5]:
                    # Exclude loop bounds, simple index lookups, or if already in an ALL_CAPS assignment
                    line_no = getattr(node, "lineno", 1)
                    snippet = lines[line_no - 1] if 0 <= line_no - 1 < len(lines) else ""
                    # Check if line is a named constant definition (e.g. TIMEOUT_SECONDS = 86400)
                    is_const_def = bool(re.match(r"^\s*[A-Z0-9_]{3,}\s*=", snippet))
                    if not is_const_def and (val > 10 or val < -10 or isinstance(val, float)):
                        findings.append(
                            FindingSchema(
                                id=str(uuid.uuid4()),
                                title=f"Magic Number Detected: `{val}`",
                                severity="Low",
                                category="Code Smell",
                                line_start=line_no,
                                line_end=line_no,
                                snippet=snippet.strip(),
                                explanation=f"Unnamed numerical constant `{val}` is hardcoded directly into the algorithm.",
                                impact="Obscures business meaning and makes updating threshold values error-prone.",
                                recommended_fix=f"Extract `{val}` into a named constant at module level (e.g. `MAX_RETRIES = {val}`).",
                                confidence="Medium",
                                detection_method="Python AST Constant Inspector",
                                rule_id="SMELL-MAGIC-NUMBER",
                            )
                        )

            # 2.12 Excessive Global Variables
            if isinstance(node, ast.Global):
                snippet = lines[node.lineno - 1] if 0 <= node.lineno - 1 < len(lines) else f"global {', '.join(node.names)}"
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title=f"Use of 'global' Keyword: `{', '.join(node.names)}`",
                        severity="Medium",
                        category="Code Smell",
                        line_start=node.lineno,
                        line_end=node.lineno,
                        snippet=snippet.strip(),
                        explanation=f"Modifying global state with `global {', '.join(node.names)}` couples functions to implicit outside variables.",
                        impact="Introduces race conditions, makes functions non-reentrant, and complicates unit testing.",
                        recommended_fix="Pass state as explicit parameters and return modified values or encapsulate in a class.",
                        confidence="High",
                        detection_method="Python AST Scope Tracker",
                        rule_id="SMELL-GLOBAL-VARIABLE",
                    )
                )

            # 2.13 Resource Management: Unclosed file handles
            if isinstance(node, ast.Call):
                func_id = ""
                if isinstance(node.func, ast.Name):
                    func_id = node.func.id
                if func_id == "open":
                    # Check if parent is a With statement
                    # In AST walk, if open() is called directly without with
                    line_no = getattr(node, "lineno", 1)
                    snippet = lines[line_no - 1] if 0 <= line_no - 1 < len(lines) else ""
                    if not snippet.strip().startswith("with "):
                        findings.append(
                            FindingSchema(
                                id=str(uuid.uuid4()),
                                title="File Opened Without `with` Context Manager",
                                severity="High",
                                category="Code Smell",
                                line_start=line_no,
                                line_end=line_no,
                                snippet=snippet.strip(),
                                explanation="Calling `open()` without a `with` context manager risks resource leaks if exceptions occur before `.close()`.",
                                impact="Operating system file descriptor exhaustion and locks on unclosed files.",
                                recommended_fix="Use `with open(...) as f:` to guarantee proper cleanup on exit.",
                                confidence="High",
                                detection_method="Python AST Resource Inspector",
                                rule_id="SMELL-RESOURCE-LEAK",
                                suggested_patch="with open(filepath, 'r') as f:\n    data = f.read()",
                            )
                        )

            # 2.14 Poor Error Handling: Swallowing Exceptions (pass in except)
            if isinstance(node, ast.ExceptHandler):
                is_empty_or_pass = False
                if len(node.body) == 1 and isinstance(node.body[0], ast.Pass):
                    is_empty_or_pass = True
                if is_empty_or_pass:
                    line_no = getattr(node, "lineno", 1)
                    snippet = lines[line_no - 1] if 0 <= line_no - 1 < len(lines) else "except: pass"
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title="Silent Exception Swallowing (`except: pass`)",
                            severity="High",
                            category="Code Smell",
                            line_start=line_no,
                            line_end=line_no + 1,
                            snippet=snippet.strip(),
                            explanation="Silently ignoring exceptions with `pass` prevents diagnosis of unexpected failures and hides corrupt state.",
                            impact="Produces elusive bugs where data is corrupted but no errors are logged.",
                            recommended_fix="Log the exception with details or handle specific error recovery steps.",
                            confidence="High",
                            detection_method="Python AST Error Handling Rule",
                            rule_id="SMELL-SWALLOWED-EXCEPTION",
                            suggested_patch="except Exception as e:\n    logging.warning(f'Encountered error: {e}')",
                        )
                    )

            # 2.15 Performance Anti-Pattern: String concatenation in loop
            if isinstance(node, (ast.For, ast.While)):
                for sub in ast.walk(node):
                    if isinstance(sub, ast.AugAssign) and isinstance(sub.op, ast.Add):
                        # e.g., result += text
                        line_no = getattr(sub, "lineno", node.lineno)
                        snippet = lines[line_no - 1] if 0 <= line_no - 1 < len(lines) else ""
                        if any(token in snippet for token in ["str", "string", "text", "html", "msg", "out"]):
                            findings.append(
                                FindingSchema(
                                    id=str(uuid.uuid4()),
                                    title="Potential String Concatenation Inside Loop",
                                    severity="Low",
                                    category="Code Smell",
                                    line_start=line_no,
                                    line_end=line_no,
                                    snippet=snippet.strip(),
                                    explanation="Repeated string concatenation (`+=`) in a loop has $O(N^2)$ quadratic complexity due to string immutability.",
                                    impact="Degrades performance significantly as loop iteration count increases.",
                                    recommended_fix="Append chunks to a list and combine with `''.join(chunks)` after the loop.",
                                    confidence="Medium",
                                    detection_method="Python AST Performance Analyzer",
                                    rule_id="SMELL-STRING-CONCAT-LOOP",
                                )
                            )

        # 2.16 Poor / Unclear Naming (single letter non-idiomatic variables)
        for i, line in enumerate(lines):
            # Check for assignments like `a = ...` or `temp = ...` or `data1 = ...`
            match = re.search(r"^\s*([a-zA-Z])\s*=\s*[^=]", line)
            if match:
                var_char = match.group(1)
                if var_char not in ["i", "j", "k", "x", "y", "_", "e", "f"]:  # allow standard coords / indices
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title=f"Unclear Single-Letter Variable Name: `{var_char}`",
                            severity="Low",
                            category="Code Smell",
                            line_start=i + 1,
                            line_end=i + 1,
                            snippet=line.strip(),
                            explanation=f"Variable name `{var_char}` is uncommunicative and lacks semantic meaning.",
                            impact="Reduces readability; readers must deduce purpose from surrounding context.",
                            recommended_fix=f"Rename `{var_char}` to a descriptive noun describing its content or role.",
                            confidence="Medium",
                            detection_method="Naming Heuristics",
                            rule_id="SMELL-UNCLEAR-NAMING",
                        )
                    )

        # 2.17 Excessive Module Dependencies (> 8 import statements)
        import_count = len(imported_symbols)
        if import_count > 10:
            findings.append(
                FindingSchema(
                    id=str(uuid.uuid4()),
                    title=f"Excessive Module Dependencies ({import_count} imported symbols)",
                    severity="Low",
                    category="Code Smell",
                    line_start=1,
                    line_end=min(10, len(lines)),
                    snippet=lines[0] if lines else "",
                    explanation=f"Module imports {import_count} distinct external symbols, indicating high architectural coupling.",
                    impact="Increases build time and fragility when upstream dependencies change.",
                    recommended_fix="Refactor module to delegate responsibilities to sub-components.",
                    confidence="Medium",
                    detection_method="Dependency Graph Metric",
                    rule_id="SMELL-HIGH-COUPLING",
                )
            )

        return findings

    # ─────────────────────────────────────────────────────────────────────────────
    # 3. POLYGLOT CODE SMELL SCANNER (JS, TS, Java, C++, Go, etc.)
    # ─────────────────────────────────────────────────────────────────────────────
    def _analyze_polyglot_smells(self, code: str, lines: List[str], lang: str) -> List[FindingSchema]:
        findings: List[FindingSchema] = []

        for i, line in enumerate(lines):
            stripped = line.strip()

            # Deep nesting
            indent = (len(line) - len(line.lstrip())) // 4
            if indent >= 4 and any(kw in line for kw in ["if", "for", "while", "switch"]):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title=f"Excessive Control Flow Nesting (Level {indent})",
                        severity="Medium",
                        category="Code Smell",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped,
                        explanation=f"Control statement is nested {indent} levels deep.",
                        impact="Elevates cognitive load and defect probability.",
                        recommended_fix="Invert conditions to use guard clauses with early returns.",
                        confidence="High",
                        detection_method="Indentation Depth Metric",
                        rule_id="SMELL-POLYGLOT-NESTING",
                    )
                )

            # Complex conditionals (>= 3 boolean operators)
            bool_ops = len(re.findall(r"(&&|\|\|)", line))
            if bool_ops >= 3 and any(kw in line for kw in ["if", "while"]):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title=f"Complex Boolean Expression ({bool_ops} operators)",
                        severity="Low",
                        category="Code Smell",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped,
                        explanation="Expression combines multiple logical conditions without intermediate variables.",
                        impact="Increases probability of logic precedence errors.",
                        recommended_fix="Decompose into descriptive boolean variables.",
                        confidence="High",
                        detection_method="Polyglot Expression Analyzer",
                        rule_id="SMELL-COMPLEX-BOOLEAN",
                    )
                )

            # Empty catch blocks
            if re.search(r"catch\s*\([^\)]*\)\s*\{\s*\}", line):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Empty Exception Catch Block",
                        severity="High",
                        category="Code Smell",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped,
                        explanation="Catching an exception and discarding it without logging hides defects.",
                        impact="Results in silent failures and unhandled edge cases.",
                        recommended_fix="Log error details or propagate a domain exception.",
                        confidence="High",
                        detection_method="Polyglot Quality Scanner",
                        rule_id="SMELL-EMPTY-CATCH",
                    )
                )

            # Redundant boolean comparison (== true or == false)
            if re.search(r"(?:===|==)\s*(?:true|false)\b", line, re.IGNORECASE):
                findings.append(
                    FindingSchema(
                        id=str(uuid.uuid4()),
                        title="Redundant Boolean Comparison (`=== true` or `=== false`)",
                        severity="Low",
                        category="Code Smell",
                        line_start=i + 1,
                        line_end=i + 1,
                        snippet=stripped,
                        explanation="Comparing boolean values directly against true/false literals is redundant.",
                        impact="Adds syntactic noise to conditional expressions.",
                        recommended_fix="Test truthiness directly: `if (condition)` or `if (!condition)`.",
                        confidence="High",
                        detection_method="Polyglot Quality Scanner",
                        rule_id="SMELL-REDUNDANT-BOOLEAN",
                    )
                )

        return findings

    # ─────────────────────────────────────────────────────────────────────────────
    # HELPER METRICS
    # ─────────────────────────────────────────────────────────────────────────────
    def _calculate_cyclomatic_complexity(self, node: ast.AST) -> int:
        complexity = 1
        for sub in ast.walk(node):
            if isinstance(sub, (ast.If, ast.While, ast.For, ast.ExceptHandler, ast.With, ast.Assert)):
                complexity += 1
            elif isinstance(sub, ast.BoolOp):
                complexity += len(sub.values) - 1
        return complexity

    def _get_ast_nesting_depth(self, node: ast.AST) -> int:
        depth = 0
        current = node
        while hasattr(current, "parent"):
            current = getattr(current, "parent")
            if isinstance(current, (ast.If, ast.While, ast.For, ast.FunctionDef)):
                depth += 1
        return depth

    def _count_bool_ops(self, node: ast.AST) -> int:
        count = 0
        for sub in ast.walk(node):
            if isinstance(sub, ast.BoolOp):
                count += len(sub.values) - 1
        return count
