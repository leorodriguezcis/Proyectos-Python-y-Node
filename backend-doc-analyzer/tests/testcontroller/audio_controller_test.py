import pytest
from fastapi.testclient import TestClient
from fastapi import status
from src.app import app
from src.bootstrap import init_routes
import requests
class TestAudio:

    @pytest.fixture
    def client(self):
        init_routes(app)
        yield TestClient(app)

    @pytest.mark.order(1)
    def test_get_audio_chat_400(self,client:TestClient):
        response = client.post("/audio?locale=es-ES",headers={"Content-Type":"multipart/form-data"},files={"file": ("audio.wav","" )})
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert len(response.json()) == 1

    @pytest.mark.order(2)
    def test_get_audio_chat_200(self,client:TestClient):
        with open("audio_empty.wav","rb") as f:
            response = client.post("/audio?locale=es-ES",files={"audio":("audio",f,"audio/wav")})
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) == 3

    @pytest.mark.order(3)
    def test_get_audio_chat_422(self,client:TestClient):
        
        response = client.post("/audio?locale=es-ES",headers={"Content-Type":""},files={"file": ""})
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert len(response.json()) == 1

    @pytest.mark.order(4)
    def test_get_audio_chat_invalid_format_415(self,client:TestClient):
        with open("audio_empty.wav","rb") as f:
            response = client.post("/audio?locale=es-ES",files={"audio":("audio",f,"image/webp")})
        
        assert response.status_code == status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
        assert len(response.json()) == 1
