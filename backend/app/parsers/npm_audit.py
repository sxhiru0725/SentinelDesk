import json
from typing import Any, List
from app.schemas.scan import ScanFindingPreview


def parse_npm_audit(content_str: str) -> List[ScanFindingPreview]:
    try:
        data = json.loads(content_str)
    except Exception as e:
        raise ValueError(f"Invalid JSON format for npm audit report: {str(e)}")

    findings: List[ScanFindingPreview] = []
    
    # Format 1: npm v7+ (vulnerabilities dictionary)
    vulnerabilities = data.get("vulnerabilities", {})
    if isinstance(vulnerabilities, dict):
        for pkg_name, info in vulnerabilities.items():
            if not isinstance(info, dict):
                continue
            
            sev_raw = str(info.get("severity", "LOW")).upper()
            severity = sev_raw if sev_raw in ["LOW", "MEDIUM", "HIGH", "CRITICAL"] else "MEDIUM"
            
            title = f"NPM Dependency Vulnerability: {pkg_name}"
            via = info.get("via", [])
            via_desc = []
            cve_id = None
            cwe_id = None

            if isinstance(via, list):
                for v in via:
                    if isinstance(v, dict):
                        if v.get("title"):
                            via_desc.append(v.get("title"))
                        if v.get("cve"):
                            cve_id = str(v.get("cve"))
                        if v.get("cwe"):
                            cwe_id = str(v.get("cwe"))
                    elif isinstance(v, str):
                        via_desc.append(v)
            
            desc_text = f"Package '{pkg_name}' has vulnerability. Details: {'; '.join(via_desc) if via_desc else 'Outdated or vulnerable dependency package.'}"
            remediation = "Run `npm audit fix` or upgrade package to a patched version."

            findings.append(ScanFindingPreview(
                title=title,
                description=desc_text,
                severity=severity,
                cvss_score=8.0 if severity == "CRITICAL" else (6.5 if severity == "HIGH" else 4.5),
                cve_id=cve_id,
                cwe_id=cwe_id or "CWE-1104",
                affected_component=pkg_name,
                affected_version=str(info.get("range", "unknown")),
                remediation=remediation
            ))

    # Format 2: npm v6 (advisories dictionary)
    advisories = data.get("advisories", {})
    if isinstance(advisories, dict) and not findings:
        for adv_id, adv in advisories.items():
            if not isinstance(adv, dict):
                continue
            title = f"NPM Advisory: {adv.get('title', 'Vulnerable package')}"
            pkg_name = adv.get("module_name", "unknown")
            sev_raw = str(adv.get("severity", "LOW")).upper()
            severity = sev_raw if sev_raw in ["LOW", "MEDIUM", "HIGH", "CRITICAL"] else "MEDIUM"

            findings.append(ScanFindingPreview(
                title=title,
                description=str(adv.get("overview", adv.get("recommendation", "Vulnerable package advisory"))),
                severity=severity,
                cvss_score=float(adv.get("cvss", {}).get("score", 5.0)) if isinstance(adv.get("cvss"), dict) else 5.0,
                cve_id=adv.get("cve"),
                cwe_id=str(adv.get("cwe", "CWE-1104")),
                affected_component=pkg_name,
                affected_version=str(adv.get("vulnerable_versions", "unknown")),
                remediation=str(adv.get("recommendation", "Upgrade dependency"))
            ))

    return findings
