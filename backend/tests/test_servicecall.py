
import pytest

from app.main import app
from app.dependencies import get_current_user
from app.models.user import User, Role


@pytest.mark.asyncio
async def test_field_technician_cannot_create_service(client):
    async def override_current_user():
        user = User()
        user.username = "technician"
        user.role = Role.field_technician
        return user

    app.dependency_overrides[get_current_user] = override_current_user

    try:
        response = await client.post(
            "/service",
            json={
                "title": "ATM Inspection",
                "priority": "low",
                "status": "pending",
                "atm_id": 1,
                "technician_id": 1
            }
        )

        assert response.status_code == 403

    finally:
        app.dependency_overrides.pop(get_current_user, None)
