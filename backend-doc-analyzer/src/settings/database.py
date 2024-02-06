from typing import Optional
from sqlalchemy import Engine, create_engine as sql_alchemy_create_engine
from src.entities.base_entity import Base
from src.entities.file_entity import FileEntity
from src.config import TEST_DB_CONNECTION
from sqlalchemy_utils import create_database, database_exists

engine: Optional[Engine] = None


def create_engine() -> Engine:
    global engine
    if engine is None:
        engine = sql_alchemy_create_engine(url=TEST_DB_CONNECTION, echo=True)
        if not database_exists(url=engine.url):
            create_database(
                url=engine.url,
            )
    return engine


def drop_database() -> None:
    # Drop existing tables
    engine = create_engine()
    Base.metadata.drop_all(bind=engine)


def connect_database() -> None:
    # Create tables
    engine = create_engine()
    Base.metadata.create_all(bind=engine)
