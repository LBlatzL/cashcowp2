from app.models.base import Base
from typing import List
from sqlalchemy import String
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship

from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from .atm import Atm
    from .technician import Technician

class Branch(Base):
    __tablename__="branch"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(30))
    location_region: Mapped[str] = mapped_column(String(30))
    capacity: Mapped[int] = mapped_column()
    supervisor_id: Mapped[int] = mapped_column()

    atms: Mapped[List["Atm"]] = relationship(back_populates="branch")
    technicians: Mapped[List["Technician"]] = relationship(back_populates="branch")