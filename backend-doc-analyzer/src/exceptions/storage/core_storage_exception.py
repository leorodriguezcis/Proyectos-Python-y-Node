from fastapi import HTTPException


class CoreStorageException(HTTPException):
    pass