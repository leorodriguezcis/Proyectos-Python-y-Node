from typing import List, Optional

from src.services.chromadb_service import ChromaService
from src.services.azure_storage_service import AzureStorageService

from fastapi import UploadFile

from src.entities.file_entity import FileEntity
from src.entities.file_entity_group import FileEntityGroup
from src.services.session_service import SessionService
from src.utils.utils import TaskStatus
from sqlalchemy.orm import Session
from src.exceptions.storage.not_found_exception import NotFoundException
from src.decorators.map_exceptions import exceptions_mapped,map_exceptions
from src.exceptions.task.service_unavailable_exception import ServiceUnavailableException

@map_exceptions(target_exception=ServiceUnavailableException(detail="ChatBot File Table Error"))
class ChatBotFileService:
    _instance: Optional["ChatBotFileService"] = None
    
    def __init__(self, session_service: SessionService) -> None:
        self._session_service = session_service
        self._azure_storage_service = AzureStorageService()
        self._chroma = ChromaService()
        
    @exceptions_mapped    
    def update_status(self, status: str, doc_id:int, super_session: Optional[Session] = None) -> FileEntity:
        """Update the status of the file"""
        self._validate_status(status=status)
        session: Session = self._session_service.session(super_session=super_session)
        file_entity: FileEntity = self.find_file(doc_id=doc_id, super_session=session)
        file_entity.status = status
        self._session_service.commit(super_session=super_session, session=session)
        session.refresh(instance=file_entity)
        return file_entity
    
    @exceptions_mapped    
    def update_status_group(self, status: str, group_id:int, super_session: Optional[Session] = None) -> FileEntityGroup:
        """Update the status of the file_group"""
        self._validate_status(status=status)
        session: Session = self._session_service.session(super_session=super_session)
        file_entity_group: FileEntityGroup = self.find_group(group_id=group_id, super_session=session)
        file_entity_group.status_docs = status
        self._session_service.commit(super_session=super_session, session=session)
        session.refresh(instance=file_entity_group)
        return file_entity_group
    
    def update_files_status(self, status, files: List[FileEntity], super_session: Optional[Session] = None) -> None:
        """Update the status of the files"""
        for file in files:
            self.update_status(status=status, doc_id=file.id, super_session=super_session)
        
    
    @exceptions_mapped
    def update_group_file(self, files: List[UploadFile], group_id:int ,super_session: Optional[Session] = None) -> FileEntityGroup:
        session: Session = self._session_service.session(super_session=super_session)
        file_res: List[FileEntity] = self.create_files(files, super_session=session) 
        group: FileEntityGroup = self.find_group(group_id=group_id, super_session=session)
        files: List[FileEntity] = group.files
        group.files = files + file_res
        session.add(instance=group)
        self._session_service.commit(super_session=super_session, session=session)
        session.refresh(instance=group)
        return self._group_with_last_file(group, len(files))
    
    def _group_with_last_file(self, group: FileEntityGroup, len:int) -> FileEntityGroup:
        """Return the group with the last file"""
        files = group.files
        group.files = files[len:]
        return group
    
    def create_files(self, files: List[UploadFile], super_session: Optional[Session] = None) -> List[FileEntity]:
        """Create the files"""
        new_files = []
        for file in files:
            new_files.append(self.create_model(file_name=file.filename, super_session=super_session))
        return new_files
    
   
              
    def delete_file(self, doc_id:int,group_id:int, super_session: Optional[Session] = None) -> FileEntityGroup:
        """Delete the file"""
        session: Session = self._session_service.session(super_session=super_session)
        self._chroma.chroma_delete_files(doc_id,group_id)
        group = self.find_group(group_id=group_id, super_session=session)
        self._azure_storage_service.delete(file_name=str(object=doc_id), container_name="documentos")
        session: Session = self._session_service.session(super_session=session)
        file_entity: FileEntity = self.find_file(doc_id=int(doc_id), super_session=session)
        session.delete(instance=file_entity)
        self._session_service.commit(super_session=super_session, session=session)
        session.refresh(instance=group)
        return group
    
    def delete_files(self, group_id: int, files: List[FileEntity], super_session: Optional[Session] = None) -> None:
        """Delete the files"""
        for file in files:
            self.delete_file(file.id, group_id, super_session=super_session)
        
    def _validate_status(self, status: str) -> None:
        """Validate the status of the file"""
        if status not in TaskStatus.__members__:
            raise ValueError("Invalid status")

    @exceptions_mapped
    def find_file(
        self, doc_id: int, super_session: Optional[Session] = None
    ) -> FileEntity:
        """Busca una tarea por id"""
        session: Session = self._session_service.session(super_session=super_session)
        file: Optional[FileEntity] = session.get(entity=FileEntity, ident=doc_id)
        if file is None:
            raise NotFoundException(
                detail=f"File with id {doc_id} not found",
            )
        return file   
    
     
    @exceptions_mapped
    def find_group(
        self, group_id: int, super_session: Optional[Session] = None
    ) -> FileEntityGroup:
        """Busca un grupo por id"""
        session: Session = self._session_service.session(super_session=super_session)
        group: Optional[FileEntityGroup] = session.get(entity=FileEntityGroup, ident=group_id)
        if group is None:
            raise NotFoundException(
                detail=f"File with id {group_id} not found",
            )
        return group
    
    @exceptions_mapped
    def create_model(self, file_name: str, super_session: Optional[Session] = None) -> FileEntity:
        """Create a new chatbot file model"""
        session: Session = self._session_service.session(super_session=super_session)
        file_entity = FileEntity(display_name=file_name)
        session.add(instance=file_entity)
        session.flush()
        self._session_service.commit(super_session=super_session, session=session)
        session.refresh(instance=file_entity)
        return file_entity
    
    @exceptions_mapped
    def create_model_group(self, files: List[UploadFile], super_session: Optional[Session] = None) -> FileEntityGroup:
        session: Session = self._session_service.session(super_session=super_session)
        group_files = self.create_files(files=files, super_session=session)
        file_entity_group = FileEntityGroup(files=group_files)
        session.add(instance=file_entity_group)
        session.flush()
        self._session_service.commit(super_session=super_session, session=session)
        session.refresh(instance=file_entity_group)
        return file_entity_group
        
    @classmethod
    def instance(cls) -> "ChatBotFileService":
        if cls._instance is None:
            session_service = SessionService.instance()
            cls._instance = cls(
                session_service=session_service,
            )
        return cls._instance
    
    def delete_group (self, group_id:int, super_session: Optional[Session] = None) -> None:
        """Delete the group"""
        session: Session = self._session_service.session(super_session=super_session)
        group: FileEntityGroup = self.find_group(group_id=group_id, super_session=session)
        self.delete_files(group_id=group_id, files=group.files, super_session=session)
        session.delete(instance=group)
        self._session_service.commit(super_session=super_session, session=session)
        self._chroma.chroma_delete_colection(group_id)
        
        return None
    
    def update_files_status_if_preloaded(self, status, files: List[FileEntity], super_session: Optional[Session] = None) -> None:
        """Update the status of the files"""
        for file in files:
            if file.status == TaskStatus.PRELOADED.name:
                self.update_status(status=status, doc_id=file.id, super_session=super_session)
    
    