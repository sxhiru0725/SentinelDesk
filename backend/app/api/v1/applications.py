from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.application import Application
from app.models.vulnerability import Vulnerability
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse
from app.core.deps import get_current_user, get_current_workspace, check_role
from app.services.audit_service import log_audit_event

router = APIRouter()


def calculate_app_risk_score(db: Session, app_id: int) -> float:
    """
    Risk score formula:
    Sum of weights for active (non-closed/accepted) vulnerabilities:
    CRITICAL: 10, HIGH: 5, MEDIUM: 2, LOW: 0.5
    """
    vulns = (
        db.query(Vulnerability)
        .filter(
            Vulnerability.application_id == app_id,
            Vulnerability.status.notin_(["CLOSED", "ACCEPTED_RISK", "VERIFIED"])
        )
        .all()
    )
    score = 0.0
    weights = {"CRITICAL": 10.0, "HIGH": 5.0, "MEDIUM": 2.0, "LOW": 0.5}
    for v in vulns:
        score += weights.get(v.severity.upper(), 1.0)
    return round(score, 1)


@router.get("", response_model=List[ApplicationResponse])
def list_applications(
    search: Optional[str] = Query(None),
    criticality: Optional[str] = Query(None),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    query = db.query(Application).filter(Application.workspace_id == workspace.id)

    if search:
        query = query.filter(Application.name.ilike(f"%{search.strip()}%"))
    if criticality:
        query = query.filter(Application.business_criticality == criticality.upper())

    apps = query.order_by(Application.created_at.desc()).all()

    res = []
    for app in apps:
        app_resp = ApplicationResponse.model_validate(app)
        open_count = (
            db.query(Vulnerability)
            .filter(
                Vulnerability.application_id == app.id,
                Vulnerability.status.notin_(["CLOSED", "ACCEPTED_RISK"])
            )
            .count()
        )
        app_resp.open_vulnerabilities_count = open_count
        app_resp.risk_score = calculate_app_risk_score(db, app.id)
        res.append(app_resp)

    return res


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    app_data: ApplicationCreate,
    request: Request,
    current_user: User = Depends(check_role(["ADMIN", "SECURITY_ANALYST"])),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    new_app = Application(
        workspace_id=workspace.id,
        name=app_data.name.strip(),
        description=app_data.description,
        repository_url=app_data.repository_url,
        production_url=app_data.production_url,
        technology_stack=app_data.technology_stack,
        business_criticality=app_data.business_criticality.upper(),
        owner_id=app_data.owner_id or current_user.id
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    log_audit_event(
        db=db,
        action="APPLICATION_CREATE",
        resource_type="application",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(new_app.id),
        metadata_json={"name": new_app.name},
        request=request
    )

    app_resp = ApplicationResponse.model_validate(new_app)
    app_resp.open_vulnerabilities_count = 0
    app_resp.risk_score = 0.0
    return app_resp


@router.get("/{app_id}", response_model=ApplicationResponse)
def get_application(
    app_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    app = (
        db.query(Application)
        .filter(
            Application.id == app_id,
            Application.workspace_id == workspace.id
        )
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    app_resp = ApplicationResponse.model_validate(app)
    open_count = (
        db.query(Vulnerability)
        .filter(
            Vulnerability.application_id == app.id,
            Vulnerability.status.notin_(["CLOSED", "ACCEPTED_RISK"])
        )
        .count()
    )
    app_resp.open_vulnerabilities_count = open_count
    app_resp.risk_score = calculate_app_risk_score(db, app.id)
    return app_resp


@router.put("/{app_id}", response_model=ApplicationResponse)
def update_application(
    app_id: int,
    app_data: ApplicationUpdate,
    request: Request,
    current_user: User = Depends(check_role(["ADMIN", "SECURITY_ANALYST"])),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    app = (
        db.query(Application)
        .filter(
            Application.id == app_id,
            Application.workspace_id == workspace.id
        )
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    for field, val in app_data.model_dump(exclude_unset=True).items():
        if field == "business_criticality" and val:
            setattr(app, field, val.upper())
        elif val is not None:
            setattr(app, field, val)

    db.commit()
    db.refresh(app)

    log_audit_event(
        db=db,
        action="APPLICATION_UPDATE",
        resource_type="application",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(app.id),
        request=request
    )

    app_resp = ApplicationResponse.model_validate(app)
    app_resp.risk_score = calculate_app_risk_score(db, app.id)
    return app_resp


@router.delete("/{app_id}")
def delete_application(
    app_id: int,
    request: Request,
    current_user: User = Depends(check_role(["ADMIN"])),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    app = (
        db.query(Application)
        .filter(
            Application.id == app_id,
            Application.workspace_id == workspace.id
        )
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )

    db.delete(app)
    db.commit()

    log_audit_event(
        db=db,
        action="APPLICATION_DELETE",
        resource_type="application",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(app_id),
        request=request
    )

    return {"message": "Application deleted successfully"}
