from typing import List, Tuple
from app.schemas.analysis import FindingSchema, RiskBreakdownSchema


class ScoringEngine:
    """
    Explainable scoring engine that calculates transparent Code Quality and Risk scores.
    """

    SEVERITY_WEIGHTS = {
        "Critical": 25.0,
        "High": 15.0,
        "Medium": 7.0,
        "Low": 2.0,
        "Informational": 0.0,
    }

    CONFIDENCE_MULTIPLIER = {
        "High": 1.0,
        "Medium": 0.8,
        "Low": 0.5,
    }

    @classmethod
    def calculate(cls, findings: List[FindingSchema], code_lines_count: int = 1) -> Tuple[float, float, RiskBreakdownSchema]:
        if not findings:
            breakdown = RiskBreakdownSchema(
                impact_score=0.0,
                exploitability_score=0.0,
                confidence_score=100.0,
                scope_score=0.0,
                summary="Clean codebase. No defects or security vulnerabilities detected.",
                factors=["Zero security vulnerabilities detected", "Zero code smells or bugs identified"],
            )
            return 100.0, 0.0, breakdown

        total_deduction = 0.0
        factors: List[str] = []
        critical_count = sum(1 for f in findings if f.severity == "Critical")
        high_count = sum(1 for f in findings if f.severity == "High")
        medium_count = sum(1 for f in findings if f.severity == "Medium")
        low_count = sum(1 for f in findings if f.severity == "Low")
        security_count = sum(1 for f in findings if f.category == "Security")

        for f in findings:
            weight = cls.SEVERITY_WEIGHTS.get(f.severity, 2.0)
            conf = cls.CONFIDENCE_MULTIPLIER.get(f.confidence, 1.0)
            penalty = weight * conf
            total_deduction += penalty

        # Quality score starts at 100 and decreases with penalties
        quality_score = max(5.0, round(100.0 - min(95.0, total_deduction), 1))

        # Risk score is between 0 and 100 (higher = riskier)
        risk_score = round(100.0 - quality_score, 1)

        # Factor explanations
        if critical_count > 0:
            factors.append(f"{critical_count} Critical finding(s) detected (-{critical_count * 25} quality pts)")
        if high_count > 0:
            factors.append(f"{high_count} High severity issue(s) detected (-{high_count * 15} quality pts)")
        if medium_count > 0:
            factors.append(f"{medium_count} Medium severity issue(s) detected (-{medium_count * 7} quality pts)")
        if low_count > 0:
            factors.append(f"{low_count} Low severity issue(s) detected (-{low_count * 2} quality pts)")
        if security_count > 0:
            factors.append(f"{security_count} Security-relevant vulnerability checks triggered")

        # Explainable sub-scores
        impact_score = min(100.0, round((critical_count * 30 + high_count * 15 + medium_count * 5), 1))
        exploitability_score = min(100.0, round((security_count * 20 + critical_count * 25), 1))
        confidence_score = round(
            sum(cls.CONFIDENCE_MULTIPLIER.get(f.confidence, 1.0) * 100 for f in findings) / len(findings), 1
        )
        scope_score = min(100.0, round((len(findings) / max(code_lines_count, 10)) * 100, 1))

        summary = (
            f"Quality Score {quality_score}/100: Calculated from {len(findings)} findings "
            f"({critical_count} critical, {high_count} high, {medium_count} medium, {low_count} low). "
            f"Overall Risk Score is {risk_score}/100."
        )

        breakdown = RiskBreakdownSchema(
            impact_score=impact_score,
            exploitability_score=exploitability_score,
            confidence_score=confidence_score,
            scope_score=scope_score,
            summary=summary,
            factors=factors,
        )

        return quality_score, risk_score, breakdown
