import json
import logging
import uuid
from typing import List, Optional, Tuple
import httpx
from app.analyzers.base import BaseAnalyzer
from app.core.config import settings
from app.schemas.analysis import FindingSchema

logger = logging.getLogger(__name__)


class AIAnalyzer(BaseAnalyzer):
    def __init__(self, api_key: Optional[str] = None, provider: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY or settings.OPENAI_API_KEY
        self.provider = provider or settings.DEFAULT_AI_PROVIDER

    async def analyze(self, code: str, language: str, filename: str = "main") -> List[FindingSchema]:
        findings, _ = await self.analyze_with_status(code, language, filename)
        return findings

    async def analyze_with_status(self, code: str, language: str, filename: str = "main") -> Tuple[List[FindingSchema], str]:
        if not self.api_key:
            return [], "AI provider not configured (set GEMINI_API_KEY or OPENAI_API_KEY in Settings)"

        prompt = f"""You are an elite application security and static analysis engine.
Review the following {language} code and identify critical bugs, security vulnerabilities, and code quality issues.
Return ONLY valid JSON matching this schema:
[
  {{
    "title": "Clear finding title",
    "severity": "Critical|High|Medium|Low",
    "category": "Security|Bug|Code Smell|Maintainability",
    "line_start": 1,
    "line_end": 1,
    "snippet": "affected code snippet",
    "explanation": "concise explanation of what is wrong",
    "impact": "concrete real-world impact",
    "recommended_fix": "how to resolve it",
    "confidence": "High|Medium",
    "suggested_patch": "corrected replacement code",
    "rule_id": "AI-RULE-XXX"
  }}
]

If the code has no issues, return [].

Code to analyze:
```{language}
{code}
```
"""

        try:
            async with httpx.AsyncClient(timeout=settings.ANALYSIS_TIMEOUT_SECONDS) as client:
                if self.provider == "gemini" or ("AIza" in self.api_key):
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.DEFAULT_AI_MODEL}:generateContent?key={self.api_key}"
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"},
                    }
                    resp = await client.post(url, json=payload)
                    if resp.status_code != 200:
                        return [], f"AI provider error: HTTP {resp.status_code}"
                    data = resp.json()
                    raw_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "[]")
                else:
                    # OpenAI compatible
                    url = "https://api.openai.com/v1/chat/completions"
                    headers = {"Authorization": f"Bearer {self.api_key}"}
                    payload = {
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1,
                        "response_format": {"type": "json_object"},
                    }
                    resp = await client.post(url, json=payload, headers=headers)
                    if resp.status_code != 200:
                        return [], f"AI provider error: HTTP {resp.status_code}"
                    data = resp.json()
                    raw_text = data["choices"][0]["message"]["content"]

                parsed = json.loads(raw_text)
                if isinstance(parsed, dict) and "findings" in parsed:
                    items = parsed["findings"]
                elif isinstance(parsed, list):
                    items = parsed
                else:
                    items = []

                findings: List[FindingSchema] = []
                for item in items:
                    findings.append(
                        FindingSchema(
                            id=str(uuid.uuid4()),
                            title=item.get("title", "AI-Detected Defect"),
                            severity=item.get("severity", "Medium"),
                            category=item.get("category", "Bug"),
                            line_start=int(item.get("line_start", 1)),
                            line_end=int(item.get("line_end", 1)),
                            snippet=item.get("snippet", ""),
                            explanation=item.get("explanation", ""),
                            impact=item.get("impact", ""),
                            recommended_fix=item.get("recommended_fix", ""),
                            confidence=item.get("confidence", "High"),
                            detection_method=f"AI Engine ({self.provider})",
                            suggested_patch=item.get("suggested_patch"),
                            rule_id=item.get("rule_id", "AI-CUSTOM"),
                        )
                    )
                return findings, "AI analysis completed successfully"

        except Exception as e:
            logger.warning(f"AI analysis invocation failed: {e}")
            return [], f"AI analysis unavailable: {str(e)}"
