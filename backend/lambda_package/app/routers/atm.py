
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_, func
from app.dependencies import get_db, require_roles
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, ConfigDict

from app.models.atm import Status, Atm
from app.models.branch import Branch
from app.models.user import User, Role


router = APIRouter(
    prefix="/atm",
    tags=["atm"]
)


class AtmBase(BaseModel):
    serial_number: int
    model: str
    status: Status
    cash_level: int
    branch_id: int
    technician_id: int


class AtmRead(AtmBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class AtmUpdate(BaseModel):
    serial_number: int | None = None
    model: str | None = None
    status: Status | None = None
    cash_level: int | None = None
    branch_id: int | None = None
    technician_id: int | None = None

class MaintenanceFlagRead(BaseModel):
    branch_id: int
    branch_name: str
    total_atms: int
    maintenance_atms: int
    maintenance_percentage: float


@router.get("", response_model=list[AtmRead])
async def get_atms(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Atm)
        .where(
            Atm.status != Status.offline
        )
        .order_by(Atm.id)
    )

    return result.scalars().all()


@router.post("", response_model=AtmRead, status_code=status.HTTP_201_CREATED)
async def create_atm(
    data: AtmBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.operations_admin))
):
    atm = Atm(
        serial_number=data.serial_number,
        model=data.model,
        status=data.status,
        cash_level=data.cash_level,
        branch_id=data.branch_id,
        technician_id=data.technician_id
    )

    db.add(atm)
    await db.commit()
    await db.refresh(atm)

    return atm


@router.delete("/{atm_id}")
async def delete_atm(
    atm_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.operations_admin))
):
    result = await db.execute(
        select(Atm).where(Atm.id == atm_id)
    )

    atm = result.scalar_one_or_none()

    if atm is None:
        raise HTTPException(
            status_code=404,
            detail="ATM not found"
        )

    await db.delete(atm)
    await db.commit()

    return {"message": "ATM deleted"}


@router.get("/maintenance-flags", response_model=list[MaintenanceFlagRead])
async def get_maintenance_flags(db: AsyncSession = Depends(get_db)):
    statement = (
        select(
            Branch.id.label("branch_id"),
            Branch.name.label("branch_name"),
            func.count(Atm.id).label("total_atms"),
            func.count(Atm.id)
                .filter(Atm.status == Status.maintenance)
                .label("maintenance_atms"),
            (
                func.count(Atm.id)
                .filter(Atm.status == Status.maintenance)
                * 100.0
                / func.count(Atm.id)
            ).label("maintenance_percentage")
        )
        .join(Atm, Branch.id == Atm.branch_id)
        .group_by(Branch.id, Branch.name)
        .having(
            func.count(Atm.id)
            .filter(Atm.status == Status.maintenance)
            * 1.0
            / func.count(Atm.id) > 0.30
        )
        .order_by(Branch.id)
    )

    result = await db.execute(statement)
    return result.all()

@router.patch("/{atm_id}", response_model=AtmRead)
async def update_atm(
    atm_id: int,
    data: AtmUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles(Role.operations_admin))
):
    result = await db.execute(
        select(Atm).where(Atm.id == atm_id)
    )

    atm = result.scalar_one_or_none()

    if atm is None:
        raise HTTPException(
            status_code=404,
            detail="ATM not found"
        )

    updates = data.model_dump(exclude_unset=True)

    for field, value in updates.items():
        setattr(atm, field, value)

    await db.commit()
    await db.refresh(atm)

    return atm