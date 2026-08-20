from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    workspace_id: int
    user_id: int
    title: str
    message: str
    link: Optional[str] = None
    read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
