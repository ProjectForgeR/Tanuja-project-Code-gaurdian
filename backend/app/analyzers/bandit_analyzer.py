import asyncio
import json
import os
import sys
import tempfile
import uuid
from typing import List
from app.analyzers.base import BaseAnalyzer
from app.schemas.analysis import FindingSchema


class BanditAnalyzer(BaseAnalyzer):
    async def analyze(self, code: str, language: str, filename: str = "main.py") -> List[FindingSchema]:
        if language.lower() not in ["python", "py"]:
            return []

        findings: List[FindingSchema] = []
        temp_file_path = None

        try:
            # Write code to a temporary file
            with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False, encoding="utf-8") as f:
                f.write(code)
                temp_file_path = f.name

            # Determine bandit executable in current virtualenv or PATH
            venv_bin = os.path.dirname(sys.executable)
            bandit_bin = os.path.join(venv_bin, "bandit.exe" if os.name == "nt" else "bandit")
            if not os.path.exists(bandit_bin):
                bandit_bin = "bandit"

            proc = await asyncio.create_subprocess_exec(
                bandit_bin,
                "-f", "json",
                "-q",
                temp_file_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            try:
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=10.0)
            except asyncio.TimeoutError:
                proc.kill()
                return []

            if stdout:
                try:
                    data = json.loads(stdout.decode("utf-8", errors="ignore"))
                    results = data.get("results", [])
                    for res in results:
                        severity_map = {
                            "HIGH": "Critical" if "injection" in res.get("test_name", "").lower() or "eval" in res.get("test_name", "").lower() else "High",
                            "MEDIUM": "Medium",
                            "LOW": "Low",
                        }
                        sev = severity_map.get(res.get("issue_severity", "MEDIUM"), "Medium")
                        line_no = res.get("line_number", 1)

                        findings.append(
                            FindingSchema(
                                id=str(uuid.uuid4()),
                                title=f"Bandit: {res.get('issue_text', 'Security Issue')}",
                                severity=sev,
                                category="Security",
                                line_start=line_no,
                                line_end=res.get("line_range", [line_no])[-1] if res.get("line_range") else line_no,
                                col_start=1,
                                col_end=1,
                                snippet=res.get("code", "").strip(),
                                explanation=f"{res.get('issue_text', '')} (CWE: {res.get('issue_cwe', {}).get('id', 'N/A')}). More info: {res.get('more_info', '')}",
                                impact=f"Vulnerability identified by Bandit test {res.get('test_id')}: {res.get('test_name')}.",
                                recommended_fix="Follow secure coding guidelines for this pattern.",
                                confidence=res.get("issue_confidence", "High").capitalize(),
                                detection_method=f"Bandit ({res.get('test_id')})",
                                rule_id=f"BANDIT-{res.get('test_id')}",
                            )
                        )
                except json.JSONDecodeError:
                    pass

        except Exception:
            # Bandit invocation failure should not break overall analysis
            pass
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.remove(temp_file_path)
                except OSError:
                    pass

        return findings
