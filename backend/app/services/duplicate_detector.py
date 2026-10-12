import re
import uuid
from typing import Dict, List, Set, Tuple
from app.schemas.analysis import DuplicateGroupSchema, FindingSchema


class DuplicateDetector:
    """
    Groups similar and duplicate findings to prevent redundant alerts.
    """

    @classmethod
    def group_duplicates(cls, findings: List[FindingSchema]) -> Tuple[List[FindingSchema], List[DuplicateGroupSchema]]:
        if len(findings) <= 1:
            return findings, []

        groups: List[DuplicateGroupSchema] = []
        finding_to_group: Dict[int, str] = {}
        grouped_indices: Set[int] = set()

        for i in range(len(findings)):
            if i in grouped_indices:
                continue

            current_group_indices = [i]
            for j in range(i + 1, len(findings)):
                if j in grouped_indices:
                    continue

                sim = cls._calculate_similarity(findings[i], findings[j])
                if sim >= 0.70:
                    current_group_indices.append(j)

            if len(current_group_indices) > 1:
                group_id = str(uuid.uuid4())
                group_findings = [findings[idx] for idx in current_group_indices]
                f0 = group_findings[0]

                for idx in current_group_indices:
                    grouped_indices.add(idx)
                    finding_to_group[idx] = group_id
                    findings[idx].duplicate_group_id = group_id

                groups.append(
                    DuplicateGroupSchema(
                        id=group_id,
                        title=f"Grouped: {f0.title} ({len(group_findings)} instances)",
                        description=(
                            f"Identified {len(group_findings)} related findings sharing pattern "
                            f"'{f0.rule_id or f0.title}'. Consolidating reports to streamline remediation."
                        ),
                        count=len(group_findings),
                        similarity_score=round(
                            sum(cls._calculate_similarity(f0, fj) for fj in group_findings) / len(group_findings),
                            2,
                        ),
                        finding_ids=[f.id for f in group_findings if f.id],
                    )
                )

        return findings, groups

    @classmethod
    def _calculate_similarity(cls, f1: FindingSchema, f2: FindingSchema) -> float:
        # Same rule id
        if f1.rule_id and f2.rule_id and f1.rule_id == f2.rule_id:
            # Same rule on same line = 1.0 (exact duplicate)
            if f1.line_start == f2.line_start:
                return 1.0
            # Same rule elsewhere in file = 0.85
            return 0.85

        # Check token Jaccard similarity on titles & explanations
        tokens1 = cls._tokenize(f"{f1.title} {f1.category}")
        tokens2 = cls._tokenize(f"{f2.title} {f2.category}")

        if not tokens1 or not tokens2:
            return 0.0

        intersection = len(tokens1.intersection(tokens2))
        union = len(tokens1.union(tokens2))
        jaccard = intersection / union if union > 0 else 0.0

        # Proximity bonus if on same line
        if f1.line_start == f2.line_start:
            jaccard += 0.2

        return min(1.0, round(jaccard, 2))

    @staticmethod
    def _tokenize(text: str) -> Set[str]:
        words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        stopwords = {"this", "that", "with", "from", "have", "been", "using", "when"}
        return set(w for w in words if w not in stopwords)
