from functools import lru_cache
from io import BytesIO
from typing import Any, List

from src.services.chromadb_service import ChromaService

from src.entities.file_entity import FileEntity
from fastapi import UploadFile
from src.config import TOKEN_BUDGET
import openai
from src.dto.requests.task_request import TaskRequest, TaskRequestGroupFile
from src.services.azure_storage_service import AzureStorageService
from src.services.docs_recognizer_service import DocsRecognizerService
from src.services.form_recognizer_service import FormRecognizerService
from src.services.gpt_base import GPTBase
import pandas as pd
from src.dto.requests.document import Document
from src.services.sections_embedding_service import SectionsEmbeddingService
from src.utils.utils import num_tokens
from src.decorators.map_exceptions import exceptions_mapped, map_exceptions
from src.exceptions.task.service_unavailable_exception import (
    ServiceUnavailableException,
)
from openai.error import OpenAIError
from tenacity import retry, stop_after_attempt, wait_exponential
from langchain.docstore.document import Document as DocumentLangChain
from langchain.text_splitter import RecursiveCharacterTextSplitter

Embedding = List[float]


@map_exceptions(
    target_exception=ServiceUnavailableException(detail="Document analizer Error")
)
class DocumentAnalizerService(GPTBase):
    def __init__(self) -> None:
        super().__init__()
        self._sections_embedding_service = SectionsEmbeddingService()
        self._azure_storage_service = AzureStorageService()
        self._form_recognizer_service = FormRecognizerService()
        self._docs_recognizar_service = DocsRecognizerService()
        self._chroma = ChromaService()

    def faq(self) -> List[str]:
        """
        Returns:
            list[str]: a list which contains frecuently asked questions
        """
        return [
            "¿De qué temas se habla en la comunicación?. Responder en bullet points",
            "¿Cuál es el título de esta comunicación?",
            "¿Qué normas se derogan en la comunicación?",
            "¿Cuándo entra en vigencia esta comunicación?",
            "Redacta un resumen detallado del documento",
        ]

    def read_dataframe(self, path: str) -> pd.DataFrame:
        """Lee el csv del directorio proporcionado y convierte la columna de 'Embeddings' al formato adecuado

        Args:
            path (str): directorio donde esta el csv

        Returns:
            pd.DataFrame: dataframe con columna de Embeddings en el formato adecuado
        """
        ## Leer los datos
        return pd.read_csv(path)

    def dataframe_to_bytes(self, df: pd.DataFrame) -> bytes:
        """Convierte el dataframe en bytes

        Args:
            df (pd.DataFrame): dataframe a guardar
        """
        buffer = BytesIO()
        df.to_pickle(buffer)
        return buffer.getvalue()

    @lru_cache(maxsize=None)
    def read_dataframe_bytes(self, bts: bytes) -> pd.DataFrame:
        """Lee un dataframe en bytes y lo convierte en un dataframe

        Args:
            bytes (bytes): dataframe en bytes

        Returns:
            pd.DataFrame: un dataframe
        """
        buffer = BytesIO(bts)
        return pd.read_pickle(buffer)

    # Define una función que hace preguntas a GPT-3 y devuelve la respuesta

    @retry(
        stop=stop_after_attempt(3),  # Número máximo de reintentos
        wait=wait_exponential(),  # Espera exponencial entre reintentos
        reraise=False,  # Vuelve a lanzar la excepción si falla
        retry_error_callback=lambda _: "En este momento estoy ocupado consulta nuevamente más tarde",
    )
    async def gpt_response(self, *args, **kwargs) -> str:
        try:
            return self._chroma.reformula(*args)
        except OpenAIError as e:
            raise e

    @exceptions_mapped
    def analize_documents(
        self, documents: List[UploadFile], register_task_result: TaskRequestGroupFile
    ) -> TaskRequestGroupFile:
        result_list = self._upload_storage_documents(documents, register_task_result)
        docs = self._langchain_chunk(result_list)
        self._chroma.add_documents(docs,register_task_result["group_id"])
        return register_task_result
    
    @exceptions_mapped
    def upload_documents(
        self, documents: List[UploadFile], register_task_result: TaskRequestGroupFile
    ) -> TaskRequestGroupFile:
        self._upload_storage_documents(documents, register_task_result)
        return register_task_result
    
    @exceptions_mapped
    def re_train_group(
        self, register_task_result: TaskRequestGroupFile
    ) -> TaskRequestGroupFile:
        self.read_dataframe_bytes.cache_clear()
        files: List[UploadFile] = self._get_files_from_azure(register_task_result["files"])
        return self.analize_documents(
            documents=files, register_task_result=register_task_result
        )
        
    def _get_files_from_azure(self, files: List[FileEntity]) -> List[UploadFile]:
        list_files = []
        for file in files:
            document = self._azure_storage_service.get(
                file_name=str(file.id), container_name="documentos"
            )
            
            list_files.append(
                UploadFile(
                    filename=file.display_name,
                    file=BytesIO(initial_bytes=document)
                    )
            )
        return list_files
    
        
    def _upload_storage_documents(self, documents: List[UploadFile], register_task_result: TaskRequestGroupFile) -> List[Any]:
        files = register_task_result["files"]
        result_list = []
        for i in range(len(documents)):
            file = files[i]
            if file.status == "COMPLETED":
                continue    
            self._azure_storage_service.upload(
                file_name=str(file.id),
                file=documents[i].file.read(),
                container_name="documentos",
                content_type=documents[i].content_type,
            )
            sas_url: str = self._azure_storage_service.get_sas_url(
                file_name=str(file.id), container_name="documentos"
            )
            content_type = documents[i].content_type

            if (
                content_type == "application/msword"
                or content_type
                == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ):
                result_list.append(
                    DocumentLangChain(
                        page_content=self._docs_recognizar_service.analyze_document(
                            document=documents[i]
                        ),
                        metadata={"file_tag": str(file.id)},
                    )
                )
            else:
                result_list.append(
                    DocumentLangChain(
                        page_content=self._form_recognizer_service.analyze_document(
                            document=Document(
                                model_id="prebuilt-document",
                                url=sas_url,
                                blob_name=str(file.id),
                                container="documentos",
                            )
                        )["content"],
                        metadata={"file_tag": str(file.id)},
                    )
                )    
        return result_list
    
    def _langchain_chunk(self, docs):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1500, chunk_overlap=150
        )
        return text_splitter.split_documents(docs)
