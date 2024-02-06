from pydantic import BaseModel


class DocumentInfoResponse(BaseModel):
    url: str
    filename: str
    id: int

class UrlsDocumentInfoResponse(BaseModel):
    files: list[DocumentInfoResponse]
    group_id: int