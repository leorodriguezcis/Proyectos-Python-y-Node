from typing import Any, Dict, Optional
from src.exceptions.storage.core_storage_exception import CoreStorageException
from fastapi import status


class BadRequestException(CoreStorageException):
    def __init__(self, detail: Any = None) -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)