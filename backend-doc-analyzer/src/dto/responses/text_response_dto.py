from pydantic import BaseModel


class TextResponseDTO(BaseModel):    
    text: str