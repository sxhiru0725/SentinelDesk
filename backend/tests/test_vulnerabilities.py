import pytest


def test_vulnerability_crud_flow(client, auth_headers):
    # 1. Create Application
    app_payload = {
        "name": "Test Application",
        "description": "App for automated tests",
        "business_criticality": "HIGH"
    }
    app_res = client.post("/api/v1/applications", json=app_payload, headers=auth_headers)
    assert app_res.status_code == 201
    app_id = app_res.json()["id"]

    # 2. Create Vulnerability
    vuln_payload = {
        "application_id": app_id,
        "title": "Unauthenticated RCE in Test Component",
        "description": "Remote code execution vector discovered in route execution handler.",
        "severity": "CRITICAL",
        "status": "OPEN",
        "cvss_score": 9.8,
        "cve_id": "CVE-2026-9999",
        "cwe_id": "CWE-94",
        "source": "MANUAL"
    }
    vuln_res = client.post("/api/v1/vulnerabilities", json=vuln_payload, headers=auth_headers)
    assert vuln_res.status_code == 201
    vuln_id = vuln_res.json()["id"]
    assert vuln_res.json()["severity"] == "CRITICAL"

    # 3. Update Status
    update_res = client.put(f"/api/v1/vulnerabilities/{vuln_id}", json={"status": "IN_PROGRESS"}, headers=auth_headers)
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "IN_PROGRESS"

    # 4. Add Comment
    comment_res = client.post(f"/api/v1/vulnerabilities/{vuln_id}/comments", json={"content": "Investigating RCE patch."}, headers=auth_headers)
    assert comment_res.status_code == 201
    assert comment_res.json()["content"] == "Investigating RCE patch."

    # 5. List Activities
    act_res = client.get(f"/api/v1/vulnerabilities/{vuln_id}/activities", headers=auth_headers)
    assert act_res.status_code == 200
    assert len(act_res.json()) >= 2
