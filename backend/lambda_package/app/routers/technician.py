
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.dependencies import get_db, require_roles
from app.models.branch import Branch
from app.models.technician import Technician
from app.models.servicecall import Service_call, ServiceStatus
from app.models.user import User, Role


router = APIRouter(
    prefix="/technician",
    tags=["technician"]
)


class ReportingLinesRead(BaseModel):
    supervisor_id: int
    active_technicians: int



@router.get("/reporting-lines", response_model=ReportingLinesRead)
async def get_reporting_lines(
    supervisor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(Role.operations_admin, Role.auditor)
    )
):
    statement = (
        select(
            func.count(
                func.distinct(Technician.id)
            ).label("active_technicians")
        )
        .join(Branch, Technician.branch_id == Branch.id)
        .join(
            Service_call,
            Service_call.technician_id == Technician.id
        )
        .where(
            Branch.supervisor_id == supervisor_id,
            Service_call.status != ServiceStatus.completed,
            Service_call.status != ServiceStatus.failed
        )
    )

    result = await db.execute(statement)

    return {
        "supervisor_id": supervisor_id,
        "active_technicians": result.scalar_one()
    }
