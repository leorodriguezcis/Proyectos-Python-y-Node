from fastapi import APIRouter, File, UploadFile, Query, HTTPException
from src.dto.requests.chat_requestDTO import ChatRequest
from src.dto.responses.text_response_dto import TextResponseDTO
from src.responses.responses import read
from src.services.speech_audio import SpeechAudio
from src.services.gpt3_bot_service import GPT3BotService
from src.responses.responses import read
from src.dto.responses.audio_response_dto import  AudioResponseDTO
from src.exceptions.speech2text.speech2textError import SpeechToTextCanceledError


router = APIRouter(prefix="/chat", tags=["Chat GPT Bot "])
speech = SpeechAudio()
gpt3_bot = GPT3BotService()


@router.post("/audio",**read(AudioResponseDTO))
async def add_audio_file(audio: UploadFile = File(...),
                        locale=Query(default="en-US", enum=["de-DE","en-AU","en-CA","en-GB","en-IN","en-US","es-ES","es-MX","fr-CA","fr-FR","it-IT","ja-JP","pt-BR","zh-CN"], required=True)):
   
    if (audio.content_type != "audio/wav"):
        raise HTTPException(415, detail="Invalid audio format")
    try:
        result = await gpt3_bot.chat_audio(audio, locale)
        return result
    except SpeechToTextCanceledError :
        raise HTTPException(401,detail="invalid speech credentials")
    
@router.post("/text",**read(TextResponseDTO))
async def chat_text(chat:ChatRequest):
        result = await gpt3_bot.gpt_response(chat.prompt)
        return {"text":result}

     
    
#@router.get("/voices")
#async def get_available_voices(locale=Query(default="en-US", enum=["de-DE","en-AU","en-CA","en-GB","en-IN","en-US","es-ES","es-MX","fr-CA","fr-FR","it-IT","ja-JP","pt-BR","zh-CN"], required=True)):
#    return await speech.get_available_voices(locale)
