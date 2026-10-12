# CodeGuardian AI — Machine Learning Pipeline

This module provides the machine learning research and training pipeline for defect and vulnerability prediction using **CodeBERT** on **CodeXGLUE** and **Big-Vul** datasets.

## Structure
- `data/`: Dataset loaders for CodeXGLUE defect detection and Big-Vul CVE datasets.
- `preprocessing/`: Tokenization, label normalization, stratified splitting, and data leakage detection.
- `training/`: CodeBERT fine-tuning pipeline and hyperparameter configurations.
- `evaluation/`: Metrics calculator (Precision, Recall, F1, Confusion Matrix).
- `inference/`: Documented inference interface for embedding extraction and defect scoring.

## Getting Started

1. Install PyTorch & Transformers:
   ```bash
   pip install torch transformers datasets scikit-learn
   ```

2. Download Benchmark Data:
   Download the CodeXGLUE defect detection dataset (`codexglue_train.jsonl`, `codexglue_test.jsonl`) into `ml/data/`.

3. Run Preprocessing & Leakage Check:
   ```bash
   python -m ml.preprocessing.preprocess
   ```

4. Train Model:
   ```bash
   python -m ml.training.train_classifier
   ```

5. Evaluate Metrics:
   ```bash
   python -m ml.evaluation.evaluate
   ```
