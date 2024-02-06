from typing import List
from src.entities.file_entity_group import FileEntityGroup
from src.services.chatbot_files_service import ChatBotFileService
from fastapi import HTTPException, UploadFile
from src.dto.requests.task_request import TaskRequest, TaskRequestGroupFile
from src.utils.utils import TaskStatus
from src.entities.file_entity import FileEntity
from src.services.backend_bot_service import BackEndBotService


class TaskService:
    _instance = None

    def __init__(
        self,
        backend_bot_service: BackEndBotService,
        chatbot_file_service: ChatBotFileService,
    ) -> None:
        self._backend_bot_service = backend_bot_service
        self._chatbot_file_service = chatbot_file_service

    def register_task(
        self, document: UploadFile
    ) -> TaskRequest:
        """Registra el documento en la base de datos"""
        file_entity: FileEntity = self._chatbot_file_service.create_model(
            file_name=document.filename
        )
        return TaskRequest(**file_entity.to_dict())
    
    def register_group(self, documents: List[UploadFile]) -> TaskRequestGroupFile:
        file_entity_group: FileEntityGroup = self._chatbot_file_service.create_model_group(
            files=documents
        )
        return TaskRequestGroupFile(**file_entity_group.to_dict())


    def update_task(
        self, task: TaskRequest
    ) -> TaskRequest:
        """Actualiza el estado de la tarea"""
        file_entity: FileEntity = self._chatbot_file_service.update_status(
            status=TaskStatus.COMPLETED.name, doc_id=task["doc_id"]
        )
        return self._notify(file_entity=file_entity, callback=task["callback"])
    
    def update_task_group(
        self, task: TaskRequestGroupFile
    ) -> TaskRequestGroupFile:
        """Actualiza el estado del group file"""
        file_entity: FileEntityGroup = self._chatbot_file_service.update_status_group(
            status=TaskStatus.COMPLETED.name, group_id=task["group_id"]
        )
        self._chatbot_file_service.update_files_status(status=TaskStatus.COMPLETED.name, files=file_entity.files)
        
        return self._notify(file_entity=file_entity, callback=task["callback"])

    def fail_task(
        self, task: TaskRequest
    ) -> TaskRequest:
        """Actualiza el estado de la tarea"""
        file_entity: FileEntity = self._chatbot_file_service.update_status(
            status=TaskStatus.FAILED.name, doc_id=task["doc_id"]
        )
        return self._notify(file_entity=file_entity, callback=task["callback"])

    def fail_task_group(self, task: TaskRequestGroupFile) -> TaskRequestGroupFile:
        """Actualiza el estado del grupo"""
        file_entity: FileEntityGroup = self._chatbot_file_service.update_status_group(
            status=TaskStatus.FAILED.name, group_id=task["group_id"]
        )
        return self._notify(file_entity=file_entity, callback=task["callback"])
    
    def _notify(self, file_entity: FileEntityGroup, callback: str) -> TaskRequestGroupFile:
        task_response = TaskRequestGroupFile(**file_entity.to_dict())
        self._backend_bot_service.notify(
            content={"group_id": file_entity.group_id, "status_docs":file_entity.status_docs}, callback=callback
        )
        return task_response
    
    
    def register_update_document(
        self, documents: List[UploadFile], group_id: int
    ) -> TaskRequestGroupFile:
        self._chatbot_file_service.update_status_group(
            status=TaskStatus.PROCESSING.name, group_id=group_id, 
        )
        group = self._chatbot_file_service.update_group_file(files=documents, group_id=group_id)
        """Actualiza el grupo de documentos"""
        return TaskRequestGroupFile(**group.to_dict())
    
    def update_task_group_documents_preload(self, task: TaskRequestGroupFile) -> TaskRequestGroupFile:
        """Actualiza el estado del grupo"""
        group: FileEntityGroup = self._chatbot_file_service.update_status_group(
            status=TaskStatus.COMPLETED.name, group_id=task["group_id"]
        )
        self._chatbot_file_service.update_files_status(status=TaskStatus.PRELOADED.name, files=task["files"])
        return self._notify(file_entity=group, callback=task["callback"])
    
    def register_retrain_task(
        self, doc_id: int, callback: str
    ) -> TaskRequest:
        """Registra el documento en la base de datos"""
        file_entity: FileEntity = self._chatbot_file_service.find_file(doc_id=doc_id)
        if file_entity.status != TaskStatus.FAILED.name:
            raise HTTPException(status_code=422, detail="Document is not failed")
        file_entity = self._chatbot_file_service.update_status(
            status=TaskStatus.PROCESSING.name, doc_id=doc_id
        )
        return self._notify(file_entity=file_entity, callback=callback)
        
    def register_retrain_group(
        self, group_id: int, callback: str
    ) -> TaskRequestGroupFile:
        """Registra el reentrenamiento del grupo"""
        file_entity_group: FileEntityGroup = self._chatbot_file_service.find_group(group_id=group_id)
        if not(file_entity_group.status_docs != TaskStatus.FAILED.name or not self._check_is_preloaded(file_entity_group.files)):
            raise HTTPException(status_code=422, detail="Group is not failed")
        self._chatbot_file_service.update_files_status_if_preloaded(status=TaskStatus.PROCESSING.name, files=file_entity_group.files)
        file_entity_group = self._chatbot_file_service.update_status_group(
            status=TaskStatus.PROCESSING.name, group_id=group_id
        )
        return self._notify(file_entity=file_entity_group, callback=callback)
    
    def _check_is_preloaded(self, files: List[FileEntity]) -> bool:
        """Check if the files are preloaded"""
        res = False
        for file in files:
            res = res or file.status == TaskStatus.PRELOADED.name
            
        return res
    
    def register_delete_document(
        self, group_id: int, doc_id: int
    ) -> TaskRequestGroupFile:
        """Registra el documento en la base de datos"""
        file_entity: FileEntityGroup = self._chatbot_file_service.delete_file(doc_id=doc_id, group_id=group_id)
        
        return TaskRequestGroupFile(**file_entity.to_dict())   
    
    def register_delete_group(
        self, group_id: int
    ):
        """Borra el Group"""
        self._chatbot_file_service.delete_group(group_id=group_id)
        
    
    @classmethod
    def get_instance(cls) -> "TaskService":
        if cls._instance is None:
            backend_bot_service = BackEndBotService.instance()
            chatbot_file_service = ChatBotFileService.instance()
            cls._instance = TaskService(
                backend_bot_service=backend_bot_service,
                chatbot_file_service=chatbot_file_service,
            )
        return cls._instance
