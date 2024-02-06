from typing import Any
from fastapi import status
from src.exceptions.task.task_exception import TaskException


class BadRequestException(TaskException):
    def __init__(self, detail: Any = None) -> None:
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)