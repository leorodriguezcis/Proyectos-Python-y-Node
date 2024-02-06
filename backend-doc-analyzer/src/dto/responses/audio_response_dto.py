from pydantic import BaseModel


class AudioResponseDTO(BaseModel):
    user_text:str
    ai_text:str
    audio:str