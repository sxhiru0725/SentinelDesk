from typing import Optional, Any
from sqlalchemy.orm import Session
from fastapi import Request

from app.models.audit_log import AuditLog


def log_audit_event(
    db: Session,
    action: str,
    resource_type: str,
    workspace_id: Optional[int] = None,
    actor_id: Optional[int] = None,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    metadata_json: Optional[dict[str, Any]] = None,
    request: Optional[Request] = None
) -> AuditLog:
    if request and not ip_address:
        ip_address = request.client.host if request.client else None

    audit_log = AuditLog(
        workspace_id=workspace_id,
        actor_id=actor_id,
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id) if resource_id is not None else None,
        ip_address=ip_address,
        metadata_json=metadata_json
    )
    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)
    return audit_log
