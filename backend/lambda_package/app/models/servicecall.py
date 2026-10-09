from app.models.base import Base
from typing import List
from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from enum import Enum
from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .atm import Atm
    from .technician import Technician

class Priority(Enum):
    low = "LOW"
    medium = "MEDIUM"
    critical = "CRITICAL"

class ServiceStatus(Enum):
    pending = "PENDING"
    in_progress = "IN_PROGRESS"
    completed = "COMPLETED"
    failed = "FAILED"

class Service_call(Base):
    __tablename__ = "service_call"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(30))
    priority: Mapped[Priority] = mapped_column(SQLEnum(Priority))
    status: Mapped[ServiceStatus] = mapped_column(SQLEnum(ServiceStatus))
    atm_id: Mapped[int] = mapped_column(ForeignKey("atm.id"))
    technician_id: Mapped[int] = mapped_column(ForeignKey("technician.id"))

    atm: Mapped["Atm"] = relationship(back_populates="service_calls")
    technician: Mapped["Technician"] = relationship(back_populates="service_calls")
