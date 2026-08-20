from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.application import Application
from app.models.vulnerability import Vulnerability, VulnerabilityActivity
from app.models.scan import ScanImport
from app.schemas.scan import ScanPreviewResponse, ScanFindingPreview, ScanConfirmRequest, ScanImportResponse
from app.parsers.npm_audit import parse_npm_audit
from app.parsers.trivy import parse_trivy
from app.parsers.zap import parse_zap
from app.core.deps import get_current_user, get_current_workspace, check_role
from app.services.audit_service import log_audit_event

router = APIRouter()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit


@router.post("/preview", response_model=ScanPreviewResponse)
async def preview_scan_report(
    scanner_type: str = Form(...),
    file: UploadFile = File(...),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    scanner_type = scanner_type.upper().strip()
    if scanner_type not in ["NPM_AUDIT", "TRIVY", "OWASP_ZAP"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported scanner type. Supported: NPM_AUDIT, TRIVY, OWASP_ZAP"
        )

    content_bytes = await file.read()
    if len(content_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10 MB limit"
        )

    try:
        content_str = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be UTF-8 encoded text/JSON"
        )

    # Parse by scanner type
    if scanner_type == "NPM_AUDIT":
        parsed_findings = parse_npm_audit(content_str)
    elif scanner_type == "TRIVY":
        parsed_findings = parse_trivy(content_str)
    elif scanner_type == "OWASP_ZAP":
        parsed_findings = parse_zap(content_str)
    else:
        parsed_findings = []

    if not parsed_findings:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid vulnerability findings discovered in report"
        )

    # Deduplication check against existing workspace vulnerabilities
    existing_cves = set(
        res[0] for res in db.query(Vulnerability.cve_id)
        .filter(Vulnerability.workspace_id == workspace.id, Vulnerability.cve_id.isnot(None))
        .all()
    )
    existing_titles = set(
        res[0] for res in db.query(Vulnerability.title)
        .filter(Vulnerability.workspace_id == workspace.id)
        .all()
    )

    new_count = 0
    dup_count = 0
    for finding in parsed_findings:
        is_dup = False
        if finding.cve_id and finding.cve_id in existing_cves:
            is_dup = True
        elif finding.title in existing_titles:
            is_dup = True

        finding.is_duplicate = is_dup
        if is_dup:
            dup_count += 1
        else:
            new_count += 1

    return ScanPreviewResponse(
        scanner_type=scanner_type,
        filename=file.filename or "report.json",
        total_findings=len(parsed_findings),
        new_findings_count=new_count,
        duplicates_count=dup_count,
        findings=parsed_findings
    )


@router.post("/confirm", response_model=ScanImportResponse)
def confirm_scan_import(
    confirm_data: ScanConfirmRequest,
    request: Request,
    current_user: User = Depends(check_role(["ADMIN", "SECURITY_ANALYST"])),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    app = (
        db.query(Application)
        .filter(
            Application.id == confirm_data.application_id,
            Application.workspace_id == workspace.id
        )
        .first()
    )
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found in workspace"
        )

    imported_count = 0
    for finding in confirm_data.findings:
        if finding.is_duplicate:
            continue

        new_vuln = Vulnerability(
            workspace_id=workspace.id,
            application_id=app.id,
            title=finding.title[:255],
            description=finding.description,
            severity=finding.severity.upper(),
            status="OPEN",
            cvss_score=finding.cvss_score,
            cve_id=finding.cve_id,
            cwe_id=finding.cwe_id,
            source=confirm_data.scanner_type.upper(),
            affected_component=finding.affected_component,
            affected_version=finding.affected_version,
            remediation=finding.remediation,
            reported_by_id=current_user.id
        )
        db.add(new_vuln)
        db.commit()
        db.refresh(new_vuln)

        db.add(VulnerabilityActivity(
            vulnerability_id=new_vuln.id,
            actor_id=current_user.id,
            event_type="SCAN_IMPORTED",
            new_value=f"Imported from {confirm_data.scanner_type}"
        ))
        imported_count += 1

    db.commit()

    scan_import = ScanImport(
        workspace_id=workspace.id,
        scanner_type=confirm_data.scanner_type,
        filename=confirm_data.filename,
        total_findings=len(confirm_data.findings),
        imported_findings=imported_count,
        status="COMPLETED",
        raw_summary_json={"new": imported_count, "duplicates": len(confirm_data.findings) - imported_count},
        imported_by_id=current_user.id
    )
    db.add(scan_import)
    db.commit()
    db.refresh(scan_import)

    log_audit_event(
        db=db,
        action="SCAN_IMPORT",
        resource_type="scan_import",
        workspace_id=workspace.id,
        actor_id=current_user.id,
        resource_id=str(scan_import.id),
        metadata_json={"scanner": confirm_data.scanner_type, "imported": imported_count},
        request=request
    )

    return scan_import


@router.get("/history", response_model=List[ScanImportResponse])
def get_scan_history(
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    scans = (
        db.query(ScanImport)
        .filter(ScanImport.workspace_id == workspace.id)
        .order_by(ScanImport.created_at.desc())
        .all()
    )
    return scans
