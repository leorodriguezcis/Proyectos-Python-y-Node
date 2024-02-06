import json
from fastapi import HTTPException
from requests import Session
from src.dto.requests.task_request import TaskRequestGroupFileNotify


class BackEndBotService:
    _instance = None

    def __init__(self, http_client: Session) -> None:
        self._http_client = http_client

    def notify(self, content: TaskRequestGroupFileNotify, callback:str) -> None:
        """Notify the backend that a task has been completed"""
        try:
            self._http_client.post(
                url=callback,
                json=content,
            )
        except Exception as e:
            print("Error notifying backend",e)
            print("Error notifying backend")

    @classmethod
    def instance(cls) -> "BackEndBotService":
        """Singleton instance"""
        if not cls._instance:
            http_client = Session()
            cls._instance = cls(
                http_client=http_client,
            )
        return cls._instance
