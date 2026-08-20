# SentinelDesk REST API Documentation

Base URL: `/api/v1`

FastAPI automatically serves interactive Swagger UI documentation at:
`http://localhost:8000/docs`

## Endpoints Summary

### Auth
- `POST /api/v1/auth/register` - User registration & workspace creation
- `POST /api/v1/auth/login` - Authenticate & obtain JWT tokens
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET  /api/v1/auth/me` - Get active user profile
- `POST /api/v1/auth/logout` - Clear user session

### Applications
- `GET    /api/v1/applications` - List workspace applications
- `POST   /api/v1/applications` - Create application asset
- `GET    /api/v1/applications/{id}` - Application detail with risk score
- `PUT    /api/v1/applications/{id}` - Update application
- `DELETE /api/v1/applications/{id}` - Archive/delete application

### Vulnerabilities
- `GET    /api/v1/vulnerabilities` - List & filter vulnerabilities
- `POST   /api/v1/vulnerabilities` - Create vulnerability finding
- `GET    /api/v1/vulnerabilities/{id}` - Vulnerability detail
- `PUT    /api/v1/vulnerabilities/{id}` - Update severity/status/assignee
- `DELETE /api/v1/vulnerabilities/{id}` - Delete vulnerability finding
- `GET    /api/v1/vulnerabilities/{id}/comments` - List comments
- `POST   /api/v1/vulnerabilities/{id}/comments` - Add comment
- `GET    /api/v1/vulnerabilities/{id}/activities` - List audit timeline

### Incidents
- `GET    /api/v1/incidents` - List security incidents
- `POST   /api/v1/incidents` - Declare incident
- `GET    /api/v1/incidents/{id}` - Incident detail
- `PUT    /api/v1/incidents/{id}` - Update status & threat assessment

### Security Scans
- `POST /api/v1/scans/preview` - Upload and parse scan report JSON
- `POST /api/v1/scans/confirm` - Confirm import into target application
- `GET  /api/v1/scans/history` - Scan import audit history

### AI Copilot
- `POST /api/v1/ai/analyze` - Perform AI vulnerability analysis
- `POST /api/v1/ai/chat` - Interactive AI security assistant query
