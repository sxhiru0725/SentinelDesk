from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification


def create_notification(
    db: Session,
    workspace_id: int,
    user_id: int,
    title: str,
    message: str,
    link: Optional[str] = None
) -> Notification:
    notification = Notification(
        workspace_id=workspace_id,
        user_id=user_id,
        title=title,
        message=message,
        link=link,
        read=False
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
