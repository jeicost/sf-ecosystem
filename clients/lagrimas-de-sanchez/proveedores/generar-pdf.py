#!/usr/bin/env python3
"""
Convierte la especificación de serigrafía en el PDF que se manda al taller.

    python3 generar-pdf.py

POR QUÉ EXISTE. La primera versión del PDF se hizo a mano y se quedó con las
cifras de imprimibilidad de la revisión anterior (decía 5 piezas rotas cuando
ya eran 6). Un documento que cita mediciones tiene que regenerarse con ellas,
no copiarse: si el markdown cambia y el PDF no, el taller presupuesta sobre
un arte que ya no existe.

Salida: paquetes/serigrafia/ESPECIFICACION-TECNICA.pdf
"""
import re
import subprocess
import sys
from pathlib import Path

import markdown
from playwright.sync_api import sync_playwright

AQUI = Path(__file__).resolve().parent
FUENTE = AQUI / "ESPECIFICACION-TECNICA-SERIGRAFIA.md"
DESTINO = AQUI / "paquetes" / "serigrafia" / "ESPECIFICACION-TECNICA.pdf"

CSS = """
@page { size: A4; margin: 20mm 18mm 18mm; }
* { box-sizing: border-box; }
body { font: 10.5pt/1.55 "Charter","Georgia",serif; color:#1a1a1a; margin:0; }
h1 { font-size: 20pt; line-height:1.15; margin:0 0 2pt; letter-spacing:-.4pt; }
h2 { font-size: 13pt; margin: 22pt 0 7pt; padding-bottom:3pt;
     border-bottom:1.2pt solid #1a1a1a; page-break-after:avoid; }
h1 + h2 { border:0; font-size:12pt; font-weight:400; color:#555;
          margin:0 0 14pt; padding:0; }
h3 { font-size: 10.5pt; margin: 14pt 0 5pt; page-break-after:avoid; }
p, li { orphans:3; widows:3; }
table { width:100%; border-collapse:collapse; margin:9pt 0; font-size:9.5pt;
        page-break-inside:avoid; }
td, th { border-bottom:.5pt solid #ccc; padding:4pt 7pt 4pt 0; text-align:left;
         vertical-align:top; }
th { border-bottom:1pt solid #1a1a1a; font-size:8.5pt; letter-spacing:.4pt;
     text-transform:uppercase; }
table tr td:first-child { width:34%; color:#555; }
ol, ul { padding-left:16pt; margin:7pt 0; }
li > ul, li > ol { margin:4pt 0 2pt; }
li { margin-bottom:4pt; }
hr { border:0; border-top:.5pt solid #ddd; margin:16pt 0; }
strong { font-weight:600; }
code { font:9.5pt "SF Mono",Menlo,monospace; background:#f2f0ec; padding:1pt 3pt;
       border-radius:2pt; }
"""


def main() -> int:
    # Las cifras de imprimibilidad salen de la medición, no de la memoria.
    subprocess.run([sys.executable, str(AQUI / "actualizar-cifras.py")], check=True)
    if not FUENTE.exists():
        print(f"no encuentro {FUENTE}", file=sys.stderr)
        return 1
    md = FUENTE.read_text()
    # `sane_lists` exige cuatro espacios para anidar y el markdown usa dos: sin
    # esto, los tres puntos de «Zona decorada» salían al mismo nivel que ella.
    md = re.sub(r"^  (?=[-*] )", "    ", md, flags=re.M)
    cuerpo = markdown.markdown(md, extensions=["tables", "sane_lists"])
    # Las tablas de dos columnas sin cabecera salen con un <thead> vacío.
    cuerpo = re.sub(r"<thead>\s*<tr>\s*(<th></th>\s*)+</tr>\s*</thead>", "", cuerpo)
    html = f"<!doctype html><meta charset='utf-8'><style>{CSS}</style>{cuerpo}"

    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page()
        pg.set_content(html, wait_until="load")
        pg.pdf(path=str(DESTINO), format="A4", print_background=True,
               display_header_footer=True,
               header_template="<div></div>",
               footer_template=(
                   "<div style='font:7.5pt Georgia,serif;color:#999;width:100%;"
                   "padding:0 18mm;display:flex;justify-content:space-between'>"
                   "<span>Lágrimas de Sánchez · especificación de serigrafía</span>"
                   "<span class='pageNumber'></span></div>"),
               margin={"top": "20mm", "bottom": "18mm",
                       "left": "18mm", "right": "18mm"})
        b.close()
    kb = DESTINO.stat().st_size / 1024
    print(f"✓ {DESTINO.relative_to(AQUI)} · {kb:.0f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
