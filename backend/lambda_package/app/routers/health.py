
import asyncio
import os
import boto3

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from botocore.config import Config

from app.dependencies import get_db, require_roles
from app.models.user import Role

router = APIRouter(prefix="/health", tags=["Health"])


async def check_database(db: AsyncSession):
    try:
        await asyncio.wait_for(
            db.execute(text("SELECT 1")),
            timeout=3
        )
        return True
    except Exception:
        return False


def check_s3():
    try:
        bucket = os.environ["S3_BUCKET_NAME"]
        client = boto3.client(
            "s3",
            config=Config(
                connect_timeout=2,
                read_timeout=2,
                retries={"max_attempts": 1}
            )
        )
        client.head_bucket(Bucket=bucket)
        return True
    except Exception:
        return False


@router.get("/ready")
async def readiness(response: Response, db: AsyncSession = Depends(get_db)):
    healthy = await check_database(db)

    if not healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {"status": "ok" if healthy else "unavailable"}


@router.get("/detail")
async def health_detail(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_roles(Role.operations_admin))
):
    database, s3 = await asyncio.gather(
        check_database(db),
        asyncio.to_thread(check_s3)
    )

    return {
        "database": "ok" if database else "unavailable",
        "s3": "ok" if s3 else "unavailable"
    }
