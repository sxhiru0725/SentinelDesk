# SentinelDesk 

SentinelDesk is a full-stack cybersecurity vulnerability and incident management platform built to help development and security teams track security issues from discovery through remediation.

I built this project to go beyond a standard CRUD application and work with concepts used in real software and security teams, including vulnerability tracking, role-based access control, PostgreSQL, authentication, security dashboards, audit history and scanner imports.

---

## What does SentinelDesk do?

Imagine a company has several applications and a security issue is discovered in one of them.

Instead of tracking the problem through spreadsheets, emails or messages, the team can use SentinelDesk.

A typical workflow looks like this:

```text
Security issue discovered
        ↓
Vulnerability created
        ↓
Severity assigned
        ↓
Developer assigned
        ↓
Fix in progress
        ↓
Security review
        ↓
Verified
        ↓
Closed
```

SentinelDesk keeps the information and activity related to that vulnerability in one place.

---

## Features

### Authentication

* User registration
* Secure login
* Password hashing
* JWT authentication
* Protected routes

### Role-Based Access Control

SentinelDesk supports different types of users such as:

* Admin
* Security Analyst
* Developer
* Viewer

Permissions are enforced by the backend rather than relying only on the frontend.

### Application Management

Users can manage applications or systems being monitored, for example:

```text
Customer Portal
Payment API
Internal Admin Dashboard
```

Each application can have its own vulnerabilities and risk information.

### Vulnerability Management

Security issues can contain information such as:

* Title
* Description
* Severity
* Status
* CVSS score
* CVE / CWE
* Affected component
* Assigned developer
* Remediation information
* Due date

Example workflow:

```text
OPEN
  ↓
TRIAGED
  ↓
IN_PROGRESS
  ↓
READY_FOR_REVIEW
  ↓
VERIFIED
  ↓
CLOSED
```

### Security Dashboard

The dashboard provides an overview of the current security posture.

Examples include:

* Critical vulnerabilities
* High-risk vulnerabilities
* Open vulnerabilities
* Open incidents
* Vulnerabilities by severity
* Vulnerabilities by status
* Recent activity
* Application risk information

### Incident Management

Security incidents can also be tracked separately from vulnerabilities.

Examples:

* Suspicious login activity
* Unauthorized access
* Malware
* Potential data exposure
* Service disruption
* Phishing incidents

### Comments and Activity History

Team members can communicate directly on vulnerabilities.

SentinelDesk also records important activity such as:

```text
Vulnerability created
Severity changed
Developer assigned
Status changed
Comment added
Fix submitted
Vulnerability verified
Vulnerability closed
```

### Security Scan Imports

The system is designed to process security scanner reports and convert findings into manageable vulnerabilities.

Supported or planned scanner formats include:

* npm audit
* Trivy
* OWASP ZAP

### AI Security Assistant

SentinelDesk can optionally use AI to help explain vulnerabilities and provide remediation guidance.

Example:

```text
SQL Injection
Severity: Critical

AI Analysis:

Potential Impact
- Unauthorized database access
- Sensitive data exposure
- Data modification
- Authentication bypass

Recommended Action
- Use parameterised queries
- Validate user input
- Apply least-privilege database permissions
```

AI is treated as guidance only and does not automatically execute generated code.

---

# Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* TanStack Query
* React Hook Form
* Zod
* Recharts

## Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic
* Alembic
* JWT

## Database

* PostgreSQL

## Testing

* Pytest
* Vitest
* React Testing Library
* Playwright

## DevOps

* Docker
* Docker Compose
* GitHub Actions

---

# Project Structure

```text
SentinelDesk/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── security/
│   │   ├── services/
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
│
├── docs/
├── .github/
├── docker-compose.yml
├── .gitignore
├── SECURITY.md
├── CONTRIBUTING.md
└── README.md
```

---

# Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* Python 3.10+
* PostgreSQL
* Git

---

