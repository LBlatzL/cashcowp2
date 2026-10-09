
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from fastapi import Depends, HTTPException, status
import jwt
from typing import Annotated
from pydantic import BaseModel
from sqlalchemy import select
from app.models.user import User, Role
from app.auth import SECRET_KEY, ALGORITHM


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: str | None = None


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")

        if username is None or payload.get("type") != "access":
            raise credentials_exception

    except InvalidTokenError:
        raise credentials_exception

    result = await db.execute(
        select(User).where(User.username == username)
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    return user


def require_roles(*allowed_roles: Role):
    async def check_roles(
        current_user: User = Depends(get_current_user)
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )

        return current_user

    return check_roles
