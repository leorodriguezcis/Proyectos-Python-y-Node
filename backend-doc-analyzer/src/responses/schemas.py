from pydantic import BaseModel
from pydantic.typing import Optional


class ErrorSchema(BaseModel):
    detail: Optional[str]
