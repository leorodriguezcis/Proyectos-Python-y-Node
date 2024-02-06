from pydantic import BaseModel



class DocumentData(BaseModel):
   model_id: str
   url_document: str
   name: str
   container: str
   pages: str | None
