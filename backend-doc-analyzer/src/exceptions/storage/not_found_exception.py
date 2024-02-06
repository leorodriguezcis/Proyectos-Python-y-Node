from typing import Any
from fastapi import status
from src.exceptions.storage.core_storage_exception import CoreStorageException


class NotFoundException(CoreStorageException):
    def __init__(self, detail: Any = None) -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail)
