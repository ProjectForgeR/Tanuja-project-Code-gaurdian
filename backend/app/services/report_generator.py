import json
from datetime import datetime
from typing import Any, Dict
from app.models.analysis import Analysis


class ReportGenerator:
    """
    Generates downloadable standalone HTML reports and structured JSON exports.
    """

    @classmethod
    def generate_html(cls, analysis: Analysis) -> str:
        created_str = analysis.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if analysis.created_at else "Just now"
        findings_html = ""
        
        severity_colors = {
            "Critical": "#ef4444",
            "High": "#f97316",
            "Medium": "#eab308",
            "Low": "#3b82f6",
            "Informational": "#94a3b8",
        }

        for f in analysis.findings:
            color = severity_colors.get(f.severity, "#94a3b8")
            snippet_block = f"<pre style='background:#0f172a;color:#f8fafc;padding:12px;border-radius:6px;overflow-x:auto;font-family:monospace;font-size:13px;margin:8px 0;'><code>{cls._escape_html(f.snippet or '')}</code></pre>" if f.snippet else ""
            patch_block = f"<div style='margin-top:8px;'><strong style='color:#10b981;'>Suggested Fix:</strong><pre style='background:#064e3b;color:#a7f3d0;padding:10px;border-radius:6px;overflow-x:auto;font-size:12px;'><code>{cls._escape_html(f.suggested_patch or '')}</code></pre></div>" if f.suggested_patch else ""

            findings_html += f"""
            <div style="background:#1e293b;border:1px solid #334155;border-left:4px solid {color};border-radius:8px;padding:16px;margin-bottom:16px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="background:{color};color:#ffffff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase;">{f.severity}</span>
                        <span style="background:#334155;color:#94a3b8;font-size:11px;padding:3px 8px;border-radius:4px;">{f.category}</span>
                        <span style="color:#64748b;font-size:12px;">Line {f.line_start}</span>
                    </div>
                    <span style="font-size:11px;color:#64748b;">Method: {cls._escape_html(f.detection_method or '')}</span>
                </div>
                <h3 style="margin:4px 0 8px 0;font-size:16px;color:#f8fafc;">{cls._escape_html(f.title)}</h3>
                <p style="color:#cbd5e1;font-size:14px;line-height:1.5;margin:4px 0 8px 0;">{cls._escape_html(f.explanation)}</p>
                {snippet_block}
                {patch_block}
                <div style="margin-top:8px;font-size:12px;color:#94a3b8;">
                    <strong>Impact:</strong> {cls._escape_html(f.impact or 'N/A')}
                </div>
            </div>
            """

        if not findings_html:
            findings_html = """
            <div style="text-align:center;padding:40px;background:#1e293b;border-radius:8px;color:#10b981;">
                <h2>✓ No Defects Detected</h2>
                <p style="color:#94a3b8;">The analyzed source code passed all static and security verification checks.</p>
            </div>
            """

        score_color = "#10b981" if analysis.quality_score >= 80 else "#eab308" if analysis.quality_score >= 50 else "#ef4444"

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeGuardian AI Security Report - {cls._escape_html(analysis.title)}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #0b0f19;
            color: #f1f5f9;
            margin: 0;
            padding: 30px;
        }}
        .container {{
            max-width: 900px;
            margin: 0 auto;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 20px;
            margin-bottom: 25px;
        }}
        .brand {{
            font-size: 22px;
            font-weight: 800;
            color: #38bdf8;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        .stat-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }}
        .stat-card {{
            background: #111827;
            border: 1px solid #1f293d;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
        }}
        .stat-val {{
            font-size: 28px;
            font-weight: 700;
            margin-top: 5px;
        }}
        .score-circle {{
            font-size: 36px;
            font-weight: 900;
            color: {score_color};
        }}
        @media print {{
            body {{ background: #ffffff; color: #000000; }}
            .stat-card {{ border: 1px solid #ccc; background: #fff; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="brand">🛡️ CodeGuardian AI</div>
                <h1 style="margin:8px 0 4px 0;font-size:24px;">Security & Quality Audit Report</h1>
                <div style="color:#94a3b8;font-size:13px;">Target: <strong>{cls._escape_html(analysis.title)}</strong> ({analysis.language.upper()}) | Generated: {created_str}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;">Quality Score</div>
                <div class="score-circle">{analysis.quality_score} <span style="font-size:16px;color:#94a3b8;">/100</span></div>
            </div>
        </div>

        <div class="stat-grid">
            <div class="stat-card">
                <div style="font-size:12px;color:#94a3b8;">Total Findings</div>
                <div class="stat-val" style="color:#f8fafc;">{analysis.findings_count}</div>
            </div>
            <div class="stat-card">
                <div style="font-size:12px;color:#ef4444;">Critical</div>
                <div class="stat-val" style="color:#ef4444;">{analysis.critical_count}</div>
            </div>
            <div class="stat-card">
                <div style="font-size:12px;color:#f97316;">High</div>
                <div class="stat-val" style="color:#f97316;">{analysis.high_count}</div>
            </div>
            <div class="stat-card">
                <div style="font-size:12px;color:#eab308;">Medium</div>
                <div class="stat-val" style="color:#eab308;">{analysis.medium_count}</div>
            </div>
            <div class="stat-card">
                <div style="font-size:12px;color:#3b82f6;">Low</div>
                <div class="stat-val" style="color:#3b82f6;">{analysis.low_count}</div>
            </div>
            <div class="stat-card">
                <div style="font-size:12px;color:#94a3b8;">Scan Duration</div>
                <div class="stat-val" style="color:#a855f7;">{analysis.duration_ms}ms</div>
            </div>
        </div>

        <h2 style="font-size:18px;margin-bottom:15px;color:#38bdf8;">Detailed Audit Findings ({len(analysis.findings)})</h2>
        {findings_html}

        <div style="border-top:1px solid #1e293b;padding-top:20px;margin-top:40px;color:#64748b;font-size:12px;text-align:center;">
            Report generated by CodeGuardian AI Automated Security Review Engine.
        </div>
    </div>
</body>
</html>"""
        return html

    @classmethod
    def generate_json(cls, analysis: Analysis) -> Dict[str, Any]:
        return {
            "id": analysis.id,
            "title": analysis.title,
            "language": analysis.language,
            "quality_score": analysis.quality_score,
            "risk_score": analysis.risk_score,
            "findings_count": analysis.findings_count,
            "critical_count": analysis.critical_count,
            "high_count": analysis.high_count,
            "medium_count": analysis.medium_count,
            "low_count": analysis.low_count,
            "duration_ms": analysis.duration_ms,
            "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
            "findings": [
                {
                    "id": f.id,
                    "title": f.title,
                    "severity": f.severity,
                    "category": f.category,
                    "line_start": f.line_start,
                    "line_end": f.line_end,
                    "snippet": f.snippet,
                    "explanation": f.explanation,
                    "impact": f.impact,
                    "recommended_fix": f.recommended_fix,
                    "confidence": f.confidence,
                    "detection_method": f.detection_method,
                    "suggested_patch": f.suggested_patch,
                    "rule_id": f.rule_id,
                }
                for f in analysis.findings
            ],
        }

    @staticmethod
    def _escape_html(text: str) -> str:
        return (
            text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
            .replace("'", "&#39;")
        )
