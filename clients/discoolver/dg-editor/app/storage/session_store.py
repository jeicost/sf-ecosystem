from __future__ import annotations
import uuid
from datetime import datetime
from app.models.chat import ChatSession, ChatMessage

_sessions: dict[str, ChatSession] = {}


def create_session(guide_id: str) -> ChatSession:
    session_id = str(uuid.uuid4())
    session = ChatSession(session_id=session_id, guide_id=guide_id)
    _sessions[session_id] = session
    return session


def get_session(session_id: str) -> ChatSession | None:
    return _sessions.get(session_id)


def get_or_create(session_id: str | None, guide_id: str) -> ChatSession:
    if session_id and session_id in _sessions:
        session = _sessions[session_id]
        session.last_active = datetime.utcnow()
        return session
    return create_session(guide_id)


def append_message(session_id: str, role: str, content) -> None:
    session = _sessions.get(session_id)
    if session:
        session.messages.append(ChatMessage(role=role, content=content))
        session.last_active = datetime.utcnow()


def delete_session(session_id: str) -> bool:
    return bool(_sessions.pop(session_id, None))


def list_sessions(guide_id: str) -> list[ChatSession]:
    return [s for s in _sessions.values() if s.guide_id == guide_id]
