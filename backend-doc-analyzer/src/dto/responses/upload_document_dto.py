from typing import Optional
from pydantic import BaseModel


class UploadDocumentDTO(BaseModel):
    doc_id: Optional[int]
    display_name: Optional[str]
    status: Optional[str]
    
class UploadGroupDocumentDTO(BaseModel):
    group_id: Optional[int]
    status_docs: Optional[str]