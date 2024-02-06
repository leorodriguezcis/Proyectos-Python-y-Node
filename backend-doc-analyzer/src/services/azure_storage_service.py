from datetime import datetime, timedelta
from os import getenv
from typing import IO, Any, AnyStr, Dict, Iterable, List

from src.entities.file_entity import FileEntity
from azure.storage.blob import (
    BlobServiceClient,
    BlobClient,
    generate_blob_sas,
    AccountSasPermissions,
    ResourceTypes,
    ContentSettings,
)
from src.config import AZURE_STORAGE_CONNECTION_STRING
from src.decorators.map_exceptions import map_exceptions, exceptions_mapped
from src.exceptions.storage.service_unavailable_exception import (
    ServiceUnavailableException,
)


@map_exceptions(ServiceUnavailableException("Blob Storage Error"))
class AzureStorageService(object):
    @exceptions_mapped
    def __init__(self):
        self._connection_string = AZURE_STORAGE_CONNECTION_STRING
        self._blob_service_client = BlobServiceClient.from_connection_string(
            self._connection_string
        )

    @exceptions_mapped
    def upload(
        self,
        file_name: str,
        file: bytes | str | Iterable[AnyStr] | IO[AnyStr],
        container_name: str,
        content_type: str = None,
    ) -> Dict[str, Any]:
        blob_client = self._get_blob_client(file_name, container_name)
        self.delete(file_name, container_name)
        content_settings = ContentSettings(content_type=content_type)
        blob_client.upload_blob(data=file, content_settings=content_settings)

    @exceptions_mapped
    def delete(self, file_name: str, container_name: str) -> bool:
        blob_client = self._get_blob_client(file_name, container_name)
        if blob_client.exists():
            blob_client.delete_blob(delete_snapshots="include")
            return True
        return False

    @exceptions_mapped
    def get(self, file_name: str, container_name: str) -> bytes:
        blob_client = self._get_blob_client(file_name, container_name)
        return blob_client.download_blob().readall()
    @exceptions_mapped
    def get_content_type(self, file_name: str, container_name: str) -> str:
        blob_client = self._get_blob_client(file_name, container_name)
        return blob_client.get_blob_properties().content_settings.content_type

    @exceptions_mapped
    def get_url(self, file_name: str, container_name: str) -> str:
        return f"{self._blob_service_client.url}{container_name}/{file_name}"

    @exceptions_mapped
    def get_sas_url(self, file_name: str, container_name: str) -> str:
        return f"{self.get_url(file_name, container_name)}?{self._get_blob_sas(file_name, container_name)}"

    def _get_blob_sas(self, file_name: str, container_name: str) -> str:
        blob_client = self._get_blob_client(file_name, container_name)
        return generate_blob_sas(
            blob_client.account_name,
            container_name,
            file_name,
            account_key=blob_client.credential.account_key,
            resource_types=ResourceTypes(object=True),
            permission=AccountSasPermissions(read=True),
            start=datetime.utcnow() - timedelta(minutes=15),
            expiry=datetime.utcnow() + timedelta(minutes=60),
        )
    
    def get_sas_url_group(self, files: List[FileEntity], container_name: str) -> List[str]:
        urls = []
        for file in files:
            url = self.get_sas_url(file_name=str(object=file.id), container_name=container_name)
            document_info = {
                "id": str(file.id),
                "filename": file.display_name,
                "url": url
            }
            urls.append(document_info)
        return urls

    def _get_blob_client(self, file_name: str, container_name: str) -> BlobClient:
        container_client = self._blob_service_client.get_container_client(
            container_name
        )
        if not container_client.exists():
            container_client.create_container()
        blob_client = container_client.get_blob_client(file_name)
        return blob_client
    