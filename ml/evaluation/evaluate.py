"""
Evaluation metrics: Precision, Recall, F1-Score, Confusion Matrix, and Accuracy.
"""

from typing import Dict, List, Tuple


class MetricsEvaluator:
    @staticmethod
    def compute_confusion_matrix(y_true: List[int], y_pred: List[int]) -> Dict[str, int]:
        tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)
        fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)
        tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 0)
        fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)
        return {"true_positives": tp, "false_positives": fp, "true_negatives": tn, "false_negatives": fn}

    @classmethod
    def evaluate(cls, y_true: List[int], y_pred: List[int]) -> Dict[str, float]:
        cm = cls.compute_confusion_matrix(y_true, y_pred)
        tp = cm["true_positives"]
        fp = cm["false_positives"]
        tn = cm["true_negatives"]
        fn = cm["false_negatives"]

        total = tp + fp + tn + fn
        accuracy = (tp + tn) / total if total > 0 else 0.0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        return {
            "accuracy": round(accuracy, 4),
            "precision": round(precision, 4),
            "recall": round(recall, 4),
            "f1_score": round(f1, 4),
            "true_positives": tp,
            "false_positives": fp,
            "true_negatives": tn,
            "false_negatives": fn,
        }
