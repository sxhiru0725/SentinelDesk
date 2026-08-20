# SentinelDesk Security Model & Architecture

## Security Principles

1. **Secrets Management**: Secrets are supplied via environment variables (`.env`). Secrets are never hardcoded or output in API responses.
2. **Password Security**: Passwords are hashed using `pwdlib` / `bcrypt` algorithms. Plaintext passwords are never logged or returned.
3. **Role-Based Access Control (RBAC)**: Backend dependencies enforce strict access controls (`ADMIN`, `SECURITY_ANALYST`, `DEVELOPER`, `VIEWER`).
4. **Data Isolation**: Multi-tenant authorization prevents cross-workspace IDOR vulnerabilities.
5. **Immutable Audit Logs**: Key security actions are recorded in the `audit_logs` database table.
6. **AI Safety**: Minimum data context is passed to AI providers. AI output is clearly marked and never automatically executed.
