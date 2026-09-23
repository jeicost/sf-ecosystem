#!/usr/bin/env python3
"""
Engorda el arte de LÍNEA que no imprime, pieza a pieza y CONTRA LA MÉTRICA.

    python3 engordar-arte.py 08 09 13 ...      optimiza esas piezas
    python3 engordar-arte.py --todas           las ⛔ de arte de línea

QUÉ HACE. Las piezas calcadas con potrace son rellenos: un dibujo a plumilla
de 0,1 mm no tiene ningún `stroke-width` que subir. Pero un trazo del MISMO
color del relleno, aplicado a todos sus paths, engorda cada línea la mitad
del grosor hacia cada lado — conserva cada curva del dibujo original y es
exactamente lo que la ganancia de tinta hace en la malla, solo que a nuestro
favor. El precio: los calados se estrechan ese mismo medio grosor.

Por eso el grosor NO se elige a ojo: se prueban varios y se mide cada
candidato con la misma morfología del informe (tinta fina, calado que se
cierra, islas que mueren, a malla fina 0,35 mm). Gana el que más tinta
salva sin llevarse el calado por delante. Si ningún candidato mejora a la
pieza original, la pieza se queda como está y se dice.

La pieza original queda en `engordadas/<slug>.original.svg` por si hay que
volver.
"""
import re
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage
from playwright.sync_api import sync_playwright

AQUI = Path(__file__).resolve().parent
ICONOS = AQUI.parent.parent / "web" / "public" / "iconos"
COPIA = AQUI / "engordadas"

from alturas_impresion import alto_impreso_mm

RES = 40
MALLA_FINA_MM = 0.35

# Candidatos de grosor, en UNIDADES del viewBox de cada pieza (se prueban
# todos; el 0 es «déjala como está»).
CANDIDATOS = [0, 1.5, 2.5, 4, 6, 8, 11, 14, 18]


def medir(mask, radio_px):
    est = ndimage.generate_binary_structure(2, 1)
    disco = np.zeros((radio_px * 2 + 1, radio_px * 2 + 1), bool)
    yy, xx = np.ogrid[-radio_px:radio_px + 1, -radio_px:radio_px + 1]
    disco[yy * yy + xx * xx <= radio_px * radio_px] = True
    tinta = mask.sum()
    if not tinta:
        return 100.0, 100.0, 999
    fina = mask & ~ndimage.binary_opening(mask, disco)
    perdida = fina.sum() / tinta * 100
    et, n = ndimage.label(mask, est)
    abierta = ndimage.binary_opening(mask, disco)
    muertas = sum(1 for i in range(1, n + 1) if not (abierta & (et == i)).any())
    fondo = ~mask
    etf, nf = ndimage.label(fondo, est)
    borde = set(etf[0]) | set(etf[-1]) | set(etf[:, 0]) | set(etf[:, -1])
    ids = [i for i in range(1, nf + 1) if i not in borde]
    impacto = 0.0
    if ids:
        dil = ndimage.binary_dilation(mask, disco)
        cerrada = sum((etf == i).sum() for i in ids if not ((etf == i) & ~dil).any())
        impacto = cerrada / max(tinta, 1) * 100
    return perdida, impacto, muertas


def rasteriza(pg, svg_texto, mm):
    import base64
    uri = "data:image/svg+xml;base64," + base64.b64encode(svg_texto.encode()).decode()
    pg.set_content(
        f'<body style="margin:0;background:#000">'
        f'<img src="{uri}" style="height:{max(24, round(mm * RES))}px;display:block">'
    )
    pg.wait_for_timeout(60)
    import io as iom
    img = pg.locator("img").screenshot()
    a = np.asarray(Image.open(iom.BytesIO(img)).convert("L"))
    return a > 96


def indices_protegidos(pg, svg, corte_pct):
    """Qué <path> son EL RÓTULO: se mide su caja RENDERIZADA en el navegador
    (con todos los transforms — potrace voltea el eje Y con scale(0.1,-0.1) y
    leer la d a pelo protegía el dibujo y engordaba el nombre). Protegido =
    caja pequeña en el tercio inferior del lienzo."""
    pg.set_content(f'<body style="margin:0">{svg}</body>')
    pg.wait_for_timeout(40)
    cajas = pg.evaluate("""() => {
      const svg = document.querySelector('svg');
      const R = svg.getBoundingClientRect();
      return [...svg.querySelectorAll('path')].map(p => {
        const r = p.getBoundingClientRect();
        return [(r.top - R.top) / R.height, r.height / R.height];
      });
    }""")
    return {i for i, (top, alto) in enumerate(cajas)
            if top > corte_pct and alto < 0.22}


def con_engorde(svg, w, protegidos=frozenset()):
    """Añade stroke del color de la tinta a cada <path> no protegido."""
    if w == 0:
        return svg
    atributo = f'class="engorde" stroke="#F6F1E6" stroke-width="{w}" stroke-linejoin="round" stroke-linecap="round" '
    contador = [-1]

    def parchea(m):
        contador[0] += 1
        attrs = m.group(1)
        if contador[0] in protegidos:
            return m.group(0)
        # potrace emite `stroke="none"`: eso NO es tener trazo, es la razón
        # de que media tanda saliera «mejor como está» sin haberse probado.
        if 'stroke="none"' in attrs:
            return "<path " + attrs.replace('stroke="none"', atributo.strip())
        if "stroke=" in attrs:
            return m.group(0)
        return "<path " + atributo + attrs

    nuevo = re.sub(r"<path ([^>]*)", parchea, svg)
    return nuevo if nuevo != svg else None


CORTE = 0.70  # protege el tercio inferior, donde viven los rótulos


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 1
    slugs = []
    for a in args:
        hits = sorted(ICONOS.glob(f"{a}*.svg")) or sorted(ICONOS.glob(f"*{a}*.svg"))
        if not hits:
            print(f"  ? no encuentro {a}")
            continue
        slugs.append(hits[0])
    COPIA.mkdir(exist_ok=True)
    radio = max(1, round(MALLA_FINA_MM / 2 * RES))

    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 2400, "height": 2400})
        for f in slugs:
            svg = f.read_text()
            mm = alto_impreso_mm(f.stem)
            protegidos = indices_protegidos(pg, svg, CORTE)
            resultados = []
            for w in CANDIDATOS:
                cand = con_engorde(svg, w, protegidos)
                if cand is None:
                    break
                p, x, i = medir(rasteriza(pg, cand, mm), radio)
                # La nota: tinta que se pierde + calado que se lleva por
                # delante (pesa triple) + islas muertas.
                nota = p + x * 3 + i * 2
                resultados.append((nota, w, p, x, i, cand))
            if not resultados:
                print(f"  ⚠️ {f.stem}: no pude envolverla")
                continue
            resultados.sort()
            nota, w, p, x, i, cand = resultados[0]
            base = next(r for r in resultados if r[1] == 0)
            if w == 0:
                print(f"  = {f.stem}: mejor como está (tinta {base[2]:.0f}% impacto {base[3]:.0f}% islas {base[4]})")
                continue
            shutil.copy(f, COPIA / f"{f.stem}.original.svg")
            f.write_text(cand)
            print(f"  ✓ {f.stem}: trazo {w} u → tinta {base[2]:.0f}%→{p:.0f}% · "
                  f"impacto {base[3]:.0f}%→{x:.0f}% · islas {base[4]}→{i}")
        b.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
