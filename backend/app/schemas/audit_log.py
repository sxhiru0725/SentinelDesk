from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel
from app.schemas.user import UserResponse


class AuditLogResponse(BaseModel):
    id: int
    workspace_id: Optional[int] = None
    actor_id: Optional[int] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    metadata_json: Optional[dict[str, Any]] = None
    created_at: datetime
    actor: Optional[UserResponse] = None

    model_config = {"from_attributes": True}
