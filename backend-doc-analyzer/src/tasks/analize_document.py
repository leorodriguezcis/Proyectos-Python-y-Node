from typing import List
from src.celery_app import get_celery_app
from src.dto.requests.task_request import TaskRequest, TaskRequestGroupFile
from src.services.document_analizer_service import DocumentAnalizerService
from fastapi import UploadFile

celery_app = get_celery_app()
document_analizer_service = DocumentAnalizerService()


@celery_app.task(name="analize_document", rate_limit="15/s")
def analize_documents(documents: List[UploadFile], register_task_result: TaskRequestGroupFile) -> TaskRequestGroupFile:
    """Analiza el documento y guarda los resultados en el blob storage

    Args:
        document (UploadFile): documento a analizar
    """
    return document_analizer_service.analize_documents(
        documents=documents, register_task_result=register_task_result
    )
    
@celery_app.task(name="upload_documents", rate_limit="15/s")
def upload_documents_group(documents: List[UploadFile], register_task_result: TaskRequestGroupFile) -> TaskRequestGroupFile:
    return document_analizer_service.upload_documents(documents, register_task_result=register_task_result)

@celery_app.task(name="re_train_group", rate_limit="15/s")
def re_train_group(register_task_result: TaskRequestGroupFile) -> TaskRequestGroupFile:
    return document_analizer_service.re_train_group( register_task_result=register_task_result)
