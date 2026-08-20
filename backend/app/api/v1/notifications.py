from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.core.deps import get_current_user, get_current_workspace

router = APIRouter()


@router.get("", response_model=List[NotificationResponse])
def list_notifications(
    current_user: User = Depends(get_current_user),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    notifications = (
        db.query(Notification)
        .filter(
            Notification.workspace_id == workspace.id,
            Notification.user_id == current_user.id
        )
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return notifications


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.workspace_id == workspace.id,
            Notification.user_id == current_user.id
        )
        .first()
    )
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    notif.read = True
    db.commit()
    db.refresh(notif)
    return notif


@router.put("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.workspace_id == workspace.id,
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
