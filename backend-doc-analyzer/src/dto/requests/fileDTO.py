from pydantic import BaseModel
from typing import List, TypedDict


class FileIDSDTO(BaseModel):
    files_delete: List[str]