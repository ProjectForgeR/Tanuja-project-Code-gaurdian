"""
Dataset loader for CodeXGLUE (Defect Detection) and Big-Vul (Vulnerability Detection) datasets.
Supports loading from JSONL, CSV, and downloading standard benchmark samples.
"""

import json
import os
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple


@dataclass
class CodeSample:
    id: str
    code: str
    label: int  # 0: Clean, 1: Vulnerable / Defective
    language: str
    cwe: Optional[str] = None
    commit_id: Optional[str] = None
    project: Optional[str] = None


class DatasetLoader:
    def __init__(self, data_dir: str = "ml/data"):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)

    def load_codexglue_defect(self, split: str = "train") -> List[CodeSample]:
        """
        Loads CodeXGLUE defect detection dataset (JSON Lines format).
        Each record contains: {'project': str, 'commit_id': str, 'target': int, 'func': str}
        """
        file_path = os.path.join(self.data_dir, f"codexglue_{split}.jsonl")
        if not os.path.exists(file_path):
            return self._generate_sample_benchmark(split, source="codexglue")

        samples: List[CodeSample] = []
        with open(file_path, "r", encoding="utf-8") as f:
            for idx, line in enumerate(f):
                if not line.strip():
                    continue
                item = json.loads(line)
                samples.append(
                    CodeSample(
                        id=f"codexglue-{split}-{idx}",
                        code=item.get("func", ""),
                        label=int(item.get("target", 0)),
                        language="c",
                        project=item.get("project"),
                        commit_id=item.get("commit_id"),
                    )
                )
        return samples

    def load_big_vul(self, split: str = "train") -> List[CodeSample]:
        """
        Loads Big-Vul vulnerability dataset.
        Contains real-world C/C++ CVE vulnerabilities mapped to CWEs.
        """
        file_path = os.path.join(self.data_dir, f"bigvul_{split}.jsonl")
        if not os.path.exists(file_path):
            return self._generate_sample_benchmark(split, source="bigvul")

        samples: List[CodeSample] = []
        with open(file_path, "r", encoding="utf-8") as f:
            for idx, line in enumerate(f):
                if not line.strip():
                    continue
                item = json.loads(line)
                samples.append(
                    CodeSample(
                        id=f"bigvul-{split}-{idx}",
                        code=item.get("func_before", item.get("code", "")),
                        label=int(item.get("vul", 1)),
                        language="c",
                        cwe=item.get("cwe_id"),
                        commit_id=item.get("commit_id"),
                    )
                )
        return samples

    def _generate_sample_benchmark(self, split: str, source: str) -> List[CodeSample]:
        """
        Sample benchmark items representing standard vulnerabilities and clean code
        for pipeline verification when raw multi-gigabyte datasets are not pre-downloaded.
        """
        clean_code = """
int calculate_sum(int a, int b) {
    if (a > 1000 || b > 1000) {
        return -1;
    }
    return a + b;
}
"""
        vuln_code_bof = """
void copy_buffer(char *input) {
    char dest[32];
    strcpy(dest, input); // Buffer overflow vulnerability
}
"""
        vuln_code_sqli = """
void get_record(char *id) {
    char query[256];
    sprintf(query, "SELECT * FROM users WHERE id = '%s'", id);
    db_execute(query);
}
"""
        return [
            CodeSample(id=f"{source}-{split}-0", code=clean_code.strip(), label=0, language="c"),
            CodeSample(id=f"{source}-{split}-1", code=vuln_code_bof.strip(), label=1, language="c", cwe="CWE-120"),
            CodeSample(id=f"{source}-{split}-2", code=vuln_code_sqli.strip(), label=1, language="c", cwe="CWE-89"),
        ]
