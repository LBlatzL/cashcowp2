
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.dependencies import get_db, Token
from app.models import User, RefreshToken
from app.auth import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
    create_access_token,
    create_refresh_token,
    hash_refresh_token,
    verify_password
)

router = APIRouter(prefix="/auth", tags=["auth"])


class RefreshRequest(BaseModel):
    refresh_token: str


def unauthorized():
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token"
    )


async def issue_tokens(db, user, chain_id=None):
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.name},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    refresh_token = create_refresh_token()

    record = RefreshToken(
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_token),
        expires_at=datetime.now(timezone.utc)
        + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

    if chain_id:
        record.chain_id = chain_id

    db.add(record)
    await db.flush()

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )


@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.username == form_data.username)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(
        form_data.password, user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    tokens = await issue_tokens(db, user)
    await db.commit()
    return tokens


@router.post("/refresh", response_model=Token)
async def refresh_tokens(
    data: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    token_hash = hash_refresh_token(data.refresh_token)

    result = await db.execute(
        select(RefreshToken)
        .where(RefreshToken.token_hash == token_hash)
        .with_for_update()
    )
    record = result.scalar_one_or_none()

    if record is None:
        raise unauthorized()

    if record.revoked:
        await db.execute(
            update(RefreshToken)
            .where(RefreshToken.chain_id == record.chain_id)
            .values(revoked=True)
        )
        await db.commit()
        raise unauthorized()

    now = datetime.now(timezone.utc)

    if record.expires_at < now:
        record.revoked = True
        await db.commit()
        raise unauthorized()

    result = await db.execute(
        select(User).where(User.id == record.user_id)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise unauthorized()

    record.revoked = True

    tokens = await issue_tokens(db, user, record.chain_id)
    await db.commit()

    return tokens


@router.post("/logout")
async def logout(
    data: RefreshRequest,
    db: AsyncSession = Depends(get_db)
):
    await db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.token_hash ==
            hash_refresh_token(data.refresh_token)
        )
        .values(revoked=True)
    )
    await db.commit()

    return {"message": "Logged out successfully"}
