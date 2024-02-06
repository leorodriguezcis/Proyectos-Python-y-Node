from typing import Optional
from celery import Celery
from src.settings.celery_settings import celery_settings
from src.config import CELERY_BROKER_URL, CELERY_BACKEND_URL

APP_NAME = "chatbot-gpt"
celery_app: Optional[Celery] = None


def _create_celery_app() -> Celery:
    return Celery(
        main=APP_NAME,
        broker=CELERY_BROKER_URL,
        backend=CELERY_BACKEND_URL,
    )


def _discover_tasks(celery_app: Celery) -> None:
    celery_app.autodiscover_tasks(packages=["src.tasks"])


def _config_app(celery_app: Celery) -> None:
    celery_app.config_from_object(obj=celery_settings)


def get_celery_app() -> Celery:
    global celery_app
    if celery_app is None:
        celery_app = _create_celery_app()
        _config_app(celery_app=celery_app)
        _discover_tasks(celery_app=celery_app)
    return celery_app


celery_app = get_celery_app()
