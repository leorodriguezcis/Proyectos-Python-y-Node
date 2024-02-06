from typing import List
from fastapi import UploadFile
from src.celery_app import get_celery_app
from src.dto.requests.task_request import TaskRequest, TaskRequestGroupFile
from src.services.task_service import TaskService

celery_app = get_celery_app()
task_service = TaskService.get_instance()


@celery_app.task(name="register_task")
def register_task(document: UploadFile) -> TaskRequest:
    """Registra el documento en la base de datos"""
    return task_service.register_task(document=document)

@celery_app.task(name="register_group")
def register_group(documents: List[UploadFile]) -> TaskRequestGroupFile:
    """Registra el documento en la base de datos"""
    return task_service.register_group(documents=documents)

@celery_app.task(name="update_task")
def update_task(task: TaskRequestGroupFile) -> TaskRequestGroupFile:
    """Actualiza el estado de la tarea"""
    return task_service.update_task(task=task)

@celery_app.task(name="update_group_task")
def update_task_group(task: TaskRequestGroupFile) -> TaskRequestGroupFile:
    """Actualiza el estado de group file"""
    return task_service.update_task_group(task=task)

@celery_app.task(name="add_documents")
def add_documents(task: TaskRequestGroupFile) -> TaskRequestGroupFile:
    """Actualiza el estado de group file"""
    return task_service.update_task_group_documents_preload(task=task)

@celery_app.task(name="fail_task")
def fail_task(task: TaskRequest) -> TaskRequest:
    """Actualiza el estado de la tarea a fallida"""
    return task_service.fail_task(task=task)

@celery_app.task(name="fail_task_group")
def fail_task_group(task: TaskRequestGroupFile) -> TaskRequestGroupFile:
    """Actualiza el estado de la tarea a fallida"""
    return task_service.fail_task_group(task=task)