from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse


class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)


class WorkspaceMemberResponse(BaseModel):
    id: int
    workspace_id: int
    user_id: int
    role: str
    joined_at: datetime
    user: UserResponse

    model_config = {"from_attributes": True}


class WorkspaceResponse(BaseModel):
    id: int
    name: str
    slug: str
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class WorkspaceMemberRoleUpdate(BaseModel):
    role: str = Field(..., pattern="^(ADMIN|SECURITY_ANALYST|DEVELOPER|VIEWER)$")
