from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.incident import Incident
from app.schemas.incident import IncidentCreate, IncidentUpdate, IncidentResponse
from app.core.deps import get_current_user, get_current_workspace, check_role
from app.services.audit_service import log_audit_event

router = APIRouter()


@router.get("", response_model=List[IncidentResponse])
def list_incidents(
    search: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status_param: Optional[str] = Query(None, alias="status"),
    incident_type: Optional[str] = Query(None),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    query = db.query(Incident).filter(Incident.workspace_id == workspace.id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Incident.title.ilike(s)) | (Incident.description.ilike(s))
        )
    if severity:
        query = query.filter(Incident.severity == severity.upper())
    if status_param:
        query = query.filter(Incident.status == status_param.upper())
    if incident_type:
        query = query.filter(Incident.incident_type == incident_type.upper())

    incidents = query.order_by(Incident.created_at.desc()).all()
    return incidents


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_data: IncidentCreate,
    request: Request,
    current_user: User = Depends(check_role(["ADMIN", "SECURITY_ANALYST"])),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    new_incident = Incident(
        workspace_id=workspace.id,
        title=incident_data.title.strip(),
        description=incident_data.description.strip(),
        severity=incident_data.severity.upper(),
        status=incident_data.status.upper(),
        incident_type=incident_data.incident_type.upper(),
        owner_id=incident_data.owner_id or current_user.id,
        detected_at=incident_data.detected_at or datetime.now(timezone.utc)
    )
    db.add(new_incident)
    db.commit()
    db.refresh(new_incident)

    log_audit_event(
        db=db,
        action="INCIDENT_CREATE",
        resource_type="incident",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(new_incident.id),
        metadata_json={"title": new_incident.title, "severity": new_incident.severity},
        request=request
    )

    return new_incident


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id,
            Incident.workspace_id == workspace.id
        )
        .first()
    )
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    return incident


@router.put("/{incident_id}", response_model=IncidentResponse)
def update_incident(
    incident_id: int,
    incident_data: IncidentUpdate,
    request: Request,
    current_user: User = Depends(check_role(["ADMIN", "SECURITY_ANALYST"])),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id,
            Incident.workspace_id == workspace.id
        )
        .first()
    )
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )

    old_status = incident.status
    for field, val in incident_data.model_dump(exclude_unset=True).items():
        if val is not None:
            if field in ["severity", "status", "incident_type"]:
                setattr(incident, field, val.upper())
            else:
                setattr(incident, field, val)

    if incident.status in ["RESOLVED", "CLOSED"] and old_status not in ["RESOLVED", "CLOSED"]:
        incident.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(incident)

    log_audit_event(
        db=db,
        action="INCIDENT_UPDATE",
        resource_type="incident",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(incident.id),
        request=request
    )

    return incident


@router.delete("/{incident_id}")
def delete_incident(
    incident_id: int,
    request: Request,
    current_user: User = Depends(check_role(["ADMIN"])),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    incident = (
        db.query(Incident)
        .filter(
            Incident.id == incident_id,
            Incident.workspace_id == workspace.id
        )
        .first()
    )
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )

    db.delete(incident)
    db.commit()

    log_audit_event(
        db=db,
        action="INCIDENT_DELETE",
        resource_type="incident",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(incident_id),
        request=request
    )

    return {"message": "Incident deleted successfully"}
