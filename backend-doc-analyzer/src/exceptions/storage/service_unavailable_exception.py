from typing import Any
from src.exceptions.storage.core_storage_exception import CoreStorageException
from fastapi import status


class ServiceUnavailableException(CoreStorageException):
    def __init__(self, detail: Any = None) -> None:
        super().__init__(status.HTTP_503_SERVICE_UNAVAILABLE, detail)