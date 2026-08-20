import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.core.security import hash_password
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember

# We use the configured PostgreSQL test DB or local database for test suite execution
from app.database import engine

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    def _get_test_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _get_test_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(client, db_session):
    # Ensure test user exists
    test_email = "testuser@sentineldesk.io"
    user = db_session.query(User).filter(User.email == test_email).first()
    if not user:
        user = User(
            name="Test User",
            email=test_email,
            password_hash=hash_password("Password123!"),
            role="ADMIN"
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        ws = Workspace(name="Test Workspace", slug=f"test-ws-{user.id}", owner_id=user.id)
        db_session.add(ws)
        db_session.commit()
        db_session.refresh(ws)

        db_session.add(WorkspaceMember(workspace_id=ws.id, user_id=user.id, role="ADMIN"))
        db_session.commit()

    resp = client.post("/api/v1/auth/login", json={"email": test_email, "password": "Password123!"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
