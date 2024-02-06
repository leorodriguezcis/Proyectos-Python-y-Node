from typing import Any
from src.exceptions.task.task_exception import TaskException
from fastapi import status


class ServiceUnavailableException(TaskException):
    def __init__(self, detail: Any = None) -> None:
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)