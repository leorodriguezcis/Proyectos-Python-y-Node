import sys
import uuid
__import__('pysqlite3')
sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')
import chromadb
from chromadb.utils import embedding_functions
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
import openai

from src.config import (
    OPENAI_API_URL,
    OPENAI_KEY,
    OPENAI_CHAT_ENGINE,
    OPENAI_EMBEDDINGS_ENGINE,
    CHROMA_DB_HOST,
    CHROMA_DB_PORT,
)

class ChromaService: 
    _openai_ef = embedding_functions.OpenAIEmbeddingFunction(
            api_key=OPENAI_KEY,
            model_name=OPENAI_EMBEDDINGS_ENGINE,api_base= OPENAI_API_URL,
                        )

    _embeddings = OpenAIEmbeddings(
            openai_api_base= OPENAI_API_URL,
            deployment=OPENAI_EMBEDDINGS_ENGINE,
            openai_api_type='azure',
            openai_api_key=OPENAI_KEY,
            chunk_size=1)
    
    def __init__(self) -> None:
        self._client = chromadb.HttpClient(host=CHROMA_DB_HOST, port=CHROMA_DB_PORT)
    

    def load_croma_db(self, embeddings, group_id): 
        vectordb = Chroma(
        client=self._client,
        collection_name=group_id,
        embedding_function=embeddings,)
        return vectordb

    def chroma_delete_files(self, files_ids,group_id):
        collection = self._client.get_or_create_collection(name="group"+str(group_id), embedding_function=self._openai_ef )
        collection.delete(where={"file_tag": str(files_ids)})

    def chroma_delete_colection(self, group_id):
        self._client.delete_collection(name="group"+str(group_id))
            
    def add_documents(self, documents,group_id):
        collection = self._client.get_or_create_collection(name="group"+str(group_id), embedding_function= self._openai_ef )
        for doc in documents:
            collection.add( ids=doc.metadata["file_tag"], metadatas=doc.metadata, documents=doc.page_content)
            

    def get_context(self, question, vectordb):
        answer = vectordb.similarity_search(question)
        chunks = [item.page_content for item in answer]
        return chunks

    def reformula(self, pregunta,group_id, engine= OPENAI_CHAT_ENGINE, temperature=0) -> str:
        vectordb = self.load_croma_db(self._embeddings, "group"+str(group_id))
        chunks = self.get_context(pregunta,vectordb)
        messages_full =[{"role": "system", "content": """Eres un asistente virtual de empleados de la empresa Una Empresa. Tu trabajo es responder a sus consultas sobre políticas internas de la empresa utilizando como contexto:{}. Respondé usando unicamente el contexto proporcionado y si no encuentras allí la respuesta responde amablemente que no la sabes. Solo responde preguntas que sean acerca de las politicas internas de La Empresa que se  pueda extraer del contexto.En el caso de que no sepas la respuesta indicale al usuario la siguiente información de contacto: 
                        """.format(chunks) 
                        },{'role': 'user', 'content': pregunta}]
    
        response = openai.ChatCompletion.create(
            engine= engine,
            messages=messages_full,
            temperature=temperature, 
        )
        return response.choices[0].message["content"]