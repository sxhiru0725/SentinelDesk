from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.workspace import Workspace
from app.models.vulnerability import Vulnerability
from app.schemas.ai import AIAnalysisRequest, AIAnalysisResponse, AIChatRequest, AIChatResponse
from app.services.ai_service import ai_service
from app.core.deps import get_current_workspace

router = APIRouter()


@router.post("/analyze", response_model=AIAnalysisResponse)
def analyze_vulnerability_endpoint(
    body: AIAnalysisRequest,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    vuln = (
        db.query(Vulnerability)
        .filter(
            Vulnerability.id == body.vulnerability_id,
            Vulnerability.workspace_id == workspace.id
        )
        .first()
    )
    if not vuln:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vulnerability not found in workspace"
        )

    analysis_data = ai_service.analyze_vulnerability(
        title=vuln.title,
        description=vuln.description,
        severity=vuln.severity,
        cve_id=vuln.cve_id,
        cwe_id=vuln.cwe_id
    )

    return AIAnalysisResponse(
        vulnerability_id=vuln.id,
        summary=analysis_data["summary"],
        impact_explanation=analysis_data["impact_explanation"],
        remediation_guidance=analysis_data["remediation_guidance"],
        verification_steps=analysis_data["verification_steps"],
        is_ai_available=analysis_data["is_ai_available"],
        provider=analysis_data["provider"]
    )


@router.post("/chat", response_model=AIChatResponse)
def chat_assistant_endpoint(
    body: AIChatRequest,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    context_str = f"Workspace: {workspace.name}\n"
    if body.context_vulnerability_id:
        v = db.query(Vulnerability).filter(Vulnerability.id == body.context_vulnerability_id, Vulnerability.workspace_id == workspace.id).first()
        if v:
            context_str += f"Target Vulnerability: '{v.title}' (Severity: {v.severity}, Status: {v.status}, CVE: {v.cve_id or 'None'})\nDescription: {v.description}\n"

    # Summarize top open critical vulnerabilities for context
    top_vulns = (
        db.query(Vulnerability)
        .filter(Vulnerability.workspace_id == workspace.id, Vulnerability.status.notin_(["CLOSED", "ACCEPTED_RISK"]))
        .order_by(Vulnerability.cvss_score.desc().nullslast())
        .limit(5)
        .all()
    )
    context_str += "Top Active Vulnerabilities in Workspace:\n"
    for tv in top_vulns:
        context_str += f"- [{tv.severity}] {tv.title} (Status: {tv.status}, Component: {tv.affected_component or 'N/A'})\n"

    result = ai_service.chat_query(prompt=body.prompt, context=context_str)

    return AIChatResponse(
        reply=result["reply"],
        is_ai_available=result["is_ai_available"],
        provider=result["provider"]
    )
