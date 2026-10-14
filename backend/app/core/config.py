import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "CodeGuardian AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "codeguardian-super-secret-jwt-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./codeguardian.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://codeguardian.ai:5173",
        "http://localhost:3000",
        "http://localhost:8000",
    ]
    
    # AI Providers
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    DEFAULT_AI_PROVIDER: str = os.getenv("DEFAULT_AI_PROVIDER", "groq")  # groq, gemini, openai, offline
    DEFAULT_AI_MODEL: str = os.getenv("DEFAULT_AI_MODEL", "openai/gpt-oss-120b")


    
    # Analysis Limits
    MAX_CODE_SIZE_BYTES: int = 1024 * 1024  # 1 MB limit
    ANALYSIS_TIMEOUT_SECONDS: int = 30
    
    # Sandboxed Execution Engine (Judge0)
    JUDGE0_API_URL: str = os.getenv("JUDGE0_API_URL", "https://ce.judge0.com")
    JUDGE0_API_KEY: str = os.getenv("JUDGE0_API_KEY", "")
    JUDGE0_API_HOST: str = os.getenv("JUDGE0_API_HOST", "")
    EXECUTION_TIMEOUT_SECONDS: float = float(os.getenv("EXECUTION_TIMEOUT_SECONDS", "10.0"))
    
    model_config = {"case_sensitive": True, "env_file": ".env", "extra": "ignore"}


settings = Settings()
