from typing import Any
from fastapi import status
from src.exceptions.task.task_exception import TaskException

class ServerErrorException(TaskException):
    def __init__(self, detail: Any = None) -> None:
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)
