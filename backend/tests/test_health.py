
import pytest
from unittest.mock import patch
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_healthy():
    """Readiness endpoint responds successfully."""

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.get("/health/ready")

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_unavailable():
    """Detailed health endpoint requires authentication."""

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.get("/health/detail")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_health_admin_only():
    """Unauthenticated users cannot access detailed health information."""

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        response = await client.get("/health/detail")

    assert response.status_code == 401
