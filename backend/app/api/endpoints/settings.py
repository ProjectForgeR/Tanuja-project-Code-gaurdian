from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.settings import UserSettings
from app.models.user import User
from app.schemas.settings import SettingsSchema, SettingsUpdate
from app.security.auth import get_optional_current_user

router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=SettingsSchema)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    ai_configured = bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY)

    if current_user:
        result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
        user_settings = result.scalars().first()
        if user_settings:
            schema = SettingsSchema.model_validate(user_settings)
            schema.ai_provider_configured = ai_configured
            return schema

    # Return defaults for guest
    return SettingsSchema(
        theme="dark",
        default_language="python",
        realtime_analysis=True,
        debounce_delay_ms=800,
        ai_provider=settings.DEFAULT_AI_PROVIDER,
        ai_model_name=settings.DEFAULT_AI_MODEL,
        data_retention_days=30,
        save_source_code=True,
        ai_provider_configured=ai_configured,
    )


@router.put("", response_model=SettingsSchema)
async def update_settings(
    update_data: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    if update_data.gemini_api_key:
        settings.GEMINI_API_KEY = update_data.gemini_api_key
    if update_data.openai_api_key:
        settings.OPENAI_API_KEY = update_data.openai_api_key
    if update_data.ai_provider:
        settings.DEFAULT_AI_PROVIDER = update_data.ai_provider
    if update_data.ai_model_name:
        settings.DEFAULT_AI_MODEL = update_data.ai_model_name

    ai_configured = bool(settings.GEMINI_API_KEY or settings.OPENAI_API_KEY)

    if current_user:
        result = await db.execute(select(UserSettings).where(UserSettings.user_id == current_user.id))
        user_settings = result.scalars().first()
        if not user_settings:
            user_settings = UserSettings(user_id=current_user.id)
            db.add(user_settings)

        if update_data.theme is not None:
            user_settings.theme = update_data.theme
        if update_data.default_language is not None:
            user_settings.default_language = update_data.default_language
        if update_data.realtime_analysis is not None:
            user_settings.realtime_analysis = update_data.realtime_analysis
        if update_data.debounce_delay_ms is not None:
            user_settings.debounce_delay_ms = update_data.debounce_delay_ms
        if update_data.data_retention_days is not None:
            user_settings.data_retention_days = update_data.data_retention_days
        if update_data.save_source_code is not None:
            user_settings.save_source_code = update_data.save_source_code

        await db.commit()
        await db.refresh(user_settings)
        schema = SettingsSchema.model_validate(user_settings)
        schema.ai_provider_configured = ai_configured
        return schema

    return SettingsSchema(
        theme=update_data.theme or "dark",
        default_language=update_data.default_language or "python",
        realtime_analysis=update_data.realtime_analysis if update_data.realtime_analysis is not None else True,
        debounce_delay_ms=update_data.debounce_delay_ms or 800,
        ai_provider=settings.DEFAULT_AI_PROVIDER,
        ai_model_name=settings.DEFAULT_AI_MODEL,
        data_retention_days=update_data.data_retention_days or 30,
        save_source_code=True,
        ai_provider_configured=ai_configured,
    )
