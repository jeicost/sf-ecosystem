"""Web export: GuideConfig → JSON config → inyectar en design-studio build."""
import json
import shutil
from datetime import datetime
from pathlib import Path

from app.config import settings


async def render_web(guide_id: str, config: dict) -> str:
    """
    Genera una versión web estática de la guía.
    Returns the public URL (DO Spaces CDN or local /exports/).
    """
    from app.services import spaces

    exports_dir = settings.exports_dir
    exports_dir.mkdir(parents=True, exist_ok=True)

    city = config.get("city", "guide").lower()
    year = config.get("year", "26")
    slug = f"{city}-{year}"
    web_dir = exports_dir / "web" / slug
    web_dir.mkdir(parents=True, exist_ok=True)

    # Write config JSON
    config_path = web_dir / "guide-config.json"
    config_path.write_text(json.dumps(config, ensure_ascii=False, indent=2), encoding="utf-8")

    # Copy design-studio build if it exists
    studio_build = Path(__file__).resolve().parent.parent.parent.parent / "design-studio" / "dist"
    if studio_build.exists():
        shutil.copytree(studio_build, web_dir / "studio", dirs_exist_ok=True)

    # Generate a simple HTML entry point
    index_html = web_dir / "index.html"
    index_html.write_text(_web_index(config, slug), encoding="utf-8")

    # Upload to DO Spaces if configured
    if settings.do_spaces_key:
        try:
            # Upload config JSON
            with config_path.open("rb") as f:
                spaces.upload_file(
                    file_bytes=f.read(),
                    original_filename="guide-config.json",
                    guide_id=guide_id,
                    folder=f"web/{slug}",
                )
            return f"{settings.do_spaces_cdn_base}/web/{slug}/index.html"
        except Exception:
            pass  # Fall through to local

    return f"/exports/web/{slug}/index.html"


def _web_index(config: dict, slug: str) -> str:
    city = config.get("city", "")
    year = config.get("year", "")
    generated = datetime.utcnow().strftime("%d/%m/%Y %H:%M")
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Guía Discoolver {city} 20{year}</title>
<script>
  window.GUIDE_CONFIG = {json.dumps(config, ensure_ascii=False)};
</script>
</head>
<body>
<div id="root"></div>
<!-- design-studio build will be loaded here -->
<script type="module" src="./studio/assets/index.js"></script>
<noscript>
  <p style="font-family:sans-serif;text-align:center;padding:40px">
    Guía Discoolver {city} · 20{year}<br>
    <small>Generada el {generated}</small>
  </p>
</noscript>
</body>
</html>"""
