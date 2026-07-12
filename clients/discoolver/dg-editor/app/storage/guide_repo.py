from __future__ import annotations
import json
import shutil
from pathlib import Path
from datetime import datetime

from app.config import settings
from app.models.guide import Guide, GuideSummary, HistoryEntry, HistoryChange


def _guide_dir(slug: str) -> Path:
    return settings.guides_data_dir / slug


def _guide_file(slug: str) -> Path:
    return _guide_dir(slug) / "guide.json"


def list_guides() -> list[GuideSummary]:
    summaries = []
    if not settings.guides_data_dir.exists():
        return summaries
    for guide_dir in sorted(settings.guides_data_dir.iterdir()):
        guide_file = guide_dir / "guide.json"
        if guide_file.exists():
            data = json.loads(guide_file.read_text(encoding="utf-8"))
            meta = data["metadata"]
            summaries.append(GuideSummary(
                id=meta["id"],
                title=meta["title"],
                destination=meta["destination"],
                type=meta["type"],
                status=meta["status"],
                version=meta["version"],
                updated_at=meta["updated_at"],
                slug=meta.get("slug", guide_dir.name),
            ))
    return summaries


def load_guide(guide_id_or_slug: str) -> Guide | None:
    # Try by slug first (directory name)
    candidate = _guide_file(guide_id_or_slug)
    if candidate.exists():
        return Guide.model_validate_json(candidate.read_text(encoding="utf-8"))
    # Try by id: scan all guides
    if not settings.guides_data_dir.exists():
        return None
    for guide_dir in settings.guides_data_dir.iterdir():
        gf = guide_dir / "guide.json"
        if gf.exists():
            data = json.loads(gf.read_text(encoding="utf-8"))
            if data["metadata"]["id"] == guide_id_or_slug:
                return Guide.model_validate(data)
    return None


def save_guide(guide: Guide) -> None:
    slug = guide.metadata.slug
    guide_dir = _guide_dir(slug)
    guide_dir.mkdir(parents=True, exist_ok=True)
    guide.metadata.updated_at = datetime.utcnow()
    _guide_file(slug).write_text(
        guide.model_dump_json(indent=2), encoding="utf-8"
    )


def create_snapshot(guide: Guide, changes: list[HistoryChange], author: str = "chatbot") -> str:
    slug = guide.metadata.slug
    version = guide.metadata.version
    ts = datetime.utcnow().strftime("%Y-%m-%dT%H-%M-%S")
    snapshot_name = f"v{version}_{ts}.json"
    history_dir = _guide_dir(slug) / "history"
    history_dir.mkdir(parents=True, exist_ok=True)
    snapshot_path = str(history_dir / snapshot_name)

    # Save snapshot as a copy of current guide
    shutil.copy2(_guide_file(slug), snapshot_path)

    entry = HistoryEntry(
        version=version,
        timestamp=datetime.utcnow(),
        changes=changes,
        author=author,
        snapshot_path=snapshot_path,
    )
    guide.history.append(entry)
    return snapshot_path


def load_snapshot(slug: str, version: str) -> Guide | None:
    history_dir = _guide_dir(slug) / "history"
    if not history_dir.exists():
        return None
    for f in sorted(history_dir.glob(f"v{version}_*.json")):
        return Guide.model_validate_json(f.read_text(encoding="utf-8"))
    return None


def delete_guide(slug: str) -> bool:
    guide_dir = _guide_dir(slug)
    if guide_dir.exists():
        shutil.rmtree(guide_dir)
        return True
    return False
