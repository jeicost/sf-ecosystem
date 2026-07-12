import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.models.guide import Guide, GuideMetadata, GuideSummary, CreateGuideRequest, PatchMetadataRequest
from app.storage import guide_repo

router = APIRouter(tags=["guides"])


@router.get("/guides", response_model=list[GuideSummary])
def list_guides():
    return guide_repo.list_guides()


@router.get("/guides/{guide_id}", response_model=Guide)
def get_guide(guide_id: str):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    return guide


@router.post("/guides", response_model=Guide, status_code=201)
def create_guide(req: CreateGuideRequest):
    guide_id = str(uuid.uuid4())
    slug = f"{req.destination.lower().replace(' ', '-')}-{req.type.value}"
    guide = Guide(
        metadata=GuideMetadata(
            id=guide_id,
            title=req.title,
            destination=req.destination,
            type=req.type,
            language=req.language,
            version="1.0",
            status="draft",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            slug=slug,
            author=req.author,
        )
    )
    guide_repo.save_guide(guide)
    return guide


@router.patch("/guides/{guide_id}/metadata", response_model=Guide)
def patch_metadata(guide_id: str, req: PatchMetadataRequest):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    if req.title is not None:
        guide.metadata.title = req.title
    if req.destination is not None:
        guide.metadata.destination = req.destination
    if req.language is not None:
        guide.metadata.language = req.language
    if req.status is not None:
        guide.metadata.status = req.status
    if req.tags is not None:
        guide.metadata.tags = req.tags
    if req.author is not None:
        guide.metadata.author = req.author
    guide_repo.save_guide(guide)
    return guide


@router.delete("/guides/{guide_id}", status_code=204)
def delete_guide(guide_id: str):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(status_code=404, detail="Guía no encontrada")
    guide_repo.delete_guide(guide.metadata.slug)
