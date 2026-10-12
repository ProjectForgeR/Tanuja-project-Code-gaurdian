"""
Training pipeline for fine-tuning CodeBERT / Transformer defect detection model.
"""

from dataclasses import dataclass
import os
import json
from typing import Dict, Any


@dataclass
class TrainingConfig:
    model_name_or_path: str = "microsoft/codebert-base"
    output_dir: str = "ml/checkpoints"
    num_train_epochs: int = 5
    per_device_train_batch_size: int = 16
    per_device_eval_batch_size: int = 32
    learning_rate: float = 2e-5
    weight_decay: float = 0.01
    warmup_ratio: float = 0.1
    max_seq_length: int = 512
    seed: int = 42


def save_training_config(config: TrainingConfig, output_dir: str = "ml/checkpoints"):
    os.makedirs(output_dir, exist_ok=True)
    config_path = os.path.join(output_dir, "training_config.json")
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config.__dict__, f, indent=2)
    print(f"Training configuration saved to {config_path}")


def train_pipeline(config: TrainingConfig) -> Dict[str, Any]:
    """
    Orchestrates CodeBERT fine-tuning.
    Note: Requires `torch` and `transformers` packages when running on GPU compute nodes.
    """
    save_training_config(config, config.output_dir)
    print(f"Starting training pipeline with base model: {config.model_name_or_path}")
    print(f"Epochs: {config.num_train_epochs}, Learning rate: {config.learning_rate}")
    
    # Summary of training parameters
    return {
        "status": "configured",
        "model": config.model_name_or_path,
        "max_seq_length": config.max_seq_length,
        "epochs": config.num_train_epochs,
        "checkpoint_dir": config.output_dir,
    }


if __name__ == "__main__":
    cfg = TrainingConfig()
    res = train_pipeline(cfg)
    print("Pipeline result:", res)
