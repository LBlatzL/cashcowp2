from app.models.base import Base
from typing import List
from sqlalchemy import ForeignKey
from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from typing import TYPE_CHECKING
from sqlalchemy import Enum as SQLEnum

if TYPE_CHECKING:
    from .branch import Branch
    from .technician import Technician
    from .servicecall import Service_call

from enum import Enum

class Status(Enum):
    operational = "OPERATIONAL"
    in_transport = "IN_TRANSPORT"
    maintenance = "MAINTENANCE"
    offline = "OFFLINE"

class Atm(Base):
    __tablename__ = "atm"
    id: Mapped[int] = mapped_column(primary_key=True)
    serial_number: Mapped[int] = mapped_column()
    model: Mapped[str] = mapped_column(String(30))
    status: Mapped[Status] = mapped_column(SQLEnum(Status))
    cash_level: Mapped[int] = mapped_column()

    branch_id: Mapped[int] = mapped_column(ForeignKey("branch.id"))
    technician_id: Mapped[int] = mapped_column(ForeignKey("technician.id"))

    branch: Mapped["Branch"] = relationship(back_populates="atms")

    technician: Mapped["Technician"] = relationship(back_populates="atms")

    service_calls: Mapped["Service_call"] = relationship(back_populates="atm")
