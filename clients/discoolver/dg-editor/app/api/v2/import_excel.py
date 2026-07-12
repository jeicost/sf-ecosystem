"""Excel import endpoint — parse .xlsx → create guide + bulk items."""
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db, crud
from app.services.excel_parser import parse_excel
from app.services.excel_template import build_template

router = APIRouter(prefix="/v2/import", tags=["import-v2"])

ALLOWED_EXCEL = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
    "application/vnd.ms-excel",
    "application/octet-stream",
}


@router.get("/template", summary="Descargar plantilla Excel")
async def download_template():
    """Genera y descarga la plantilla .xlsx para rellenar."""
    from pathlib import Path
    template_path = Path("static/discoolver-guide-template.xlsx")
    if not template_path.exists():
        build_template(template_path)
    return FileResponse(
        path=template_path,
        filename="discoolver-guide-template.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.post("/excel", summary="Importar guía desde Excel")
async def import_from_excel(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Crea una guía nueva (o devuelve errores de validación) a partir de
    un archivo .xlsx relleno con la plantilla oficial.

    Responde con:
    - guide_id: UUID de la guía creada
    - items_created: número de items insertados
    - warnings: lista de avisos no bloqueantes
    """
    content_type = file.content_type or ""
    if content_type not in ALLOWED_EXCEL and not (file.filename or "").endswith(".xlsx"):
        raise HTTPException(
            status_code=415,
            detail="Solo se aceptan archivos .xlsx",
        )

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (máx. 20 MB)")

    result = parse_excel(file_bytes)

    if result.errors:
        raise HTTPException(
            status_code=422,
            detail={"errors": result.errors, "warnings": result.warnings},
        )

    # Create guide
    guide = await crud.create_guide(db, result.guide_create, created_by="excel_import")

    # Apply extra metadata fields (cover text, director letter, etc.)
    if result.guide_update:
        await crud.update_guide(db, guide.id, result.guide_update)

    # Apply persona awards & extra
    if result.persona_extra:
        from app.models.guide_v2 import GuideUpdate
        await crud.update_guide(db, guide.id, GuideUpdate(**result.persona_extra))

    # Bulk insert items
    created = await crud.bulk_create_items(db, guide.id, result.items)

    return {
        "guide_id": str(guide.id),
        "city": guide.city,
        "year": guide.year,
        "items_created": len(created),
        "warnings": result.warnings,
        "created_at": datetime.utcnow().isoformat(),
    }
