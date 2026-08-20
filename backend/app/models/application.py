from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Text, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    repository_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    production_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    technology_stack: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    business_criticality: Mapped[str] = mapped_column(String(50), default="MEDIUM", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    risk_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    owner_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="applications")
    owner: Mapped[Optional["User"]] = relationship("User")
    vulnerabilities: Mapped[List["Vulnerability"]] = relationship("Vulnerability", back_populates="application", cascade="all, delete-orphan")
