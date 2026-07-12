import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.chat import ChatRequest
from app.storage import guide_repo, session_store
from app.core import claude_client

router = APIRouter(tags=["chat"])


async def _sse_generator(guide_id: str, session_id: str, message: str):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        yield f"data: {json.dumps({'type': 'error', 'message': 'Guía no encontrada'})}\n\n"
        return

    session = session_store.get_or_create(session_id, guide_id)

    async for event in claude_client.stream_chat(guide, session, message):
        yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"


@router.post("/chat/{guide_id}")
async def chat(guide_id: str, req: ChatRequest):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")

    return StreamingResponse(
        _sse_generator(guide_id, req.session_id or "", req.message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/chat/{guide_id}/sessions")
def list_sessions(guide_id: str):
    sessions = session_store.list_sessions(guide_id)
    return [{"session_id": s.session_id, "last_active": s.last_active, "message_count": len(s.messages)} for s in sessions]


@router.delete("/chat/{guide_id}/sessions/{session_id}", status_code=204)
def delete_session(guide_id: str, session_id: str):
    if not session_store.delete_session(session_id):
        raise HTTPException(404, "Sesión no encontrada")
