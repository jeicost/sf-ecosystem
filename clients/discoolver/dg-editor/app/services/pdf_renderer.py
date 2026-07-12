"""
PDF renderer: usa Playwright (headless Chromium) para renderizar los templates
HTML de /design/ directamente desde el servidor local (?guide=<uuid>).
Cada template se imprime a un PDF individual y se mergean con PyMuPDF.

Requiere:
  pip install playwright
  playwright install chromium
"""
from __future__ import annotations
import asyncio
import json
from datetime import datetime
from pathlib import Path

from app.config import settings

_TEMPLATES = [
    ("01-portada.html",           None),
    ("03-indice.html",            None),
    ("04-nota-director.html",     None),
    ("06-restaurantes.html",      "restaurantes"),
    ("08-fiesta.html",            "fiesta"),
    ("10-arte-exposiciones.html", "arteExposiciones"),
    ("11-experiencias.html",      "experienciasActividades"),
    ("12-alojamientos.html",      "alojamientos"),
    ("13-shopping.html",          "shopping"),
    ("16-contraportada.html",     None),
]

BASE_URL = "http://localhost:8000"

# CSS inyectado en cada página para ocultar la UI del editor y forzar layout A4 limpio
_PRINT_CSS = """
  /* Ocultar UI del editor */
  #tweaks-root,
  .tweaks-panel, [class*="tweaks"], [class*="tp-"],
  .page-nav, .page-controls, .nav-bar,
  .upload-hint, .btn-upload, .upload-area, .upload-placeholder,
  .scan-placeholder, [class*="scan-ph"],
  .upload-zone, #upload-btn, input[type="file"],
  #controls-root {
    display: none !important;
    visibility: hidden !important;
  }

  /* Body limpio para impresión */
  body {
    background: #fff !important;
    padding: 0 !important;
    margin: 0 !important;
    min-height: 0 !important;
    display: block !important;
    align-items: unset !important;
    justify-content: unset !important;
  }

  /* Asegurar que la página A4 ocupa toda la hoja */
  .cover, .page, [class*="-page"], .cat-page, .guia-page {
    margin: 0 auto !important;
    page-break-after: always !important;
  }

  @media print {
    @page { size: A4; margin: 0; }
    body { background: transparent !important; }
    .page-nav, .tweaks-panel, .btn-upload,
    .scan-placeholder, .upload-placeholder { display: none !important; }
  }
"""

# JS inyectado antes de cualquier script de la página:
# bloquea el CSS del tweaks-panel en cuanto el style se añade al DOM
_INIT_SCRIPT = """
(function() {
  // MutationObserver que elimina el style del tweaks-panel y fuerza padding-right: 0
  var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(m) {
      m.addedNodes.forEach(function(node) {
        if (node.id === 'tweaks-panel-css') {
          node.remove();
          document.body.style.setProperty('padding-right', '0px', 'important');
        }
        if (node.id === 'tweaks-root') {
          node.remove();
        }
      });
    });
  });
  document.addEventListener('DOMContentLoaded', function() {
    observer.observe(document.head, { childList: true, subtree: true });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
"""


def _section_has_items(config: dict, section_key: str) -> bool:
    sections = config.get("sections", {})
    sec = sections.get(section_key, {})
    return bool(sec.get("items")) and sec.get("enabled", True)


async def render_pdf(guide_id: str, config: dict) -> str:
    exports_dir = settings.exports_dir
    exports_dir.mkdir(parents=True, exist_ok=True)

    city      = config.get("city", "guide").lower().replace(" ", "-")
    year      = config.get("year", "26")
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename  = f"{city}-{year}_{timestamp}.pdf"
    output    = exports_dir / filename

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return await _placeholder_fallback(config, output)

    templates_to_render = [
        tmpl for tmpl, section_key in _TEMPLATES
        if section_key is None or _section_has_items(config, section_key)
    ]

    tmp_pdfs: list[Path] = []

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            for tmpl in templates_to_render:
                url  = f"{BASE_URL}/design/{tmpl}?guide={guide_id}"
                page = await browser.new_page(viewport={"width": 794, "height": 1123})
                try:
                    # Bloquear tweaks-panel.jsx con abort simple
                    await page.route("**/tweaks-panel.jsx", lambda r: r.abort())

                    await page.goto(url, wait_until="load", timeout=30000)

                    # CSS para ocultar UI restante y limpiar body
                    await page.add_style_tag(content=_PRINT_CSS)

                    # Dar tiempo a JS para renderizar con los datos
                    await page.wait_for_timeout(5000)

                    # Limpieza final: eliminar panel de edición y limpiar layout
                    await page.evaluate("""
                        () => {
                            // Quitar el style que añade padding-right: 268px
                            var panelCss = document.getElementById('tweaks-panel-css');
                            if (panelCss) panelCss.remove();

                            // Quitar el div del panel
                            var root = document.getElementById('tweaks-root');
                            if (root) root.remove();

                            // Limpiar body
                            document.body.style.setProperty('padding-right', '0px', 'important');
                            document.body.style.setProperty('margin-right',  '0px', 'important');
                            document.body.style.background = 'transparent';

                            // Quitar nav, upload hints
                            document.querySelectorAll(
                                '.page-nav, .upload-hint, #upload-btn, input[type="file"]'
                            ).forEach(function(el) { el.style.display = 'none'; });
                        }
                    """)
                    await page.wait_for_timeout(300)

                    tmp_path = exports_dir / f"_tmp_{tmpl}.pdf"
                    await page.pdf(
                        path=str(tmp_path),
                        format="A4",
                        print_background=True,
                        margin={"top": "0", "right": "0", "bottom": "0", "left": "0"},
                        prefer_css_page_size=True,
                        page_ranges="1",
                    )
                    tmp_pdfs.append(tmp_path)
                finally:
                    await page.close()
            await browser.close()

        _merge_pdfs(tmp_pdfs, output)

    finally:
        for p in tmp_pdfs:
            p.unlink(missing_ok=True)

    return f"/exports/{filename}"


def _merge_pdfs(pdfs: list[Path], output: Path) -> None:
    import fitz
    merged = fitz.open()
    for pdf_path in pdfs:
        if pdf_path.exists() and pdf_path.stat().st_size > 100:
            src = fitz.open(str(pdf_path))
            merged.insert_pdf(src)
            src.close()
    merged.save(str(output))
    merged.close()


async def _placeholder_fallback(config: dict, output: Path) -> str:
    city = config.get("city", "")
    year = config.get("year", "")
    output.write_bytes(
        f"% Playwright no instalado. Guía: {city} 20{year}".encode()
    )
    return f"/exports/{output.name}"
