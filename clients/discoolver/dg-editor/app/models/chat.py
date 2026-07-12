from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Any


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: Any  # str or list[dict] (for tool_use/tool_result blocks)


class ChatSession(BaseModel):
    session_id: str
    guide_id: str
    messages: list[ChatMessage] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
