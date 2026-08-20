import json
from typing import List
from app.schemas.scan import ScanFindingPreview


def parse_zap(content_str: str) -> List[ScanFindingPreview]:
    try:
        data = json.loads(content_str)
    except Exception as e:
        raise ValueError(f"Invalid JSON format for OWASP ZAP report: {str(e)}")

    findings: List[ScanFindingPreview] = []
    
    # ZAP reports often have a site array containing alerts
    sites = data.get("site", [])
    if isinstance(sites, dict):
        sites = [sites]
    
    alerts_list = []
    if isinstance(sites, list):
        for site in sites:
            if isinstance(site, dict):
                site_alerts = site.get("alerts", [])
                if isinstance(site_alerts, list):
                    alerts_list.extend(site_alerts)

    # Fallback: top-level alerts list
    if not alerts_list and isinstance(data.get("alerts"), list):
        alerts_list = data.get("alerts")

    for alert in alerts_list:
        if not isinstance(alert, dict):
            continue
        
        title = f"OWASP ZAP Alert: {alert.get('alert', alert.get('name', 'Security Alert'))}"
        risk_raw = str(alert.get("riskdesc", alert.get("riskcode", "Medium"))).lower()
        
        if "high" in risk_raw or "3" in risk_raw:
            severity = "HIGH"
        elif "critical" in risk_raw or "4" in risk_raw:
            severity = "CRITICAL"
        elif "low" in risk_raw or "1" in risk_raw:
            severity = "LOW"
        else:
            severity = "MEDIUM"

        desc = alert.get("desc", alert.get("description", "OWASP ZAP web application security alert."))
        solution = alert.get("solution", "Review web application configuration and fix vulnerability.")
        cwe_id = f"CWE-{alert.get('cweid')}" if alert.get("cweid") else "CWE-200"

        findings.append(ScanFindingPreview(
            title=title,
            description=str(desc),
            severity=severity,
            cvss_score=7.0 if severity == "HIGH" else (4.5 if severity == "MEDIUM" else 2.5),
            cve_id=None,
            cwe_id=cwe_id,
            affected_component=str(alert.get("url", alert.get("site", "Web Application"))),
            affected_version="N/A",
            remediation=str(solution)
        ))

    return findings
