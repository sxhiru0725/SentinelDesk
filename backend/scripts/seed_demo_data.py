from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember
from app.models.application import Application
from app.models.vulnerability import Vulnerability, Comment, VulnerabilityActivity
from app.models.incident import Incident
from app.models.audit_log import AuditLog
from app.models.notification import Notification
from app.core.security import hash_password


def seed_demo_data():
    db: Session = SessionLocal()
    try:
        print("Seeding SentinelDesk demo data...")

        # 1. Admin & Security Analyst Users
        admin_email = "admin@sentineldesk.io"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                name="Sarah Connor (Lead SOC)",
                email=admin_email,
                password_hash=hash_password("Admin123!"),
                role="ADMIN"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        dev_email = "dev@sentineldesk.io"
        dev = db.query(User).filter(User.email == dev_email).first()
        if not dev:
            dev = User(
                name="Alex Mercer (Sr. Engineer)",
                email=dev_email,
                password_hash=hash_password("Developer123!"),
                role="DEVELOPER"
            )
            db.add(dev)
            db.commit()
            db.refresh(dev)

        analyst_email = "analyst@sentineldesk.io"
        analyst = db.query(User).filter(User.email == analyst_email).first()
        if not analyst:
            analyst = User(
                name="Marcus Vance (Security Analyst)",
                email=analyst_email,
                password_hash=hash_password("Analyst123!"),
                role="SECURITY_ANALYST"
            )
            db.add(analyst)
            db.commit()
            db.refresh(analyst)

        # 2. Workspace
        ws_slug = "acme-cybersecurity"
        ws = db.query(Workspace).filter(Workspace.slug == ws_slug).first()
        if not ws:
            ws = Workspace(
                name="Acme Global Security",
                slug=ws_slug,
                owner_id=admin.id
            )
            db.add(ws)
            db.commit()
            db.refresh(ws)

        # Add memberships
        for user, r in [(admin, "ADMIN"), (dev, "DEVELOPER"), (analyst, "SECURITY_ANALYST")]:
            mem = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == ws.id, WorkspaceMember.user_id == user.id).first()
            if not mem:
                db.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role=r))
        db.commit()

        # 3. Applications
        apps_data = [
            {
                "name": "Customer Web Portal",
                "description": "Public facing client management and billing dashboard",
                "repository_url": "https://github.com/acme/customer-portal",
                "production_url": "https://portal.acme-corp.io",
                "technology_stack": "React, TypeScript, Node.js, PostgreSQL",
                "business_criticality": "CRITICAL",
                "risk_score": 27.5
            },
            {
                "name": "Payment Gateway API",
                "description": "PCI-DSS compliant transaction processing microservice",
                "repository_url": "https://github.com/acme/payment-api",
                "production_url": "https://api.payments.acme-corp.io",
                "technology_stack": "Python, FastAPI, Redis, PostgreSQL",
                "business_criticality": "CRITICAL",
                "risk_score": 15.0
            },
            {
                "name": "Internal Admin Console",
                "description": "Internal employee directory and SSO management portal",
                "repository_url": "https://github.com/acme/admin-console",
                "production_url": "https://admin.internal.acme-corp.io",
                "technology_stack": "Vue.js, Express, MongoDB",
                "business_criticality": "HIGH",
                "risk_score": 8.0
            }
        ]

        app_objects = []
        for app_info in apps_data:
            app_obj = db.query(Application).filter(Application.workspace_id == ws.id, Application.name == app_info["name"]).first()
            if not app_obj:
                app_obj = Application(
                    workspace_id=ws.id,
                    name=app_info["name"],
                    description=app_info["description"],
                    repository_url=app_info["repository_url"],
                    production_url=app_info["production_url"],
                    technology_stack=app_info["technology_stack"],
                    business_criticality=app_info["business_criticality"],
                    risk_score=app_info["risk_score"],
                    owner_id=admin.id
                )
                db.add(app_obj)
                db.commit()
                db.refresh(app_obj)
            app_objects.append(app_obj)

        app_portal = app_objects[0]
        app_payment = app_objects[1]
        app_admin = app_objects[2]

        # 4. Vulnerabilities
        vulns_data = [
            {
                "app_id": app_portal.id,
                "title": "SQL Injection in User Search Filter",
                "description": "Unsanitized user search input in the customer list query allows arbitrary SQL execution via payload parameters.",
                "severity": "CRITICAL",
                "status": "IN_PROGRESS",
                "cvss_score": 9.8,
                "cve_id": "CVE-2024-21626",
                "cwe_id": "CWE-89",
                "source": "MANUAL",
                "affected_component": "api/v1/customers/search",
                "affected_version": "v2.1.4",
                "remediation": "Use parameterized queries or ORM query building. Escape user search strings before query execution.",
                "assigned_to_id": dev.id,
                "reported_by_id": analyst.id,
                "due_date": datetime.now(timezone.utc) + timedelta(days=2)
            },
            {
                "app_id": app_portal.id,
                "title": "Outdated Axios Dependency Vulnerable to SSRF",
                "description": "Transitive dependency `axios@0.21.1` contains a known Server-Side Request Forgery (SSRF) flaw when parsing relative URLs.",
                "severity": "HIGH",
                "status": "OPEN",
                "cvss_score": 7.5,
                "cve_id": "CVE-2023-45857",
                "cwe_id": "CWE-918",
                "source": "NPM_AUDIT",
                "affected_component": "package.json -> axios",
                "affected_version": "0.21.1",
                "remediation": "Upgrade `axios` package to version >= 1.6.0.",
                "assigned_to_id": dev.id,
                "reported_by_id": admin.id,
                "due_date": datetime.now(timezone.utc) + timedelta(days=5)
            },
            {
                "app_id": app_payment.id,
                "title": "Broken Object Level Authorization (BOLA) in Payment Retrieval",
                "description": "Authenticated users can query payment receipts of other accounts by altering the `transaction_id` path parameter.",
                "severity": "CRITICAL",
                "status": "TRIAGED",
                "cvss_score": 9.1,
                "cve_id": "CVE-2024-3094",
                "cwe_id": "CWE-639",
                "source": "OWASP_ZAP",
                "affected_component": "GET /api/v1/payments/{transaction_id}",
                "affected_version": "v1.8.0",
                "remediation": "Enforce object-level ownership authorization check ensuring requested transaction belongs to authenticated user account.",
                "assigned_to_id": dev.id,
                "reported_by_id": analyst.id,
                "due_date": datetime.now(timezone.utc) + timedelta(days=3)
            },
            {
                "app_id": app_admin.id,
                "title": "Missing Content Security Policy (CSP) Header",
                "description": "HTTP response headers do not include `Content-Security-Policy`, leaving the application exposed to cross-site scripting (XSS) vectors.",
                "severity": "MEDIUM",
                "status": "READY_FOR_REVIEW",
                "cvss_score": 5.3,
                "cve_id": None,
                "cwe_id": "CWE-693",
                "source": "OWASP_ZAP",
                "affected_component": "HTTP Security Headers",
                "affected_version": "N/A",
                "remediation": "Configure web server/middleware to set strong `Content-Security-Policy` header allowing only trusted scripts.",
                "assigned_to_id": dev.id,
                "reported_by_id": analyst.id,
                "due_date": datetime.now(timezone.utc) + timedelta(days=10)
            },
            {
                "app_id": app_payment.id,
                "title": "Weak JWT Signing Key Algorithm Fallback",
                "description": "JWT verifier accepts tokens signed with `none` algorithm if header header parameter is maliciously manipulated.",
                "severity": "HIGH",
                "status": "VERIFIED",
                "cvss_score": 8.2,
                "cve_id": "CVE-2022-21449",
                "cwe_id": "CWE-347",
                "source": "MANUAL",
                "affected_component": "app/core/security.py",
                "affected_version": "v1.7.9",
                "remediation": "Explicitly restrict JWT algorithm parameter to `HS256` or `RS256` during signature verification.",
                "assigned_to_id": dev.id,
                "reported_by_id": admin.id,
                "due_date": datetime.now(timezone.utc) - timedelta(days=1)
            }
        ]

        for vd in vulns_data:
            existing_v = db.query(Vulnerability).filter(Vulnerability.workspace_id == ws.id, Vulnerability.title == vd["title"]).first()
            if not existing_v:
                v_obj = Vulnerability(
                    workspace_id=ws.id,
                    application_id=vd["app_id"],
                    title=vd["title"],
                    description=vd["description"],
                    severity=vd["severity"],
                    status=vd["status"],
                    cvss_score=vd["cvss_score"],
                    cve_id=vd["cve_id"],
                    cwe_id=vd["cwe_id"],
                    source=vd["source"],
                    affected_component=vd["affected_component"],
                    affected_version=vd["affected_version"],
                    remediation=vd["remediation"],
                    assigned_to_id=vd["assigned_to_id"],
                    reported_by_id=vd["reported_by_id"],
                    due_date=vd["due_date"]
                )
                db.add(v_obj)
                db.commit()
                db.refresh(v_obj)

                # Add activity log
                db.add(VulnerabilityActivity(
                    vulnerability_id=v_obj.id,
                    actor_id=vd["reported_by_id"],
                    event_type="VULNERABILITY_CREATED",
                    new_value=v_obj.title
                ))
                db.commit()

        # 5. Incidents
        incidents_data = [
            {
                "title": "Suspicious Brute-Force Authentication Spike",
                "description": "Over 5,000 failed login attempts detected originating from IP range 185.220.101.0/24 targeting customer admin accounts.",
                "severity": "HIGH",
                "status": "INVESTIGATING",
                "incident_type": "SUSPICIOUS_ACTIVITY",
                "owner_id": analyst.id
            },
            {
                "title": "Potential AWS Access Key Leakage in Staging Logs",
                "description": "Automated log analyzer flagged plaintext IAM credentials in staging environment stdout logs during automated build deployment.",
                "severity": "CRITICAL",
                "status": "CONTAINED",
                "incident_type": "DATA_EXPOSURE",
                "owner_id": admin.id
            }
        ]

        for inc_info in incidents_data:
            existing_i = db.query(Incident).filter(Incident.workspace_id == ws.id, Incident.title == inc_info["title"]).first()
            if not existing_i:
                db.add(Incident(
                    workspace_id=ws.id,
                    title=inc_info["title"],
                    description=inc_info["description"],
                    severity=inc_info["severity"],
                    status=inc_info["status"],
                    incident_type=inc_info["incident_type"],
                    owner_id=inc_info["owner_id"],
                    detected_at=datetime.now(timezone.utc) - timedelta(hours=6)
                ))
        db.commit()

        # 6. Audit Logs
        db.add(AuditLog(
            workspace_id=ws.id,
            actor_id=admin.id,
            action="WORKSPACE_CREATE",
            resource_type="workspace",
            resource_id=str(ws.id),
            ip_address="127.0.0.1",
            metadata_json={"workspace_name": ws.name}
        ))
        db.commit()

        print("SentinelDesk demo data seeded successfully!")
    except Exception as e:
        print(f"Error seeding demo data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
