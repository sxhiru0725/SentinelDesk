import json
import pytest
from app.parsers.npm_audit import parse_npm_audit
from app.parsers.trivy import parse_trivy
from app.parsers.zap import parse_zap


def test_npm_audit_parser():
    npm_report = {
        "vulnerabilities": {
            "express": {
                "name": "express",
                "severity": "high",
                "via": [{"title": "Open Redirect in Express", "cve": "CVE-2024-1111", "cwe": "CWE-601"}],
                "range": "<4.19.2"
            }
        }
    }
    findings = parse_npm_audit(json.dumps(npm_report))
    assert len(findings) == 1
    assert findings[0].severity == "HIGH"
    assert findings[0].affected_component == "express"


def test_trivy_parser():
    trivy_report = {
        "Results": [
            {
                "Target": "alpine:latest",
                "Vulnerabilities": [
                    {
                        "VulnerabilityID": "CVE-2024-5555",
                        "PkgName": "libcrypto",
                        "InstalledVersion": "1.1.1",
                        "FixedVersion": "1.1.2",
                        "Severity": "CRITICAL",
                        "Title": "Buffer Overflow in libcrypto",
                        "CweIDs": ["CWE-120"]
                    }
                ]
            }
        ]
    }
    findings = parse_trivy(json.dumps(trivy_report))
    assert len(findings) == 1
    assert findings[0].severity == "CRITICAL"
    assert findings[0].cve_id == "CVE-2024-5555"


def test_zap_parser():
    zap_report = {
        "site": [
            {
                "alerts": [
                    {
                        "alert": "Cross-Site Scripting (Reflected)",
                        "riskdesc": "High (Medium)",
                        "desc": "XSS vector in query param",
                        "cweid": "79",
                        "url": "https://example.com/search"
                    }
                ]
            }
        ]
    }
    findings = parse_zap(json.dumps(zap_report))
    assert len(findings) == 1
    assert findings[0].severity == "HIGH"
    assert findings[0].cwe_id == "CWE-79"
