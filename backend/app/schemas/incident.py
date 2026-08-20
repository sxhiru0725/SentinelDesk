from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse


class IncidentCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    severity: str = Field(..., pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    status: str = Field("OPEN", pattern="^(OPEN|INVESTIGATING|CONTAINED|RESOLVED|CLOSED)$")
    incident_type: str = Field(..., pattern="^(UNAUTHORIZED_ACCESS|MALWARE|DATA_EXPOSURE|PHISHING|SERVICE_DISRUPTION|SUSPICIOUS_ACTIVITY|OTHER)$")
    owner_id: Optional[int] = None
    detected_at: Optional[datetime] = None


class IncidentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    severity: Optional[str] = Field(None, pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    status: Optional[str] = Field(None, pattern="^(OPEN|INVESTIGATING|CONTAINED|RESOLVED|CLOSED)$")
    incident_type: Optional[str] = Field(None, pattern="^(UNAUTHORIZED_ACCESS|MALWARE|DATA_EXPOSURE|PHISHING|SERVICE_DISRUPTION|SUSPICIOUS_ACTIVITY|OTHER)$")
    owner_id: Optional[int] = None
    resolved_at: Optional[datetime] = None


class IncidentResponse(BaseModel):
    id: int
    workspace_id: int
    title: str
    description: str
    severity: str
    status: str
    incident_type: str
    owner_id: Optional[int] = None
    owner: Optional[UserResponse] = None
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
