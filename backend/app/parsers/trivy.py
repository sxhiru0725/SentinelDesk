import json
from typing import List
from app.schemas.scan import ScanFindingPreview


def parse_trivy(content_str: str) -> List[ScanFindingPreview]:
    try:
        data = json.loads(content_str)
    except Exception as e:
        raise ValueError(f"Invalid JSON format for Trivy report: {str(e)}")

    findings: List[ScanFindingPreview] = []
    results = data.get("Results", [])

    if isinstance(results, list):
        for res in results:
            if not isinstance(res, dict):
                continue
            target = res.get("Target", "Target")
            vulnerabilities = res.get("Vulnerabilities", [])
            
            if isinstance(vulnerabilities, list):
                for vuln in vulnerabilities:
                    if not isinstance(vuln, dict):
                        continue
                    
                    vuln_id = vuln.get("VulnerabilityID", "CVE-UNKNOWN")
                    pkg_name = vuln.get("PkgName", target)
                    installed_ver = vuln.get("InstalledVersion", "unknown")
                    fixed_ver = vuln.get("FixedVersion", "N/A")
                    
                    sev_raw = str(vuln.get("Severity", "LOW")).upper()
                    severity = sev_raw if sev_raw in ["LOW", "MEDIUM", "HIGH", "CRITICAL"] else "MEDIUM"
                    
                    title = f"Trivy [{vuln_id}]: {pkg_name} ({installed_ver})"
                    desc = vuln.get("Title") or vuln.get("Description") or f"Vulnerability detected in {pkg_name}"
                    
                    cwe_ids = vuln.get("CweIDs", [])
                    cwe_str = cwe_ids[0] if (isinstance(cwe_ids, list) and cwe_ids) else "CWE-999"
                    
                    cvss = None
                    cvss_dict = vuln.get("CVSS", {})
                    if isinstance(cvss_dict, dict):
                        for vendor, scores in cvss_dict.items():
                            if isinstance(scores, dict) and "V3Score" in scores:
                                cvss = float(scores["V3Score"])
                                break
                    
                    remediation = f"Upgrade {pkg_name} from version {installed_ver} to {fixed_ver}." if fixed_ver != "N/A" else "Check upstream for vendor updates."

                    findings.append(ScanFindingPreview(
                        title=title,
                        description=str(desc),
                        severity=severity,
                        cvss_score=cvss or (9.0 if severity == "CRITICAL" else (7.5 if severity == "HIGH" else 4.0)),
                        cve_id=vuln_id if vuln_id.startswith("CVE") else None,
                        cwe_id=str(cwe_str),
                        affected_component=pkg_name,
                        affected_version=installed_ver,
                        remediation=remediation
                    ))

    return findings
