from typing import Any, List, Optional

from src.dto.requests.fileDTO import FileIDSDTO

from src.dto.requests.file_request import FileIDRequest

from src.services.task_service import TaskService
from src.exceptions.task.service_unavailable_exception import ServiceUnavailableException
from src.exceptions.storage.not_found_exception import NotFoundException
from src.services.chatbot_files_service import ChatBotFileService
from celery import chain
from fastapi import APIRouter, Body, File, UploadFile, Query, HTTPException
from pandas import DataFrame
from src.dto.requests.chat_requestDTO import ChatRequest
from src.dto.responses.document_info_response import DocumentInfoResponse, UrlsDocumentInfoResponse
from src.dto.responses.text_response_dto import TextResponseDTO
from src.dto.responses.upload_document_dto import UploadDocumentDTO, UploadGroupDocumentDTO
from src.responses.responses import read
from src.services.azure_storage_service import AzureStorageService
from src.services.document_analizer_service import DocumentAnalizerService
from src.services.speech_audio import SpeechAudio
from src.dto.responses.audio_response_dto import AudioResponseDTO
from src.exceptions.speech2text.speech2textError import SpeechToTextCanceledError
from src.tasks.analize_document import analize_documents, re_train_group, upload_documents_group
from src.tasks.manage_task import fail_task, fail_task_group, update_task, update_task_group,add_documents
from src.dto.requests.task_request import TaskRequest, TaskRequestGroupFile


router = APIRouter(prefix="/group", tags=["GPT Document Analizer "])
speech = SpeechAudio()
document_analizer = DocumentAnalizerService()
storage = AzureStorageService()
file_service = ChatBotFileService.instance()
task_service = TaskService.get_instance()

@router.post("/audio", **read(AudioResponseDTO))
async def add_audio_file(
    audio: UploadFile = File(...),
    locale=Query(
        default="en-US",
        enum=[
            "de-DE",
            "en-AU",
            "en-CA",
            "en-GB",
            "en-IN",
            "en-US",
            "es-ES",
            "es-MX",
            "fr-CA",
            "fr-FR",
            "it-IT",
            "ja-JP",
            "pt-BR",
            "zh-CN",
        ],
        required=True,
    ),
):
    if audio.content_type != "audio/wav":
        raise HTTPException(415, detail="Invalid audio format")
    try:
        result = await document_analizer.chat_audio(audio, locale)
        return result
    except SpeechToTextCanceledError:
        raise HTTPException(401, detail="invalid speech credentials")


@router.post("/text/{group_id}", **read(TextResponseDTO))
async def chat_text(chat: ChatRequest, group_id: str):
    try:
        return {"text": await document_analizer.gpt_response(chat.prompt, group_id)}
    except Exception as e:
        print(e)
        raise HTTPException(status_code=422, detail="Unprocessable Entity")


@router.get("/faq", **read(List[str]))
async def faq():
    return document_analizer.faq()


@router.post(path="/upload", **read(model=UploadGroupDocumentDTO))
async def upload_document(callback: str, documents: List[UploadFile] = File(default=...)) -> UploadGroupDocumentDTO:
    
    try:
        register_task_result = task_service.register_group(documents=documents)
        if callback is not None:
            register_task_result["callback"] = callback

        """Utiliza una chain de celery para procesar el documento y actualizar la tarea"""

        """
        Las chains de celery utilizan el resultado de la tarea anterior como argumento 
        de la siguiente tarea
        https://docs.celeryproject.org/en/stable/userguide/canvas.html#chains

        Por lo tanto, la tarea analize_document recibe como argumento 
        el resultado de la tarea register_task
        lo utiliza y lo devuelve. 

        La tarea fail_task, se hizo de forma inmutable con .si() 
        para que reciba el resultado de la tarea register_task
        y no use otros parametros
        """

        chain(
            analize_documents.s(documents, register_task_result),
            update_task_group.s(),
        ).apply_async(link_error=fail_task_group.si(register_task_result))

        return UploadGroupDocumentDTO(**register_task_result)
    except HTTPException as e:
        raise e
    except ServiceUnavailableException as e:
        raise e


@router.put(path="/retry/{group_id}")
async def re_train_group_entity(group_id: int, callback:str ) -> UploadGroupDocumentDTO:
    try:
        register_task_result: TaskRequestGroupFile = task_service.register_retrain_group(group_id=group_id, callback=callback)
        
        if callback is not None:
            register_task_result["callback"] = callback
            
        chain(
            re_train_group.s(register_task_result),
            update_task_group.s(),
        ).apply_async(link_error=fail_task_group.si(register_task_result))
        return UploadGroupDocumentDTO(**register_task_result)
    except HTTPException as e:
        raise e
    
@router.put(path="/add/{group_id}")
async def add_document_to_group(group_id: int, callback:str, documents:List[UploadFile]) -> Any:
    try:
        register_task_result: TaskRequestGroupFile = task_service.register_update_document(documents, group_id )
        if callback is not None:
            register_task_result["callback"] = callback
        chain(
            upload_documents_group.s(documents, register_task_result),
            add_documents.s(),
        ).apply_async(link_error=fail_task_group.si(register_task_result))
        return UploadGroupDocumentDTO(**register_task_result)
    except HTTPException as e:
        raise e
    
@router.delete(path="/{group_id}/delete/{doc_id}")
async def delete_document(group_id: int, doc_id: int) -> Any:
    try:
        register_task_result: TaskRequestGroupFile = task_service.register_delete_document(group_id, doc_id )

        chain(
            update_task_group.s(register_task_result),
        ).apply_async(link_error=fail_task_group.si(register_task_result))

        return UploadGroupDocumentDTO(**register_task_result)
    except HTTPException as e:
        raise e
    
# get document sas url
@router.get(path="/info/document/{doc_id}")
async def get_sas_url(doc_id: int) -> Any:
    file = file_service.find_file(doc_id=doc_id)
    url: str = storage.get_sas_url(file_name=str(object=doc_id), container_name="documentos")
    if file is None:
        raise NotFoundException(
            detail=f"File with id {doc_id} not found",
        )
    return DocumentInfoResponse(url=url, filename=file.display_name)
    
@router.get(path="/info/{group_id}")
async def get_sas_url_group(group_id: int) -> Any:
    file_group = file_service.find_group(group_id=group_id)
    urls = storage.get_sas_url_group(files=file_group.files, container_name="documentos")
    if file_group is None:
        raise NotFoundException(
            detail=f"File with id {group_id} not found",
        )
    
    return UrlsDocumentInfoResponse(files=urls, group_id=group_id)

@router.delete(path="/{group_id}")
async def delete_group(group_id: int) -> Any:
    try:
        task_service.register_delete_group(group_id)

        return {"message": "Group deleted"}
    except HTTPException as e:
        raise e