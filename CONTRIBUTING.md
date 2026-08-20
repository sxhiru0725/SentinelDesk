# Contributing Guidelines

Thank you for contributing to SentinelDesk!

## Local Development Setup

1. Backend:
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   alembic upgrade head
   python -m scripts.seed_demo_data
   python -m uvicorn app.main:app --reload
   ```

2. Frontend:
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. Testing:
   ```powershell
   cd backend
   pytest

   cd frontend
   npm test
   npm run build
   ```
