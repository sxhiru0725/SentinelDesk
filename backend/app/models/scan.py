from datetime import datetime
from typing import Optional, Any
from sqlalchemy import String, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class ScanImport(Base):
    __tablename__ = "scan_imports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    workspace_id: Mapped[int] = mapped_column(Integer, ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    scanner_type: Mapped[str] = mapped_column(String(50), nullable=False)  # NPM_AUDIT, TRIVY, OWASP_ZAP, etc.
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    total_findings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    imported_findings: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="COMPLETED", nullable=False)
    raw_summary_json: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON, nullable=True)
    imported_by_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    workspace: Mapped["Workspace"] = relationship("Workspace")
    imported_by: Mapped["User"] = relationship("User")
