from typing import Dict, List, Tuple

import openai
import pandas as pd
from scipy import spatial

from src.config import OPENAI_EMBEDDING_MODEL, OPENAI_EMBEDDINGS_ENGINE
from src.utils.utils import num_tokens

Embedding = List[float]

class SectionsEmbeddingService: 
    def __init__(self)->None:
        self._embedding_engine = OPENAI_EMBEDDINGS_ENGINE
        self._embedding_model = OPENAI_EMBEDDING_MODEL


    def _get_embedding(self,text:str) -> list[float]:
        """Get embedding for a text

        Args:
            text (str): text to be converted

        Returns:
            list[float]: list for created embedding
        """
        embedding = openai.Embedding.create(
                input=text, 
                model=self._embedding_model,
                engine = self._embedding_engine
                )
        return embedding["data"][0]["embedding"]



    def get_sections_embeddings(self, text: str) -> Dict[str, Embedding | str]:
        """Parse a text into sections and get embeddings for each section
            Args:
                text (str): text to be converted
            Returns:
                Dict[str, Embedding | str]: dict with sections and embeddings        
        """
      
        sections: List[str] = self._normalize_sections(text.splitlines())
        embeddings: List[Tuple[str, Embedding]] = list(zip(sections, map(self._get_embedding, sections)))
        return list(map(lambda embedding: { "section": embedding[0], "embeddings": embedding[1] }, embeddings))

    def _normalize_sections(self, sections: List[str]) -> List[str]:
        """Normalize sections to have less than 600 tokens
            Args:
                sections (List[str]): list of sections to be normalized
            Returns:
                List[str]: list of normalized sections
        """
        new_sections = []
        for section in sections:
            if self._valid_section(section):
                new_sections.append(section)
            else:
                new_sections.extend(self._normalize_section(section))
        return new_sections
    
    def _valid_section(self, section: str, max_tokens = 600) -> bool:
        """Check if a section is valid, i.e. if it has less than max_tokens tokens
            Args:
                section (str): section to be checked
                max_tokens (int, optional): max number of tokens. Defaults to 600.
                Returns:
                    bool: True if section is valid, False otherwise
        """
        return num_tokens(section) < max_tokens
    
    def _normalize_section(self, section: str) -> List[str]:
        """Normalize a section by splitting it in two
            Args:
                section (str): section to be normalized
                Returns:
                    List[str]: list with normalized section"""
        if self._valid_section(section):
            return [section]
        else:
            return [*self._normalize_section(section[: len(section) // 2]), *self._normalize_section(section[len(section) // 2:])]

    # Funcion de busqueda
    def sort_sections_by_embedding(self,text: str, df: pd.DataFrame,  
                                        top_n: int = 100) -> tuple[list[str], list[float]]:
        """Sort sections by embedding similarity
            Args:
                text (str): text to be compared
                df (pd.DataFrame): dataframe with sections and embeddings
                top_n (int, optional): number of sections to return. Defaults to 100.
                Returns:
                    tuple[list[str], list[float]]: tuple with sections and embeddings
        """
        cosine_similarity_fn=lambda x, y: 1 - spatial.distance.cosine(x, y)
        query_embedding = self._get_embedding(text)

        sections_embedding = [
            (row["section"],cosine_similarity_fn(query_embedding,row["embeddings"]))
            for _, row in df.iterrows()
        ]
        sections_embedding.sort(key=lambda x: x[1], reverse=True)
        sections, embedding = zip(*sections_embedding)
        return sections[:top_n], embedding[:top_n]