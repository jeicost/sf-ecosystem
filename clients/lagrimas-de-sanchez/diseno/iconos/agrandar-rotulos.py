#!/usr/bin/env python3
"""
Agranda el RÓTULO de una pieza hasta que imprima, midiendo.

    python3 agrandar-rotulos.py 05 09 06 ...   esas piezas
    python3 agrandar-rotulos.py --todas        las 01–13 de arte calcado

EL PROBLEMA QUE RESUELVE. En las piezas calcadas el dibujo ocupa dos tercios
de la altura y el nombre se reparte el resto: a 13 mm impresos eso deja el
rótulo con astas de 0,25 mm, o sea, no se imprime. El volcado de tinta fina
lo enseña sin discusión — el dibujo verde y el nombre entero en rojo.

No es un problema de dibujo, es de reparto de altura, así que se arregla
midiendo y no a ojo: se localiza el rótulo por su posición (banda inferior)
y su tamaño, se escala hacia arriba en pasos y se acepta el primer paso que
mejore la medición de imprimibilidad SIN empeorar el impacto en los calados.

POR QUÉ ESCALA Y NO REDIBUJA. El trazo del nombre y el del dibujo son el
mismo (regla de la «sola pluma» del vocabulario). Engordar solo el rótulo lo
rompería; agrandarlo entero mantiene la relación y además respeta la regla
de la referencia de que la palabra pisa el dibujo.
"""
import base64
import io as iom
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage
from playwright.sync_api import sync_playwright

from alturas_impresion import alto_impreso_mm

AQUI = Path(__file__).resolve().parent
ICONOS = AQUI.parent.parent / "web" / "public" / "iconos"
COPIA = AQUI / "rotulos-originales"

RES = 40
MALLA_FINA_MM = 0.35
ESCALAS = [1.15, 1.3, 1.45, 1.6]
#: Dónde empieza la banda del rótulo, en fracción del alto de la pieza.
BANDA = 0.62


def medir(mask, radio_px):
    """(% tinta fina, % de la tinta que pierde por calados cerrados)."""
    disco = np.zeros((radio_px * 2 + 1, radio_px * 2 + 1), bool)
    yy, xx = np.ogrid[-radio_px:radio_px + 1, -radio_px:radio_px + 1]
    disco[yy * yy + xx * xx <= radio_px * radio_px] = True
    tinta = mask.sum()
    if not tinta:
        return 100.0, 100.0
    fina = (mask & ~ndimage.binary_opening(mask, disco)).sum() / tinta * 100
    fondo = ~mask
    etf, nf = ndimage.label(fondo, ndimage.generate_binary_structure(2, 1))
    borde = set(etf[0]) | set(etf[-1]) | set(etf[:, 0]) | set(etf[:, -1])
    dil = ndimage.binary_dilation(mask, disco)
    cerrada = 0
    for i in range(1, nf + 1):
        if i in borde:
            continue
        h = etf == i
        if not (h & ~dil).any():
            cerrada += h.sum()
    return fina, cerrada / tinta * 100


def rasteriza(pg, svg, mm):
    uri = "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()
    pg.set_content(
        f'<body style="margin:0;background:#000">'
        f'<img src="{uri}" style="height:{max(24, round(mm * RES))}px;display:block">'
    )
    pg.wait_for_timeout(80)
    img = pg.locator("img").screenshot()
    return np.asarray(Image.open(iom.BytesIO(img)).convert("L")) > 96


def con_rotulo_mayor(pg, svg, escala):
    """Escala los paths que viven en la banda inferior, anclados por arriba.

    Se mide la caja RENDERIZADA de cada path, nunca su atributo `d`: potrace
    voltea el eje Y con scale(0.1,-0.1) y leer la d a pelo señala el dibujo
    en vez del rótulo (ya mordió una vez).
    """
    pg.set_content(f'<body style="margin:0">{svg}</body>')
    pg.wait_for_timeout(60)
    cajas = pg.evaluate("""() => {
      const s = document.querySelector('svg');
      const R = s.getBoundingClientRect();
      const vb = s.viewBox.baseVal;
      return {
        vb: [vb.x, vb.y, vb.width, vb.height],
        p: [...s.querySelectorAll('path')].map(p => {
          const r = p.getBoundingClientRect();
          return [(r.top - R.top) / R.height, r.height / R.height];
        }),
      };
    }""")
    vb = cajas["vb"]
    # El criterio va sobre el CENTRO de la caja, no sobre su borde superior:
    # una tilde o una diéresis son paths aparte que arrancan por encima de la
    # banda, y al quedarse fuera del grupo se separaban de su letra —«LA NIÑA»
    # salió «LA NÑ A».
    rotulo = {i for i, (t, h) in enumerate(cajas["p"]) if t + h / 2 > BANDA and h < 0.30}
    if not rotulo:
        return None
    arriba = min(cajas["p"][i][0] for i in rotulo)
    cx = vb[0] + vb[2] / 2
    cy = vb[1] + vb[3] * arriba
    cont = [-1]

    def marca(m):
        cont[0] += 1
        if cont[0] in rotulo:
            return (f'<g transform="translate({cx:.1f} {cy:.1f}) scale({escala}) '
                    f'translate({-cx:.1f} {-cy:.1f})">{m.group(0)}</g>')
        return m.group(0)

    return re.sub(r"<path[^>]*/>|<path[^>]*>.*?</path>", marca, svg, flags=re.S)


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 1
    if args == ["--todas"]:
        args = [f"{i:02d}" for i in range(1, 14)]
    COPIA.mkdir(exist_ok=True)
    radio = max(1, round(MALLA_FINA_MM / 2 * RES))

    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 1800, "height": 1600})
        for a in args:
            hits = sorted(ICONOS.glob(f"{a}*.svg")) or sorted(ICONOS.glob(f"*{a}*.svg"))
            if not hits:
                print(f"  ? no encuentro {a}")
                continue
            f = hits[0]
            svg = f.read_text()
            mm = alto_impreso_mm(f.stem)
            base_fina, base_cerr = medir(rasteriza(pg, svg, mm), radio)
            mejor = None
            for esc in ESCALAS:
                cand = con_rotulo_mayor(pg, svg, esc)
                if cand is None:
                    break
                fina, cerr = medir(rasteriza(pg, cand, mm), radio)
                # Mejora = menos tinta fina, y el calado no empeora más de un
                # punto (agrandar la letra estrecha sus propios ojales).
                if fina < base_fina - 1 and cerr <= base_cerr + 1:
                    mejor = (esc, fina, cerr, cand)
            if mejor is None:
                print(f"  = {f.stem}: sin rótulo que agrandar o no mejora "
                      f"(tinta fina {base_fina:.0f}%)")
                continue
            esc, fina, cerr, cand = mejor
            (COPIA / f"{f.stem}.original.svg").write_text(svg)
            f.write_text(cand)
            print(f"  ✓ {f.stem}: rótulo ×{esc} → tinta fina "
                  f"{base_fina:.0f}% → {fina:.0f}% · calado {base_cerr:.0f}% → {cerr:.0f}%")
        b.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
