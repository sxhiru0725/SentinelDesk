from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.application import Application
from app.models.vulnerability import Vulnerability, Comment, VulnerabilityActivity
from app.schemas.vulnerability import (
    VulnerabilityCreate, VulnerabilityUpdate, VulnerabilityResponse,
    CommentCreate, CommentResponse, ActivityResponse
)
from app.core.deps import get_current_user, get_current_workspace, check_role
from app.services.audit_service import log_audit_event
from app.services.notification_service import create_notification

router = APIRouter()


@router.get("", response_model=List[VulnerabilityResponse])
def list_vulnerabilities(
    search: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status_param: Optional[str] = Query(None, alias="status"),
    application_id: Optional[int] = Query(None),
    assigned_to_id: Optional[int] = Query(None),
    source: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    query = db.query(Vulnerability).filter(Vulnerability.workspace_id == workspace.id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Vulnerability.title.ilike(s)) |
            (Vulnerability.description.ilike(s)) |
            (Vulnerability.cve_id.ilike(s)) |
            (Vulnerability.cwe_id.ilike(s)) |
            (Vulnerability.affected_component.ilike(s))
        )
    if severity:
        query = query.filter(Vulnerability.severity == severity.upper())
    if status_param:
        query = query.filter(Vulnerability.status == status_param.upper())
    if application_id:
        query = query.filter(Vulnerability.application_id == application_id)
    if assigned_to_id:
        query = query.filter(Vulnerability.assigned_to_id == assigned_to_id)
    if source:
        query = query.filter(Vulnerability.source == source.upper())

    vulns = query.order_by(Vulnerability.created_at.desc()).offset(skip).limit(limit).all()

    res = []
    for v in vulns:
        vr = VulnerabilityResponse.model_validate(v)
        vr.application_name = v.application.name if v.application else None
        res.append(vr)

    return res


