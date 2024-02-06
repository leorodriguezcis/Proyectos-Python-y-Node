from typing import List, Optional, TypedDict
from enum import Enum
from src.utils.utils import TaskStatus
from src.entities.file_entity import FileEntity

class TaskRequest(TypedDict):
    doc_id: int
    display_name: str
    status: TaskStatus
    callback: Optional[str]

class TaskRequestGroupFile(TypedDict):
    group_id: int
    status_docs: TaskStatus
    callback: Optional[str]
    files: List[FileEntity]

class TaskRequestGroupFileNotify(TypedDict):
    group_id: int
    status_docs: TaskStatus