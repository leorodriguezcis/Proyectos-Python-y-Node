from azure.ai.formrecognizer import DocumentAnalysisClient
from azure.core.exceptions import HttpResponseError
from azure.core.credentials import AzureKeyCredential
from src.decorators.map_exceptions import exceptions_mapped
from src.exceptions.task.service_unavailable_exception import ServiceUnavailableException
from src.decorators.map_exceptions import map_exceptions
from src.config import FORM_RECOGNIZER_ENDPOINT, FORM_RECOGNIZER_KEY
import re

from src.dto.requests.document import Document


@map_exceptions(target_exception=ServiceUnavailableException(detail="Form recognizer Error"))
class FormRecognizerService:
    _instance = None
    def __init__(self):
        self.endpoint = FORM_RECOGNIZER_ENDPOINT
        self.key = FORM_RECOGNIZER_KEY
        self.client = DocumentAnalysisClient(
            endpoint=self.endpoint, credential=AzureKeyCredential(self.key)
        )

    @exceptions_mapped
    def analyze_document(self, document: Document) -> dict:
        if not self.__validate_pages_formated(pages=document.pages):
            raise HttpResponseError(message="Invalid pages format")

        poller = self.client.begin_analyze_document_from_url(
            model_id=document.model_id, document_url=document.url, pages=document.pages
        )
        result = poller.result().to_dict()
        return result

    def __validate_pages_formated(self, pages: str | None) -> bool:
        if pages is None:
            return True

        page_regex = r"^(\d+(-\d+)?(,\s*\d+(-\d+)?)*|\d+)$"
        return re.match(pattern=page_regex, string=pages) is not None

    @staticmethod
    def get_instance() -> "FormRecognizerService":
        if FormRecognizerService._instance is None:
            FormRecognizerService._instance = FormRecognizerService()
        return FormRecognizerService._instance
