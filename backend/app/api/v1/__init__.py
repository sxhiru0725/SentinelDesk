from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.workspaces import router as workspaces_router
from app.api.v1.applications import router as applications_router
from app.api.v1.vulnerabilities import router as vulnerabilities_router
from app.api.v1.incidents import router as incidents_router
from app.api.v1.scans import router as scans_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.ai import router as ai_router
from app.api.v1.audit_logs import router as audit_logs_router
from app.api.v1.notifications import router as notifications_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Auth"])
api_router.include_router(workspaces_router, prefix="/workspaces", tags=["Workspaces"])
api_router.include_router(applications_router, prefix="/applications", tags=["Applications"])
api_router.include_router(vulnerabilities_router, prefix="/vulnerabilities", tags=["Vulnerabilities"])
api_router.include_router(incidents_router, prefix="/incidents", tags=["Incidents"])
api_router.include_router(scans_router, prefix="/scans", tags=["Scans"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(ai_router, prefix="/ai", tags=["AI Security Assistant"])
api_router.include_router(audit_logs_router, prefix="/audit-logs", tags=["Audit Logs"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
