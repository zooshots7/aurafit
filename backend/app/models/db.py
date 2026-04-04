import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict

from sqlalchemy import String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class SessionModel(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    age_range: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    occasion: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), nullable=True)
    goals: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), nullable=True)
    budget_min: Mapped[float] = mapped_column(Float, default=50)
    budget_max: Mapped[float] = mapped_column(Float, default=300)
    style_preferences: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), nullable=True)
    wear_type: Mapped[str] = mapped_column(String(20), default="all")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    photos: Mapped[List["PhotoModel"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    analysis: Mapped[Optional["AnalysisResultModel"]] = relationship(back_populates="session", uselist=False, cascade="all, delete-orphan")
    recommendations: Mapped[List["RecommendationModel"]] = relationship(back_populates="session", cascade="all, delete-orphan")
    color_palettes: Mapped[List["ColorPaletteModel"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class PhotoModel(Base):
    __tablename__ = "photos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"))
    file_path: Mapped[str] = mapped_column(String(500))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session: Mapped["SessionModel"] = relationship(back_populates="photos")


class AnalysisResultModel(Base):
    __tablename__ = "analysis_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"), unique=True)

    # Body analysis
    body_shape: Mapped[str] = mapped_column(String(30))
    body_build: Mapped[str] = mapped_column(String(20))
    height_category: Mapped[str] = mapped_column(String(20))
    shoulder_hip_ratio: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    torso_leg_ratio: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)

    # Skin analysis
    skin_fitzpatrick: Mapped[str] = mapped_column(String(5))
    skin_undertone: Mapped[str] = mapped_column(String(20))
    skin_label: Mapped[str] = mapped_column(String(100))
    skin_hex: Mapped[str] = mapped_column(String(10))

    # Face analysis
    face_shape: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    eye_color: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)

    # Color analysis
    color_season: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)

    # Style
    style_vibes: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), nullable=True)
    wardrobe_tips: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), nullable=True)

    # Meta
    raw_ai_response: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.85)
    analyzed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session: Mapped["SessionModel"] = relationship(back_populates="analysis")


class RecommendationModel(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"))
    category: Mapped[str] = mapped_column(String(30))
    sub_category: Mapped[str] = mapped_column(String(20), default="western")
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    why_it_works: Mapped[str] = mapped_column(Text)
    items: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    style_tags: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    total_price_usd: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(10), default="rule")
    confidence: Mapped[float] = mapped_column(Float, default=0.9)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session: Mapped["SessionModel"] = relationship(back_populates="recommendations")


class ColorPaletteModel(Base):
    __tablename__ = "color_palettes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"))
    color_name: Mapped[str] = mapped_column(String(50))
    hex_value: Mapped[str] = mapped_column(String(10))
    category: Mapped[str] = mapped_column(String(10), default="best")
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    session: Mapped["SessionModel"] = relationship(back_populates="color_palettes")
