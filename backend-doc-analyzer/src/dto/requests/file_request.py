from pydantic import BaseModel
from typing import List, TypedDict


class FileIDRequest(BaseModel):
    files: List[str]