from pydantic import BaseSettings


class CelerySettings(BaseSettings):
    task_serializer: str = "pickle"
    result_serializer: str = "pickle"
    accept_content: list[str] = ["application/json", "application/x-python-serialize"]
    result_accept_content: list[str] = [
        "application/json",
        "application/x-python-serialize",
    ]
    

celery_settings = CelerySettings()
