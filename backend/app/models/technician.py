from app.models.base import Base
from typing import List
from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from sqlalchemy import ForeignKey

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .atm import Atm
    from .branch import Branch
    from .servicecall import Service_call

class Technician(Base):
    __tablename__ = "technician"

    id: Mapped[int] = mapped_column(primary_key=True)
    branch_id: Mapped[int] = mapped_column(ForeignKey("branch.id"))
    atms: Mapped[List["Atm"]] = relationship(back_populates="technician")
    branch: Mapped["Branch"] = relationship(back_populates="technicians")

    service_calls: Mapped[List["Service_call"]] = relationship(back_populates="technician")