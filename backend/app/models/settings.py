import uuid
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    theme = Column(String(20), default="dark")
    default_language = Column(String(50), default="python")
    realtime_analysis = Column(Boolean, default=True)
    debounce_delay_ms = Column(Integer, default=800)
    ai_provider = Column(String(50), default="gemini")
    ai_model_name = Column(String(100), default="gemini-1.5-pro")
    data_retention_days = Column(Integer, default=30)
    save_source_code = Column(Boolean, default=True)

    user = relationship("User", back_populates="settings")
