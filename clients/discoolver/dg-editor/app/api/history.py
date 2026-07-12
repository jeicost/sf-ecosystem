from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.models.guide import HistoryEntry, HistoryChange
from app.storage import guide_repo

router = APIRouter(tags=["history"])


class SnapshotRequest(BaseModel):
    author: str = "manual"
    notes: str = ""


@router.get("/guides/{guide_id}/history", response_model=list[HistoryEntry])
def get_history(guide_id: str):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    return guide.history


@router.get("/guides/{guide_id}/history/{version}")
def get_snapshot(guide_id: str, version: str):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    snapshot = guide_repo.load_snapshot(guide.metadata.slug, version)
    if not snapshot:
        raise HTTPException(404, f"Snapshot v{version} no encontrado")
    return snapshot


@router.post("/guides/{guide_id}/history/snapshot", response_model=HistoryEntry)
def create_snapshot(guide_id: str, req: SnapshotRequest):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    changes = [HistoryChange(tool="manual_snapshot", target="guide", summary=req.notes or "Snapshot manual")]
    snapshot_path = guide_repo.create_snapshot(guide, changes, author=req.author)
    guide_repo.save_guide(guide)
    return guide.history[-1]


@router.post("/guides/{guide_id}/history/restore/{version}")
def restore_version(guide_id: str, version: str):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    snapshot = guide_repo.load_snapshot(guide.metadata.slug, version)
    if not snapshot:
        raise HTTPException(404, f"Snapshot v{version} no encontrado")
    # Keep history from current guide, bump version
    old_history = guide.history
    snapshot.history = old_history
    parts = snapshot.metadata.version.split(".")
    snapshot.metadata.version = f"{parts[0]}.{int(parts[1]) + 1}"
    changes = [HistoryChange(tool="restore", target="guide", summary=f"Restaurado desde v{version}")]
    guide_repo.create_snapshot(snapshot, changes, author="system")
    guide_repo.save_guide(snapshot)
    return {"restored_version": version, "new_version": snapshot.metadata.version}
