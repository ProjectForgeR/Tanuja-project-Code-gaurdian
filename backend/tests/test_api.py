import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["analyzers"]["python_ast"] is True


@pytest.mark.asyncio
async def test_analyze_python_vulnerable_code():
    code = """
import os

def delete_user_files(user_id):
    # Command injection vulnerability
    os.system(f"rm -rf /data/users/{user_id}")
"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/analyses/analyze", json={
            "code": code,
            "language": "python",
            "filename": "cleanup.py",
            "run_ai": False,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["quality_score"] < 90
        assert data["findings_count"] >= 1
        assert any("Command Injection" in f["title"] for f in data["findings"])


@pytest.mark.asyncio
async def test_auth_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register
        import uuid
        test_email = f"user_{uuid.uuid4().hex[:6]}@codeguardian.ai"
        reg_resp = await ac.post("/api/auth/register", json={
            "email": test_email,
            "password": "securepassword123",
            "full_name": "Test Engineer",
        })
        assert reg_resp.status_code == 200
        reg_data = reg_resp.json()
        token = reg_data["access_token"]
        assert token is not None

        # Get me
        me_resp = await ac.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["email"] == test_email

        # Login
        login_resp = await ac.post("/api/auth/login", json={
            "email": test_email,
            "password": "securepassword123",
        })
        assert login_resp.status_code == 200
        assert "access_token" in login_resp.json()


@pytest.mark.asyncio
async def test_settings_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.get("/api/settings")
        assert resp.status_code == 200
        data = resp.json()
        assert "theme" in data
        assert "debounce_delay_ms" in data