@router.post("", response_model=VulnerabilityResponse, status_code=status.HTTP_201_CREATED)
def create_vulnerability(
    vuln_data: VulnerabilityCreate,
    request: Request,
    current_user: User = Depends(check_role(["ADMIN", "SECURITY_ANALYST"])),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    # Verify application belongs to workspace
    app = (
        db.query(Application)
        .filter(
            Application.id == vuln_data.application_id,
            Application.workspace_id == workspace.id
        )
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found in workspace"
        )

    new_vuln = Vulnerability(
        workspace_id=workspace.id,
        application_id=vuln_data.application_id,
        title=vuln_data.title.strip(),
        description=vuln_data.description.strip(),
        severity=vuln_data.severity.upper(),
        status=vuln_data.status.upper(),
        cvss_score=vuln_data.cvss_score,
        cve_id=vuln_data.cve_id.strip() if vuln_data.cve_id else None,
        cwe_id=vuln_data.cwe_id.strip() if vuln_data.cwe_id else None,
        source=vuln_data.source.upper(),
        affected_component=vuln_data.affected_component,
        affected_version=vuln_data.affected_version,
        location=vuln_data.location,
        remediation=vuln_data.remediation,
        assigned_to_id=vuln_data.assigned_to_id,
        reported_by_id=current_user.id,
        due_date=vuln_data.due_date
    )
    db.add(new_vuln)
    db.commit()
    db.refresh(new_vuln)

    # Activity log
    activity = VulnerabilityActivity(
        vulnerability_id=new_vuln.id,
        actor_id=current_user.id,
        event_type="VULNERABILITY_CREATED",
        new_value=new_vuln.title,
        metadata_json={"severity": new_vuln.severity, "status": new_vuln.status}
    )
    db.add(activity)
    db.commit()

    # Audit log
    log_audit_event(
        db=db,
        action="VULNERABILITY_CREATE",
        resource_type="vulnerability",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(new_vuln.id),
        metadata_json={"title": new_vuln.title, "severity": new_vuln.severity},
        request=request
    )

    # Notification if assigned
    if new_vuln.assigned_to_id:
        create_notification(
            db=db,
            workspace_id=workspace.id,
            user_id=new_vuln.assigned_to_id,
            title="Vulnerability Assigned",
            message=f"You have been assigned to vulnerability: '{new_vuln.title}'",
            link=f"/app/vulnerabilities/{new_vuln.id}"
        )

    vr = VulnerabilityResponse.model_validate(new_vuln)
    vr.application_name = app.name
    return vr


@router.get("/{vuln_id}", response_model=VulnerabilityResponse)
def get_vulnerability(
    vuln_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    vuln = (
        db.query(Vulnerability)
        .filter(
            Vulnerability.id == vuln_id,
            Vulnerability.workspace_id == workspace.id
        )
        .first()
    )
    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vulnerability not found"
        )

    vr = VulnerabilityResponse.model_validate(vuln)
    vr.application_name = vuln.application.name if vuln.application else None
    return vr


@router.put("/{vuln_id}", response_model=VulnerabilityResponse)
def update_vulnerability(
    vuln_id: int,
    vuln_data: VulnerabilityUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    vuln = (
        db.query(Vulnerability)
        .filter(
            Vulnerability.id == vuln_id,
            Vulnerability.workspace_id == workspace.id
        )
        .first()
    )
    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vulnerability not found"
        )

    old_status = vuln.status
    old_severity = vuln.severity
    old_assignee = vuln.assigned_to_id

    for field, val in vuln_data.model_dump(exclude_unset=True).items():
        if val is not None:
            if field in ["severity", "status"]:
                setattr(vuln, field, val.upper())
            else:
                setattr(vuln, field, val)

    if vuln.status in ["CLOSED", "VERIFIED"] and old_status not in ["CLOSED", "VERIFIED"]:
        vuln.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(vuln)

    # Log status change activity
    if vuln.status != old_status:
        db.add(VulnerabilityActivity(
            vulnerability_id=vuln.id,
            actor_id=current_user.id,
            event_type="STATUS_CHANGED",
            old_value=old_status,
            new_value=vuln.status
        ))

    # Log severity change activity
    if vuln.severity != old_severity:
        db.add(VulnerabilityActivity(
            vulnerability_id=vuln.id,
            actor_id=current_user.id,
            event_type="SEVERITY_CHANGED",
            old_value=old_severity,
            new_value=vuln.severity
        ))

    # Log assignment change activity
    if vuln.assigned_to_id != old_assignee:
        db.add(VulnerabilityActivity(
            vulnerability_id=vuln.id,
            actor_id=current_user.id,
            event_type="ASSIGNEE_CHANGED",
            old_value=str(old_assignee) if old_assignee else "Unassigned",
            new_value=str(vuln.assigned_to_id) if vuln.assigned_to_id else "Unassigned"
        ))
        if vuln.assigned_to_id:
            create_notification(
                db=db,
                workspace_id=workspace.id,
                user_id=vuln.assigned_to_id,
                title="Vulnerability Assigned",
                message=f"You were assigned to: '{vuln.title}'",
                link=f"/app/vulnerabilities/{vuln.id}"
            )

    db.commit()

    log_audit_event(
        db=db,
        action="VULNERABILITY_UPDATE",
        resource_type="vulnerability",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(vuln.id),
        request=request
    )

    vr = VulnerabilityResponse.model_validate(vuln)
    vr.application_name = vuln.application.name if vuln.application else None
    return vr


@router.delete("/{vuln_id}")
def delete_vulnerability(
    vuln_id: int,
    request: Request,
    current_user: User = Depends(check_role(["ADMIN", "SECURITY_ANALYST"])),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    vuln = (
        db.query(Vulnerability)
        .filter(
            Vulnerability.id == vuln_id,
            Vulnerability.workspace_id == workspace.id
        )
        .first()
    )
    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vulnerability not found"
        )

    db.delete(vuln)
    db.commit()

    log_audit_event(
        db=db,
        action="VULNERABILITY_DELETE",
        resource_type="vulnerability",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(vuln_id),
        request=request
    )

    return {"message": "Vulnerability deleted successfully"}


@router.get("/{vuln_id}/comments", response_model=List[CommentResponse])
def get_vulnerability_comments(
    vuln_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    comments = (
        db.query(Comment)
        .join(Vulnerability)
        .filter(
            Comment.vulnerability_id == vuln_id,
            Vulnerability.workspace_id == workspace.id
        )
        .order_by(Comment.created_at.asc())
        .all()
    )
    return comments


@router.post("/{vuln_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_vulnerability_comment(
    vuln_id: int,
    comment_data: CommentCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    vuln = (
        db.query(Vulnerability)
        .filter(
            Vulnerability.id == vuln_id,
            Vulnerability.workspace_id == workspace.id
        )
        .first()
    )
    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vulnerability not found"
        )

    comment = Comment(
        vulnerability_id=vuln.id,
        author_id=current_user.id,
        content=comment_data.content.strip()
    )
    db.add(comment)
    db.commit()

    db.add(VulnerabilityActivity(
        vulnerability_id=vuln.id,
        actor_id=current_user.id,
        event_type="COMMENT_ADDED",
        new_value=comment_data.content[:100]
    ))
    db.commit()
    db.refresh(comment)

    log_audit_event(
        db=db,
        action="COMMENT_CREATE",
        resource_type="comment",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(comment.id),
        request=request
    )

    return comment


@router.get("/{vuln_id}/activities", response_model=List[ActivityResponse])
def get_vulnerability_activities(
    vuln_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    activities = (
        db.query(VulnerabilityActivity)
        .join(Vulnerability)
        .filter(
            VulnerabilityActivity.vulnerability_id == vuln_id,
            Vulnerability.workspace_id == workspace.id
        )
        .order_by(VulnerabilityActivity.created_at.desc())
        .all()
    )
    return activities
