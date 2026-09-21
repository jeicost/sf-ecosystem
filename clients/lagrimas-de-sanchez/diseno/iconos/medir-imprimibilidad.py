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

AQUI = Path(__file__).resolve().parent
ICONOS = AQUI.parent.parent / "web" / "public" / "iconos"
INFORME = AQUI.parent / "INFORME-IMPRIMIBILIDAD.md"

# DOS escenarios, porque el mínimo real lo decide el taller (pregunta 7 del
# correo): el ESTRICTO es la garantía conservadora y el de MALLA FINA es lo
# habitual en tinta vitrificable sobre vidrio con malla de 120-140 hilos.
ESTRICTO_MM = 0.8
MALLA_FINA_MM = 0.35
RES = 40                 # px por mm al rasterizar (0,025 mm/px)

from alturas_impresion import alto_impreso_mm as alto_de


def medir(mask_tinta: np.ndarray, radio_px: int) -> tuple[float, float, int]:
    """(% tinta perdida, % calado cerrado, nº de islas de tinta que desaparecen)."""
    est = ndimage.generate_binary_structure(2, 1)
    disco = np.zeros((radio_px * 2 + 1, radio_px * 2 + 1), bool)
    yy, xx = np.ogrid[-radio_px:radio_px + 1, -radio_px:radio_px + 1]
    disco[yy * yy + xx * xx <= radio_px * radio_px] = True

    tinta = mask_tinta.sum()
    if not tinta:
        return 0.0, 0.0, 0
    fina = mask_tinta & ~ndimage.binary_opening(mask_tinta, disco)
    perdida = fina.sum() / tinta * 100

    # islas enteras que desaparecen (un remate, una tilde, una pata)
    et, n = ndimage.label(mask_tinta, est)
    abierta = ndimage.binary_opening(mask_tinta, disco)
    islas_muertas = 0
    for i in range(1, n + 1):
        isla = et == i
        if not (abierta & isla).any():
            islas_muertas += 1

    # contraformas: huecos que no tocan el borde. Un hueco cuenta como
    # CERRADO solo si la tinta dilatada lo cubre ENTERO — medir el área
    # tocada contaba el anillo del borde y daba 90 % en ojales que seguían
    # perfectamente abiertos.
    fondo = ~mask_tinta
    etf, nf = ndimage.label(fondo, est)
    borde = set(etf[0]) | set(etf[-1]) | set(etf[:, 0]) | set(etf[:, -1])
    ids_huecos = [i for i in range(1, nf + 1) if i not in borde]
    if ids_huecos:
        dilatada = ndimage.binary_dilation(mask_tinta, disco)
        area_total, area_cerrada = 0, 0
        for i in ids_huecos:
            hueco = etf == i
            a = hueco.sum()
            area_total += a
            if not (hueco & ~dilatada).any():
                area_cerrada += a
        pct_cerrado = area_cerrada / area_total * 100 if area_total else 0.0
        # El IMPACTO distingue el ojal de un rotulito (micro, se empasta y
        # queda como textura — la referencia está llena de eso) del calado
        # que LLEVA el chiste (PUCHERAZO, una pantalla, una caja calada):
        # área cerrada medida contra la tinta de la pieza.
        impacto = area_cerrada / max(tinta, 1) * 100
    else:
        pct_cerrado, impacto = 0.0, 0.0
    return perdida, pct_cerrado, impacto, islas_muertas


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
            alto_px = max(24, round(mm * RES))
            # data-URI y no file://: una página about:blank tiene prohibido
            # cargar subrecursos file:// y el <img> roto medía SIEMPRE el
            # glifo de imagen rota — 67 piezas con números idénticos.
            import base64
            uri = "data:image/svg+xml;base64," + base64.b64encode(f.read_bytes()).decode()
            pg.set_content(
                f'<body style="margin:0;background:#000">'
                f'<img src="{uri}" style="height:{alto_px}px;display:block">'
            )
            pg.wait_for_timeout(60)
            img = pg.locator("img").screenshot()
            a = np.asarray(Image.open(__import__("io").BytesIO(img)).convert("L"))
            mask = a > 96
            pe, ce, xe, ie = medir(mask, r_estricto)
            pf, cf, xf, jf = medir(mask, r_fino)
            filas.append((f.stem, mm, pe, ce, xe, ie, pf, cf, xf, jf))
            print(f"  {f.stem:44s} {mm:5.1f} mm · 0.8: tinta {pe:5.1f}% impacto {xe:4.1f}% islas {ie:2d} · "
                  f"0.35: tinta {pf:5.1f}% impacto {xf:4.1f}% islas {jf}")
        b.close()

    def veredicto(pe, ce, xe, ie, pf, cf, xf, jf):
        # Lo que falla incluso con malla fina está ROTO de verdad; lo que
        # solo falla en el escenario estricto es una decisión del taller.
        if pf > 30 or xf > 8 or jf > 4:
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
