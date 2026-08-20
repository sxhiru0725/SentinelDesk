from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel
from app.schemas.user import UserResponse


class ScanFindingPreview(BaseModel):
    title: str
    description: str
    severity: str
    cvss_score: Optional[float] = None
    cve_id: Optional[str] = None
    cwe_id: Optional[str] = None
    affected_component: Optional[str] = None
    affected_version: Optional[str] = None
    remediation: Optional[str] = None
    is_duplicate: bool = False


class ScanPreviewResponse(BaseModel):
    scanner_type: str
    filename: str
    total_findings: int
    new_findings_count: int
    duplicates_count: int
    findings: List[ScanFindingPreview]


class ScanConfirmRequest(BaseModel):
    application_id: int
    scanner_type: str
    filename: str
    findings: List[ScanFindingPreview]


class ScanImportResponse(BaseModel):
    id: int
    workspace_id: int
    scanner_type: str
    filename: str
    total_findings: int
    imported_findings: int
    status: str
    imported_by_id: int
    imported_by: Optional[UserResponse] = None
    created_at: datetime

    model_config = {"from_attributes": True}
