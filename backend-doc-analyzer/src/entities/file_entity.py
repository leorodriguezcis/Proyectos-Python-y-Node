from typing import Any

from src.entities.base_entity import Base, BaseEntity
from sqlalchemy import Column, Integer, String, ForeignKey
from src.utils.utils import TaskStatus
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import relationship
from src.entities.file_entity_group import FileEntityGroup


class FileEntity(Base, BaseEntity):
    __tablename__ = "file"
    id = Column(Integer, primary_key=True, autoincrement=True)
    display_name: str = Column(String(100), nullable=False, unique=False)
    status: TaskStatus = Column(
        String(length=60), nullable=False, default=TaskStatus.PROCESSING.name
    )
    id_vector: str = Column(String(100), nullable=True, unique=False)
    
    group_id = Column(Integer, ForeignKey('file_group.id'))
    
    group =  relationship("FileEntityGroup", back_populates="files")
  # Clave externa


    @property
    def doc_id(self) -> int:
        return self.id

    def to_dict(self) -> dict[str, Any]:
        # Crear un diccionario con los valores de las columnas
        return {
            "id": self.id,
            "display_name": self.display_name,
            "status": self.status,
            "doc_id": self.doc_id,
            "id_vector": self.id_vector,
        }

