from typing import Optional
from pydantic import BaseModel
from src.dto.responses.document_data import DocumentData

class Document(BaseModel):
    model_id: str
    url: str
    blob_name: str
    container: str
    pages: Optional[str] = None

    @staticmethod
    def from_data(doc_data: DocumentData)->'Document':
        return Document(
            model_id=doc_data["model_id"],
            url=doc_data["url_document"],
            blob_name=doc_data["name"],
            container=doc_data["container"],
        )
