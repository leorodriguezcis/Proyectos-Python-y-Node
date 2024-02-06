from typing import Any, List

from src.utils.utils import TaskStatus
from src.entities.base_entity import Base, BaseEntity
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from sqlalchemy.orm import relationship


class FileEntityGroup (Base, BaseEntity):
    __tablename__ = "file_group"
    id = Column(Integer, primary_key=True, autoincrement=True)
    status_docs: TaskStatus = Column(
        String(length=60), nullable=False, default=TaskStatus.PROCESSING.name
    )
   
    files = relationship("FileEntity", back_populates="group")

    @property
    def group_id(self) -> int:
        return self.id

    def to_dict(self) -> dict[str, Any]:
        # Crear un diccionario con los valores de las columnas
        return {
            "group_id": self.id,
            "status_docs": self.status_docs,
            "files": self.files,
        }

    