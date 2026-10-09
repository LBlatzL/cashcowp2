
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict

from app.dependencies import get_db, require_roles
from app.models.atm import Atm
from app.models.technician import Technician
from app.models.servicecall import Service_call, ServiceStatus, Priority
from app.models.user import User, Role


class ColocationDiscRead(BaseModel):
    atm_id: int
    atm_model: str
    atm_branch_id: int
    technician_id: int
    technician_branch_id: int


class ServiceRatioRead(BaseModel):
    atm_model: str
    completed: int
    failed: int


class ServiceCallCreate(BaseModel):
    title: str
    priority: Priority
    status: ServiceStatus
    atm_id: int
    technician_id: int


class ServiceCallRead(ServiceCallCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class ServiceCallUpdate(BaseModel):
    title: str | None = None
    priority: Priority | None = None
    status: ServiceStatus | None = None
    atm_id: int | None = None
    technician_id: int | None = None


router = APIRouter(
    prefix="/service",
    tags=["service"]
)


@router.get("", response_model=list[ServiceCallRead])
async def get_service_calls(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            Role.operations_admin,
            Role.field_technician,
            Role.auditor
        )
    )
):
    statement = select(Service_call).order_by(Service_call.id)

    result = await db.execute(statement)

    return result.scalars().all()


@router.post(
    "",
    response_model=ServiceCallRead,
    status_code=status.HTTP_201_CREATED
)
async def create_service_call(
    data: ServiceCallCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(Role.operations_admin)
    )
):
    service_call = Service_call(**data.model_dump())

    db.add(service_call)
    await db.commit()
    await db.refresh(service_call)

    return service_call


@router.delete("/{call_id}")
async def delete_service_call(
    call_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(Role.operations_admin)
    )
):
    result = await db.execute(
        select(Service_call).where(
            Service_call.id == call_id
        )
    )

    service_call = result.scalar_one_or_none()

    if service_call is None:
        raise HTTPException(
            status_code=404,
            detail="Service call not found"
        )

    await db.delete(service_call)
    await db.commit()

    return {"message": "Service call deleted"}


@router.get(
    "/colocation",
    response_model=list[ColocationDiscRead]
)
async def get_colocation_disc(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(Role.operations_admin, Role.auditor)
    )
):
    statement = select(
        Atm.id.label("atm_id"),
        Atm.model.label("atm_model"),
        Atm.branch_id.label("atm_branch_id"),
        Technician.id.label("technician_id"),
        Technician.branch_id.label("technician_branch_id")
    ).join(
        Technician,
        Atm.technician_id == Technician.id
    ).where(
        Technician.branch_id != Atm.branch_id
    )

    result = await db.execute(statement)

    return result.all()


@router.get(
    "/reliability",
    response_model=list[ServiceRatioRead]
)
async def get_reliability(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(Role.operations_admin, Role.auditor)
    )
):
    statement = select(
        Atm.model.label("atm_model"),
        func.count(Service_call.id)
            .filter(Service_call.status == ServiceStatus.completed)
            .label("completed"),
        func.count(Service_call.id)
            .filter(Service_call.status == ServiceStatus.failed)
            .label("failed")
    ).join(
        Service_call,
        Atm.id == Service_call.atm_id
    ).group_by(Atm.model)

    result = await db.execute(statement)

    return result.all()


@router.patch(
    "/{call_id}",
    response_model=ServiceCallRead
)
async def update_service_call(
    call_id: int,
    data: ServiceCallUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(
        require_roles(Role.operations_admin)
    )
):
    result = await db.execute(
        select(Service_call).where(
            Service_call.id == call_id
        )
    )

    service_call = result.scalar_one_or_none()

    if service_call is None:
        raise HTTPException(
            status_code=404,
            detail="Service call not found"
        )

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(service_call, field, value)

    await db.commit()
    await db.refresh(service_call)

    return service_call
