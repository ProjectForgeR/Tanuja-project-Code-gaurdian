from typing import Optional
from pydantic import BaseModel


class SettingsSchema(BaseModel):
    id: Optional[str] = None
    user_id: Optional[str] = None
    theme: str = "dark"
    default_language: str = "python"
    realtime_analysis: bool = True
    debounce_delay_ms: int = 800
    ai_provider: str = "gemini"
    ai_model_name: str = "gemini-1.5-pro"
    data_retention_days: int = 30
    save_source_code: bool = True
    ai_provider_configured: bool = False

    model_config = {"from_attributes": True}


class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    default_language: Optional[str] = None
    realtime_analysis: Optional[bool] = None
    debounce_delay_ms: Optional[int] = None
    ai_provider: Optional[str] = None
    ai_model_name: Optional[str] = None
    data_retention_days: Optional[int] = None
    save_source_code: Optional[bool] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
