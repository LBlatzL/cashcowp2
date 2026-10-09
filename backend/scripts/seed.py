
import argparse
import asyncio
import os
import sys
import traceback

from dotenv import load_dotenv
from pwdlib import PasswordHash
from sqlalchemy import text, select, and_
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.models.base import Base
from app.models.branch import Branch
from app.models.technician import Technician
from app.models.atm import Atm, Status
from app.models.servicecall import Service_call, Priority, ServiceStatus
from app.models.user import User, Role
from app.models.refresh_token import RefreshToken

load_dotenv()

password_hash = PasswordHash.recommended()

# -----------------------------
# SEED DATA
# -----------------------------

BRANCHES = [
    dict(id=101, name="Tampa Central", location_region="Tampa, FL",
         capacity=10, supervisor_id=101),
    dict(id=102, name="Clearwater Central", location_region="Clearwater, FL",
         capacity=8, supervisor_id=102),
]

TECHNICIANS = [
    dict(id=101, branch_id=101),
    dict(id=102, branch_id=102),
    dict(id=103, branch_id=101),
]

ATMS = [
    dict(id=101, serial_number=91001, model="NCR-500",
         status=Status.operational, cash_level=15,
         branch_id=101, technician_id=101),
    dict(id=102, serial_number=91002, model="NCR-600",
         status=Status.maintenance, cash_level=65,
         branch_id=101, technician_id=102),
    dict(id=103, serial_number=91003, model="Diebold-700",
         status=Status.operational, cash_level=70,
         branch_id=102, technician_id=102),
    dict(id=104, serial_number=91004, model="Diebold-800",
         status=Status.maintenance, cash_level=10,
         branch_id=102, technician_id=103),
    dict(id=105, serial_number=91005, model="NCR-500",
         status=Status.offline, cash_level=5,
         branch_id=102, technician_id=102),
]

SERVICE_CALLS = [
    dict(id=101, title="Cash Refill", priority=Priority.low,
         status=ServiceStatus.pending, atm_id=101, technician_id=101),
    dict(id=102, title="Hardware Inspection", priority=Priority.medium,
         status=ServiceStatus.in_progress, atm_id=102, technician_id=102),
    dict(id=103, title="Repair Terminal", priority=Priority.critical,
         status=ServiceStatus.completed, atm_id=103, technician_id=102),
    dict(id=104, title="Replace Dispenser", priority=Priority.critical,
         status=ServiceStatus.failed, atm_id=104, technician_id=103),
]

USERS = [
    dict(id=101, username="admin",
         role=Role.operations_admin, is_active=True),
    dict(id=102, username="technician",
         role=Role.field_technician, is_active=True),
    dict(id=103, username="auditor",
         role=Role.auditor, is_active=True),
]


# -----------------------------
# HELPERS
# -----------------------------

async def insert_missing(session, model, records, unique_fields):
    added = 0

    for record in records:
        # Check primary key first
        if await session.get(model, record["id"]):
            continue

        # Check business identifiers
        conditions = [
            getattr(model, field) == record[field]
            for field in unique_fields
        ]

        result = await session.execute(
            select(model).where(and_(*conditions))
        )

        if result.scalars().first():
            continue

        data = record.copy()

        if model is User:
            data["password"] = password_hash.hash("luke123")

        session.add(model(**data))
        await session.flush()
        added += 1

    print(f"{model.__tablename__}: {added} new records")


async def reset_business_data(session):
    # Reset only demo business tables.
    # Users and refresh tokens are preserved.
    for model in (Service_call, Atm, Technician, Branch):
        await session.execute(model.__table__.delete())


# -----------------------------
# MAIN
# -----------------------------

async def run(args):
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise RuntimeError("DATABASE_URL is missing")

    engine = create_async_engine(
        database_url,
        connect_args={"timeout": 5}
    )

    try:
        async with engine.connect() as connection:
            await connection.execute(text("SELECT 1"))

        if args.check:
            print("Database connection successful.")
            return

        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

        Session = async_sessionmaker(
            engine,
            expire_on_commit=False
        )

        async with Session.begin() as session:
            if args.reset:
                await reset_business_data(session)

            await insert_missing(
                session, Branch, BRANCHES, ["name"]
            )

            await insert_missing(
                session, Technician, TECHNICIANS, ["id"]
            )

            await insert_missing(
                session, Atm, ATMS, ["serial_number"]
            )

            await insert_missing(
                session, Service_call, SERVICE_CALLS,
                ["title", "atm_id"]
            )

            await insert_missing(
                session, User, USERS, ["username"]
            )

        print("CashCow seed data loaded successfully.")

    finally:
        await engine.dispose()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    parser.add_argument("--reset", action="store_true")
    args = parser.parse_args()

    try:
        asyncio.run(run(args))

    except (RuntimeError, SQLAlchemyError, OSError, ValueError):
        print("ERROR: CashCow seed failed.", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
