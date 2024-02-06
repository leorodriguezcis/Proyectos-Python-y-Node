from typing import Type, TypeVar
from pydantic import BaseModel
from src.responses.schemas import ErrorSchema

ResponseModel = TypeVar("ResponseModel", bound=BaseModel)

auth_errors = {
    401: {
        "description": "Unauthorized",
        "model": ErrorSchema,
    },
}

bad_request = {
    400: {
        "description": "Bad Request",
        "model": ErrorSchema,
    },
}

not_found = {
    404: {
        "description": "User not Found",
        "model": ErrorSchema,
    },
}

validation = {
    415: {
        "description": "Invalid audio format",
        "model": ErrorSchema,
    },
}


def creation(model: Type[ResponseModel] = None, status_code: int = 200) -> dict:
    responses = {
        200: {
            "description": "Success",
            "model": model,
        },
    }

    return {status_code: responses[status_code]}


def created(
        model: Type[ResponseModel] = None, notfound: bool = False, status_code: int = 201
) -> dict:
    return {
        "status_code": 201,
        "response_model": model,
        "responses": {
            **auth_errors,
            **(not_found if notfound else {}),
            **validation,
            **bad_request,
            **creation(model, status_code),
        },
    }


def read(
        model: Type[ResponseModel] = None, status_code: int = 200
) -> dict:
    return {
        "status_code": 200,
        "response_model": model,
        "responses": {
            **auth_errors,
             **creation(model, status_code),
            **validation,
            **bad_request
        },
    }


def update(
        model: Type[ResponseModel] = None, notfound: bool = True, status_code: int = 200
) -> dict:
    return {
        "status_code": 200,
        "response_model": model,
        "responses": {
            **auth_errors,
            **(not_found if notfound else {}),
            **validation,
            **bad_request,
            **creation(model, status_code),
        },
    }


def delete(notfound: bool = False, status_code: int = 204) -> dict:
    return {
        "status_code": 204,
        "response_model": None,
        "responses": {
            **auth_errors,
            **(not_found if notfound else {}),
            **creation(status_code=status_code),
        },
    }
