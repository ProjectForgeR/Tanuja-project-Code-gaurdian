import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), default="Untitled Analysis")
    language = Column(String(50), nullable=False)
    code = Column(Text, nullable=False)
    quality_score = Column(Float, default=100.0)
    risk_score = Column(Float, default=0.0)
    findings_count = Column(Integer, default=0)
    critical_count = Column(Integer, default=0)
    high_count = Column(Integer, default=0)
    medium_count = Column(Integer, default=0)
    low_count = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    status = Column(String(50), default="completed")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User", back_populates="analyses")
    findings = relationship("Finding", back_populates="analysis", cascade="all, delete-orphan")
    duplicate_groups = relationship("DuplicateGroup", back_populates="analysis", cascade="all, delete-orphan")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    severity = Column(String(50), nullable=False, index=True)  # Critical, High, Medium, Low, Informational
    category = Column(String(50), nullable=False, index=True)  # Security, Bug, Code Smell, Maintainability
    line_start = Column(Integer, default=1)
    line_end = Column(Integer, default=1)
    col_start = Column(Integer, default=1)
    col_end = Column(Integer, default=1)
    snippet = Column(Text, nullable=True)
    explanation = Column(Text, nullable=False)
    impact = Column(Text, nullable=True)
    recommended_fix = Column(Text, nullable=True)
    confidence = Column(String(50), default="High")  # High, Medium, Low
    detection_method = Column(String(100), default="Static Analysis")
    suggested_patch = Column(Text, nullable=True)
    rule_id = Column(String(100), nullable=True)
    duplicate_group_id = Column(String(36), nullable=True)

    analysis = relationship("Analysis", back_populates="findings")


class DuplicateGroup(Base):
    __tablename__ = "duplicate_groups"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id = Column(String(36), ForeignKey("analyses.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    count = Column(Integer, default=1)
    similarity_score = Column(Float, default=1.0)

    analysis = relationship("Analysis", back_populates="duplicate_groups")
