from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.storage import guide_repo
from app.pdf import renderer

router = APIRouter(tags=["export"])


class ExportRequest(BaseModel):
    profile: Optional[str] = None


@router.post("/guides/{guide_id}/export/pdf")
def export_pdf(guide_id: str, req: ExportRequest = ExportRequest()):
    guide = guide_repo.load_guide(guide_id)
    if not guide:
        raise HTTPException(404, "Guía no encontrada")
    try:
        output_path = renderer.save_pdf(guide, req.profile)
        return {"url": f"/exports/{output_path.name}", "filename": output_path.name}
    except Exception as e:
        raise HTTPException(500, f"Error generando PDF: {str(e)}")
