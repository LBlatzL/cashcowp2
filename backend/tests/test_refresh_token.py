
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.dependencies import get_db
from app.models import RefreshToken
from app.auth import hash_refresh_token


@pytest.fixture
def mock_db():
    db = AsyncMock()
    db.add = lambda obj: None
    return db


@pytest_asyncio.fixture
async def client(mock_db):
    async def override_db():
        yield mock_db

    app.dependency_overrides[get_db] = override_db

    try:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test"
        ) as client:
            yield client
    finally:
        app.dependency_overrides.pop(get_db, None)


def mock_result(value):
    return SimpleNamespace(
        scalar_one_or_none=lambda: value
    )


@pytest.mark.asyncio
async def test_refresh_rotation(client, mock_db):
    """Valid refresh token is revoked and replaced."""

    old_token = "original-refresh-token"

    record = RefreshToken(
        user_id=1,
        token_hash=hash_refresh_token(old_token),
        chain_id="test-chain",
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        revoked=False
    )

    user = SimpleNamespace(
        id=1,
        username="admin",
        role=SimpleNamespace(name="operations_admin")
    )

    mock_db.execute.side_effect = [
        mock_result(record),
        mock_result(user)
    ]

    response = await client.post(
        "/auth/refresh",
        json={"refresh_token": old_token}
    )

    assert response.status_code == 200
    assert record.revoked is True

    data = response.json()
    assert data["refresh_token"] != old_token
    assert data["access_token"]
    assert data["token_type"] == "bearer"

    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_expired_refresh_token(client, mock_db):
    """Expired refresh token returns 401."""

    record = RefreshToken(
        user_id=1,
        token_hash=hash_refresh_token("expired-token"),
        chain_id="test-chain",
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        revoked=False
    )

    mock_db.execute.return_value = mock_result(record)

    response = await client.post(
        "/auth/refresh",
        json={"refresh_token": "expired-token"}
    )

    assert response.status_code == 401
    assert record.revoked is True

    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_refresh_token_reuse(client, mock_db):
    """Reusing a revoked token revokes its chain."""

    record = RefreshToken(
        user_id=1,
        token_hash=hash_refresh_token("used-token"),
        chain_id="test-chain",
        expires_at=datetime.now(timezone.utc) + timedelta(days=1),
        revoked=True
    )

    mock_db.execute.side_effect = [
        mock_result(record),
        SimpleNamespace()
    ]

    response = await client.post(
        "/auth/refresh",
        json={"refresh_token": "used-token"}
    )

    assert response.status_code == 401
    assert mock_db.execute.await_count == 2

    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_logout_revokes_refresh_token(client, mock_db):
    """Logout revokes the refresh token."""

    response = await client.post(
        "/auth/logout",
        json={"refresh_token": "logout-token"}
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"

    mock_db.execute.assert_awaited_once()
    mock_db.commit.assert_awaited_once()
