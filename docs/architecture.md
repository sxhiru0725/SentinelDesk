# SentinelDesk Architecture Specification

## Overview

SentinelDesk is a multi-tenant cybersecurity SaaS platform built for vulnerability management, security incident response, scan ingestion, and AI-assisted remediation.

```mermaid
graph TD
    Client[React 18 + TypeScript + Vite SPA]
    
    subgraph Core Platform Services
        API[FastAPI Gateway]
        Auth[JWT & RBAC Middleware]
        DB[(PostgreSQL Database)]
        Alembic[Alembic Migration Engine]
    end

    subgraph Security Scan Parsers
        NPM[npm audit Parser]
        Trivy[Trivy Scanner Parser]
        ZAP[OWASP ZAP Parser]
    end

    subgraph AI Intelligence Engine
        AI[Gemini Copilot Service]
    end

    Client -->|HTTPS / REST API| API
    API --> Auth
    API --> DB
    API --> NPM
    API --> Trivy
    API --> ZAP
    API --> AI
```

## Data Isolation & Multi-Tenancy

Every domain entity (`Application`, `Vulnerability`, `Incident`, `ScanImport`, `Notification`) belongs to a `Workspace`. Cross-workspace isolation is enforced by the FastAPI dependency `get_current_workspace`, checking workspace membership before querying or mutating resources.