# 1. Clone the repository

```bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
cd SentinelDesk
```

---

# 2. Backend Setup

Go to the backend directory:

```bash
cd backend
```

Create a Python virtual environment:

### Windows

```powershell
python -m venv venv
```

Activate it:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```powershell
pip install -r requirements.txt
```

---

# 3. Configure PostgreSQL

Create a PostgreSQL database called:

```text
sentineldesk
```

Example:

```sql
CREATE DATABASE sentineldesk;
```

Create a `.env` file inside the backend directory.

Example:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sentineldesk

JWT_SECRET=YOUR_LONG_RANDOM_SECRET
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15

FRONTEND_URL=http://localhost:5173
```

Do not commit your real `.env` file.

---

# 4. Run Database Migrations

If Alembic migrations are configured:

```powershell
alembic upgrade head
```

---

# 5. Start the Backend

```powershell
python -m uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

---

# 6. Frontend Setup

Open another terminal.

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Start the frontend:

```powershell
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

# Example Workflow

After starting the application:

1. Create an account.
2. Log in.
3. Create or select a workspace.
4. Add an application.
5. Create a vulnerability.
6. Select its severity.
7. Assign it to a developer.
8. Move it through the remediation workflow.
9. Add comments and remediation information.
10. Verify and close the vulnerability.

Example:

```text
Payment API
    ↓
Broken Access Control
    ↓
Severity: CRITICAL
    ↓
Assigned to Developer
    ↓
IN_PROGRESS
    ↓
READY_FOR_REVIEW
    ↓
VERIFIED
    ↓
CLOSED
```

---

# API Documentation

FastAPI automatically provides interactive API documentation.

Start the backend and visit:

```text
http://127.0.0.1:8000/docs
```

This allows the API endpoints to be tested directly from the browser.

---

# Testing

## Backend

```powershell
cd backend
pytest
```

## Frontend

```powershell
cd frontend
npm run test
```

## Production Build

```powershell
npm run build
```

## End-to-End Tests

```powershell
npx playwright test
```

---

# Docker

If Docker is configured, the complete application can be started with:

```bash
docker compose up --build
```

This can run the frontend, backend and PostgreSQL services together.

---

# Security

Security is an important part of SentinelDesk itself.

The project includes or is designed around practices such as:

* Password hashing
* JWT authentication
* Backend authorization
* Role-based permissions
* Input validation
* Workspace isolation
* Safe SQLAlchemy queries
* Restricted CORS
* Environment-based secrets
* Audit logging
* File upload validation
* Secure API error handling

Sensitive information such as database passwords and JWT secrets should never be committed to the repository.

---

# Why I Built This

I wanted to build a project that combined software engineering with cybersecurity rather than creating another simple CRUD application.

SentinelDesk gave me the opportunity to work with:

* Full-stack application architecture
* REST API design
* Relational database design
* Authentication
* Authorization
* Cybersecurity concepts
* Security workflows
* Testing
* CI/CD
* Docker
* AI integration

The project is also designed around a problem that development and security teams deal with in real environments: identifying security issues, assigning responsibility and tracking them until they are resolved.

---

# Future Improvements

Some areas I would like to continue developing include:

* GitHub repository integration
* Automated dependency scanning
* Real-time notifications
* Email notifications
* Additional scanner formats
* CVE intelligence integration
* Advanced analytics
* Vulnerability SLA tracking
* AI-assisted vulnerability prioritisation
* Cloud deployment
* SSO / OAuth

---

# Disclaimer

SentinelDesk is a portfolio and educational cybersecurity project.

AI-generated security recommendations should be reviewed by a qualified developer or security professional before being applied to production systems.

---

## Author

**Sahiru Imadith**

Computer Science student and software developer interested in full-stack software engineering and cybersecurity.

GitHub: `sxhiru0725`

---

If you find the project interesting, feel free to explore the repository, test it locally or contribute improvements.
