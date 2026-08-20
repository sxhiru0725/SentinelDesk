import pytest


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_user_registration(client):
    register_payload = {
        "name": "Jane Security",
        "email": "jane.sec@sentineldesk.io",
        "password": "SecurePassword123!"
    }
    response = client.post("/api/v1/auth/register", json=register_payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "jane.sec@sentineldesk.io"


def test_duplicate_registration_fails(client):
    register_payload = {
        "name": "Jane Security",
        "email": "jane.dup@sentineldesk.io",
        "password": "SecurePassword123!"
    }
    res1 = client.post("/api/v1/auth/register", json=register_payload)
    assert res1.status_code == 201

    res2 = client.post("/api/v1/auth/register", json=register_payload)
    assert res2.status_code == 400
    assert "already registered" in res2.json()["detail"]


def test_login_invalid_password(client):
    response = client.post("/api/v1/auth/login", json={"email": "admin@sentineldesk.io", "password": "WrongPassword!"})
    assert response.status_code == 401


def test_protected_route_without_auth(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
