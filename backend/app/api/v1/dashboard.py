from typing import Dict, Any, List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.workspace import Workspace
from app.models.application import Application
from app.models.vulnerability import Vulnerability, VulnerabilityActivity
from app.models.incident import Incident
from app.api.v1.applications import calculate_app_risk_score
from app.core.deps import get_current_workspace

router = APIRouter()


@router.get("/summary", response_model=Dict[str, Any])
def get_dashboard_summary(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    open_vulns = (
        db.query(Vulnerability)
        .filter(
            Vulnerability.workspace_id == workspace.id,
            Vulnerability.status.notin_(["CLOSED", "ACCEPTED_RISK", "VERIFIED"])
        )
        .all()
    )

    critical_count = sum(1 for v in open_vulns if v.severity == "CRITICAL")
    high_count = sum(1 for v in open_vulns if v.severity == "HIGH")
    medium_count = sum(1 for v in open_vulns if v.severity == "MEDIUM")
    low_count = sum(1 for v in open_vulns if v.severity == "LOW")

    open_incidents_count = (
        db.query(Incident)
        .filter(
            Incident.workspace_id == workspace.id,
            Incident.status.notin_(["RESOLVED", "CLOSED"])
        )
        .count()
    )

    apps_count = db.query(Application).filter(Application.workspace_id == workspace.id).count()

    now = datetime.now(timezone.utc)
    overdue_count = sum(
        1 for v in open_vulns if v.due_date and v.due_date.tzinfo is not None and v.due_date < now
    )

    # Documented overall risk score formula:
    # (10 * CRITICAL + 5 * HIGH + 2 * MEDIUM + 0.5 * LOW) + 15 * OPEN_INCIDENTS
    overall_risk_score = round(
        (10 * critical_count + 5 * high_count + 2 * medium_count + 0.5 * low_count) + (15 * open_incidents_count),
        1
    )

    return {
        "critical_vulnerabilities": critical_count,
        "high_vulnerabilities": high_count,
        "open_vulnerabilities": len(open_vulns),
        "open_incidents": open_incidents_count,
        "overdue_remediation": overdue_count,
        "applications_monitored": apps_count,
        "overall_risk_score": overall_risk_score
    }


@router.get("/charts", response_model=Dict[str, Any])
def get_dashboard_charts(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    # 1. Severity distribution
    sev_counts = (
        db.query(Vulnerability.severity, func.count(Vulnerability.id))
        .filter(Vulnerability.workspace_id == workspace.id)
        .group_by(Vulnerability.severity)
        .all()
    )
    severity_breakdown = [
        {"severity": sev, "count": cnt} for sev, cnt in sev_counts
    ]

    # 2. Status distribution
    status_counts = (
        db.query(Vulnerability.status, func.count(Vulnerability.id))
        .filter(Vulnerability.workspace_id == workspace.id)
        .group_by(Vulnerability.status)
        .all()
    )
    status_breakdown = [
        {"status": stat, "count": cnt} for stat, cnt in status_counts
    ]

    # 3. Application risk ranking
    apps = db.query(Application).filter(Application.workspace_id == workspace.id).all()
    app_risk_ranking = []
    for app in apps:
        risk = calculate_app_risk_score(db, app.id)
        app_risk_ranking.append({
            "id": app.id,
            "name": app.name,
            "business_criticality": app.business_criticality,
            "risk_score": risk
        })
    app_risk_ranking.sort(key=lambda x: x["risk_score"], reverse=True)

    return {
        "severity_breakdown": severity_breakdown,
        "status_breakdown": status_breakdown,
        "app_risk_ranking": app_risk_ranking[:10]
    }


@router.get("/activity", response_model=List[Dict[str, Any]])
def get_dashboard_recent_activity(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    activities = (
        db.query(VulnerabilityActivity)
        .join(Vulnerability)
        .filter(Vulnerability.workspace_id == workspace.id)
        .order_by(VulnerabilityActivity.created_at.desc())
        .limit(20)
        .all()
    )

    feed = []
    for act in activities:
        feed.append({
            "id": act.id,
            "vulnerability_id": act.vulnerability_id,
            "vulnerability_title": act.vulnerability.title if act.vulnerability else "",
            "actor_name": act.actor.name if act.actor else "System",
            "event_type": act.event_type,
            "old_value": act.old_value,
            "new_value": act.new_value,
            "created_at": act.created_at
        })

    return feed
