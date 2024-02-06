from typing import Optional
from sqlalchemy.orm import Session
from src.settings.database import create_engine


class SessionService(object):
    _instance = None

    def session(self, super_session: Optional[Session]) -> Session:
        return Session(create_engine()) if super_session is None else super_session

    def commit(self, super_session: Optional[Session], session: Session) -> None:
        session.commit() if super_session is None else session.flush()

    @staticmethod
    def instance() -> "SessionService":
        if not SessionService._instance:
            SessionService._instance = SessionService()
        return SessionService._instance
