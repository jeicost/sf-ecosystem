#!/usr/bin/env python3
"""
Mide la IMPRIMIBILIDAD real de cada pieza: rasteriza el SVG a su altura de
impresión (la del desarrollo plano, que es el arte que va al taller) y
comprueba con morfología qué sobrevive al mínimo de serigrafía.

    python3 medir-imprimibilidad.py            escribe diseno/INFORME-IMPRIMIBILIDAD.md

POR QUÉ EXISTE. La puerta de `verificar-arte.py` mira `stroke-width`, pero la
mitad del set son RELLENOS (texto vectorizado, arte calcado con potrace): el
asta de una letra vectorizada es una forma rellena de 0,15 mm que ningún
chequeo de stroke ve. Una auditoría visual encontró la clase de fallo; esto
lo convierte en medida. Dos números por pieza:

  - TINTA fina: % de tinta que desaparece al erosionar 0,4 mm de radio
    (todo lo que mide menos de 0,8 mm de través no imprime: la malla no
    lo transfiere o se rompe al hornear).
  - CALADO fino: % de los huecos interiores (contraformas) que se cierran
    al dilatar la tinta 0,4 mm — la ganancia de tinta los empasta.

El umbral de veredicto es deliberadamente tolerante: PERDER textura fina
(<15 % de la tinta) es normal en serigrafía — puntadas, pelos, brillos — y
no rompe la pieza. Lo que la rompe es perder MASA o cerrar el calado que
lleva el chiste.
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage
from playwright.sync_api import sync_playwright

from medir_comun import (ESTRICTO_MM, ICONOS, MALLA_FINA_MM, RES, medir,  # noqa: F401
                         rasterizar, rota)

AQUI = Path(__file__).resolve().parent
INFORME = AQUI.parent / "INFORME-IMPRIMIBILIDAD.md"

# DOS escenarios, porque el mínimo real lo decide el taller (pregunta 7 del
# correo): el ESTRICTO es la garantía conservadora y el de MALLA FINA es lo
# habitual en tinta vitrificable sobre vidrio con malla de 120-140 hilos.

from alturas_impresion import alto_impreso_mm as alto_de


def main() -> int:
    piezas = sorted(ICONOS.glob("*.svg"))
    r_estricto = round(ESTRICTO_MM / 2 * RES)
    r_fino = max(1, round(MALLA_FINA_MM / 2 * RES))
    filas = []
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 2400, "height": 1400})
        for f in piezas:
            mm = alto_de(f.stem)
            mask = rasterizar(pg, f.read_text(), mm)
            pe, ce, xe, ie = medir(mask, r_estricto)
            pf, cf, xf, jf = medir(mask, r_fino)
            filas.append((f.stem, mm, pe, ce, xe, ie, pf, cf, xf, jf))
            print(f"  {f.stem:44s} {mm:5.1f} mm · 0.8: tinta {pe:5.1f}% impacto {xe:4.1f}% islas {ie:2d} · "
                  f"0.35: tinta {pf:5.1f}% impacto {xf:4.1f}% islas {jf}")
        b.close()

    def veredicto(pe, ce, xe, ie, pf, cf, xf, jf):
        # Lo que falla incluso con malla fina está ROTO de verdad; lo que
        # solo falla en el escenario estricto es una decisión del taller.
        # Islas solas no condenan: perder puntadas y ojales de calado es
        # textura que se va, no pieza rota — la referencia está llena de eso.
        # Rota = pierde TINTA de verdad o se le cierra el calado del chiste.
        if rota(pf, cf, xf, jf):
            return "⛔ ROTA (falla incluso con malla fina)"
        if pe > 45 or xe > 12 or ie > 6:
            return "⚠️ SOLO MALLA FINA"
        if pe > 15 or xe > 5 or ie > 2:
            return "△ riesgo en estricto"
        return "✓"

    filas.sort(key=lambda r: -(r[6] + r[8] * 3 + (r[2] + r[4]) / 10))
    md = [
        "# Informe de imprimibilidad — medido, no estimado",
        "",
        f"Método: cada pieza rasterizada a su altura del desarrollo plano "
        f"({RES} px/mm) y sometida a apertura/dilatación morfológica en DOS "
        f"escenarios: ESTRICTO ({ESTRICTO_MM} mm, la garantía conservadora) y "
        f"MALLA FINA ({MALLA_FINA_MM} mm, lo habitual en tinta vitrificable "
        f"sobre vidrio con malla de 120-140 hilos).",
        "",
        "- **tinta fina**: % de la tinta más fina que el mínimo — no transfiere.",
        "- **calado**: % de las contraformas que la ganancia de tinta empasta.",
        "- **islas**: elementos sueltos que desaparecen enteros (tildes, patas, puntos).",
        "",
        "La decisión de qué escenario aplica es del TALLER (pregunta 7 del "
        "correo de serigrafía). Lo marcado ⛔ falla en los dos y es lista de "
        "trabajo del ilustrador; ⚠️ exige confirmar malla fina por escrito.",
        "",
        "| pieza | mm | 0.8: tinta/calado/impacto/islas | 0.35: tinta/calado/impacto/islas | veredicto |",
        "|---|---|---|---|---|",
    ]
    for slug, mm, pe, ce, xe, ie, pf, cf, xf, jf in filas:
        md.append(f"| {slug} | {mm:.1f} | {pe:.0f}% / {ce:.0f}% / {xe:.0f}% / {ie} | "
                  f"{pf:.0f}% / {cf:.0f}% / {xf:.0f}% / {jf} | {veredicto(pe, ce, xe, ie, pf, cf, xf, jf)} |")
    rotas = [r for r in filas if veredicto(*r[2:]).startswith("⛔")]
    solo_fina = [r for r in filas if veredicto(*r[2:]).startswith("⚠️")]
    md += [
        "",
        f"**{len(rotas)} piezas rotas en ambos escenarios** (trabajo de arte) y "
        f"**{len(solo_fina)} que dependen de confirmar la malla fina** con el taller.",
    ]
    INFORME.write_text("\n".join(md) + "\n")
    print(f"\n⛔ {len(rotas)} rotas · ⚠️ {len(solo_fina)} solo-malla-fina · informe en {INFORME}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
