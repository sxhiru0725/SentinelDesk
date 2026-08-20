from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl
from app.schemas.user import UserResponse


class ApplicationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    repository_url: Optional[str] = None
    production_url: Optional[str] = None
    technology_stack: Optional[str] = None
    business_criticality: str = Field("MEDIUM", pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    owner_id: Optional[int] = None


class ApplicationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    repository_url: Optional[str] = None
    production_url: Optional[str] = None
    technology_stack: Optional[str] = None
    business_criticality: Optional[str] = Field(None, pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    owner_id: Optional[int] = None


class ApplicationResponse(BaseModel):
    id: int
    workspace_id: int
    name: str
    description: Optional[str] = None
    repository_url: Optional[str] = None
    production_url: Optional[str] = None
    technology_stack: Optional[str] = None
    business_criticality: str
    risk_score: float
    owner_id: Optional[int] = None
    owner: Optional[UserResponse] = None
    open_vulnerabilities_count: Optional[int] = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
