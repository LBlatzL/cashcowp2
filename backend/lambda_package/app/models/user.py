from app.models.base import Base
from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from enum import Enum
from sqlalchemy import Enum as SQLEnum

class Role(Enum):
    operations_admin = "OPERATIONS_ADMIN"
    field_technician = "FIELD_TECHNICIAN"
    auditor = "AUDITOR"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(30))
    password: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(SQLEnum(Role))
    is_active: Mapped[bool] = mapped_column(Boolean)

