from abc import ABC, abstractmethod
import base64

import openai
from src.config import OPENAI_API_TYPE, OPENAI_API_URL, OPENAI_API_VERSION, OPENAI_CHAT_ENGINE, OPENAI_CHAT_MODEL, OPENAI_KEY

from src.exceptions.speech2text.speech2textError import SpeechToTextNoMatchError
from src.services.speech_audio import SpeechAudio


class GPTBase(ABC):

    def __init__(self):
        openai.api_key = OPENAI_KEY  
        openai.api_base =  OPENAI_API_URL
        openai.api_type = OPENAI_API_TYPE
        openai.api_version = OPENAI_API_VERSION
        self._chat_model = OPENAI_CHAT_MODEL
        self._chat_engine= OPENAI_CHAT_ENGINE
        self.speech_service= SpeechAudio()
    
    def write_audio(self,audio,path:str="audio.wav")->None:
        """write an audio in file path"""
        audio_bytes:bytes=audio.file.read()
        with open(path,"wb") as f:
                f.write(audio_bytes)

    async def chat_audio(self, audio, language:str):
        try:
            self.write_audio(audio)
            text: str = await self.speech_service.speech_recognize(language)
            text_reply= await self.gpt_response(text)
            return await self.encode_and_syntetize_audio_with_text(text,text_reply,language)
        except (SpeechToTextNoMatchError,Exception)as e  :
            print(e)
            text_error = "Lo siento no pude escucharte, ¿Puedes repetirmelo?"
            return await self.encode_and_syntetize_audio_with_text(".",text_error,language)

    async def encode_and_syntetize_audio_with_text(self,text:str,text_reply:str,language:str,voice_name:str='es-ES-ElviraNeural'):
        _ ,audio = await self.speech_service.recognize_text_and_syntetize(text_reply,language,voice_name)
        encoded_audio=base64.b64encode(audio)
        return {"user_text":text, "ai_text":text_reply, "audio":str(encoded_audio,"ascii","ignore") }
    

    @abstractmethod
    async def gpt_response(self, *args,**kwargs)->str:
        raise NotImplemented


   