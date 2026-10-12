"""
Preprocessing, tokenization, train/val/test splitting, and data leakage detection.
"""

import hashlib
import random
import re
from typing import Dict, List, Set, Tuple
from ml.data.dataset_loader import CodeSample


class Preprocessor:
    @staticmethod
    def clean_code(code: str) -> str:
        # Normalize indentation and whitespace
        lines = code.split("\n")
        cleaned_lines = [line.rstrip() for line in lines if line.strip()]
        return "\n".join(cleaned_lines)

    @staticmethod
    def compute_hash(code: str) -> str:
        # Canonical hash ignoring superficial whitespace changes
        normalized = re.sub(r"\s+", " ", code.strip())
        return hashlib.sha256(normalized.encode("utf-8")).hexdigest()

    @classmethod
    def check_leakage(
        cls,
        train_samples: List[CodeSample],
        val_samples: List[CodeSample],
        test_samples: List[CodeSample],
    ) -> Dict[str, int]:
        """
        Detects data leakage across dataset splits using canonical code hashes.
        """
        train_hashes: Set[str] = {cls.compute_hash(s.code) for s in train_samples}
        val_hashes: Set[str] = {cls.compute_hash(s.code) for s in val_samples}
        test_hashes: Set[str] = {cls.compute_hash(s.code) for s in test_samples}

        train_val_overlap = len(train_hashes.intersection(val_hashes))
        train_test_overlap = len(train_hashes.intersection(test_hashes))
        val_test_overlap = len(val_hashes.intersection(test_hashes))

        return {
            "train_val_leakage": train_val_overlap,
            "train_test_leakage": train_test_overlap,
            "val_test_leakage": val_test_overlap,
            "total_leakage_detected": train_val_overlap + train_test_overlap + val_test_overlap,
        }

    @classmethod
    def stratified_split(
        cls,
        samples: List[CodeSample],
        train_ratio: float = 0.8,
        val_ratio: float = 0.1,
        seed: int = 42,
    ) -> Tuple[List[CodeSample], List[CodeSample], List[CodeSample]]:
        """
        Splits samples into train, validation, and test sets with stratified class balances.
        """
        random.seed(seed)
        clean_samples = [s for s in samples if s.label == 0]
        vuln_samples = [s for s in samples if s.label == 1]

        random.shuffle(clean_samples)
        random.shuffle(vuln_samples)

        def split_list(lst: List[CodeSample]):
            n_total = len(lst)
            n_train = int(n_total * train_ratio)
            n_val = int(n_total * val_ratio)
            return lst[:n_train], lst[n_train:n_train + n_val], lst[n_train + n_val:]

        clean_train, clean_val, clean_test = split_list(clean_samples)
        vuln_train, vuln_val, vuln_test = split_list(vuln_samples)

        train = clean_train + vuln_train
        val = clean_val + vuln_val
        test = clean_test + vuln_test

        random.shuffle(train)
        random.shuffle(val)
        random.shuffle(test)

        return train, val, test
