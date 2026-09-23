#!/usr/bin/env python3
"""
Ciñe el viewBox de cada icono a su dibujo real.

    python3 ajustar-viewbox.py --ver      dice qué haría, sin tocar nada
    python3 ajustar-viewbox.py            lo aplica

EL PROBLEMA QUE RESUELVE. Los iconos se escribieron con un viewBox cuadrado
(460×460, o 2048×2048 los trazados) y el dibujo dentro, con margen. Al
maquetar el estampado, cada pieza se escala por su ALTO de caja — así que una
pieza con mucho aire alrededor ocupa sitio con nada. En el desarrollo plano
eso se veía a simple vista: la retícula salía al 45 % de ocupación cuando la
referencia pide 75 %, y no era un problema de reparto, era que las cajas
mentían sobre su contenido.

La regla que queda: **el icono viene ceñido y el aire lo pone quien maqueta.**

CÓMO MIDE. Con el navegador, que es quien sabe de verdad dónde acaba un
trazado y, sobre todo, dónde acaba un <text> — eso no se calcula leyendo el
fichero. Por eso la página de medición carga las MISMAS fuentes que la web: si
midiera con la fallback, las piezas de solo texto saldrían con la caja de otra
tipografía y el ajuste sería basura.
"""
import argparse
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

AQUI = Path(__file__).resolve().parent
ICONOS = AQUI.parent.parent / "web" / "public" / "iconos"

# Margen que se deja alrededor del dibujo, en tanto por uno del lado mayor.
# No es cero a propósito: un trazo grueso que muere justo en el borde del
# viewBox se ve recortado en algunos motores.
MARGEN = 0.03

PAGINA = """<!doctype html>
<html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Bodoni+Moda:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>body{margin:0}</style>
</head><body><div id="caja"></div></body></html>"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ver", action="store_true", help="no escribe, solo informa")
    args = ap.parse_args()

    ficheros = sorted(ICONOS.glob("*.svg"))
    if not ficheros:
        print(f"No hay iconos en {ICONOS}")
        return 1

    cambios, intactos, fallos = [], [], []

    with sync_playwright() as pw:
        navegador = pw.chromium.launch()
        pagina = navegador.new_page()
        pagina.set_content(PAGINA)
        # Sin esto, las piezas de solo texto se miden con la fuente de
        # sistema y el recorte sale mal.
        pagina.wait_for_timeout(2500)
        pagina.evaluate("document.fonts.ready")

        for f in ficheros:
            svg = f.read_text(encoding="utf-8")
            medida = pagina.evaluate(
                """(svg) => {
                    const caja = document.getElementById('caja');
                    caja.innerHTML = svg;
                    const el = caja.querySelector('svg');
                    if (!el) return null;
                    // Tamaño fijo para medir en coordenadas del viewBox.
                    el.setAttribute('width', '1000');
                    el.setAttribute('height', '1000');
                    const vb = el.viewBox.baseVal;
                    // El bbox se pide al <svg> RAÍZ, no elemento a elemento.
                    // `getBBox()` de un hijo devuelve sus coordenadas ANTES de
                    // su propio transform: las piezas con <g transform="..."> se
                    // medían en el sitio equivocado y el viewBox salía
                    // descentrado — la cifra de «POR 7 VOTOS» quedaba en una
                    // esquina de un lienzo enorme y vacío.
                    let b;
                    try { b = el.getBBox(); } catch { return null; }
                    if (!b || (!b.width && !b.height)) return null;
                    return {
                        x0: b.x, y0: b.y, x1: b.x + b.width, y1: b.y + b.height,
                        vb: { x: vb.x, y: vb.y, w: vb.width, h: vb.height },
                    };
                }""",
                svg,
            )

            if medida is None:
                fallos.append(f.name)
                continue

            vb = medida["vb"]
            ancho = medida["x1"] - medida["x0"]
            alto = medida["y1"] - medida["y0"]
            if ancho <= 0 or alto <= 0:
                fallos.append(f.name)
                continue

            m = max(ancho, alto) * MARGEN
            nx, ny = medida["x0"] - m, medida["y0"] - m
            nw, nh = ancho + 2 * m, alto + 2 * m

            # Cuánto aire sobraba: si es poco, no se toca. Reescribir por un
            # 2 % solo añade ruido al diff.
            #
            # PERO si el contenido SE SALE del viewBox hay que reescribir
            # SIEMPRE: con contenido más grande que la caja la ganancia sale
            # negativa, pasaba el umbral «< 0.05» y la pieza quedaba CORTADA
            # («E LA CURVA» sin la D, «L PORTERO» sin la E) — un rótulo
            # agrandado se comía el canto en silencio.
            eps = max(vb["w"], vb["h"]) * 0.002
            desborda = (medida["x0"] < vb["x"] - eps or medida["y0"] < vb["y"] - eps
                        or medida["x1"] > vb["x"] + vb["w"] + eps
                        or medida["y1"] > vb["y"] + vb["h"] + eps)
            ganancia = 1 - (nw * nh) / (vb["w"] * vb["h"])
            if ganancia < 0.05 and not desborda:
                intactos.append(f.name)
                continue

            def num(v: float) -> str:
                return f"{v:.2f}".rstrip("0").rstrip(".")

            nuevo = f'viewBox="{num(nx)} {num(ny)} {num(nw)} {num(nh)}"'
            viejo_ini = svg.index("viewBox=")
            viejo_fin = svg.index('"', svg.index('"', viejo_ini) + 1) + 1
            svg2 = svg[:viejo_ini] + nuevo + svg[viejo_fin:]

            # El width/height fijos pelean con el viewBox nuevo: fuera.
            for attr in (" width=", " height="):
                while attr in svg2[: svg2.index(">")]:
                    i = svg2.index(attr)
                    j = svg2.index('"', svg2.index('"', i) + 1) + 1
                    svg2 = svg2[:i] + svg2[j:]

            cambios.append((f.name, ganancia, nuevo))
            if not args.ver:
                f.write_text(svg2, encoding="utf-8")

        navegador.close()

    for nombre, ganancia, nuevo in cambios:
        print(f"  {'(vería)' if args.ver else '✓'} {nombre:44s} −{ganancia*100:4.1f}% de aire  {nuevo}")
    print(f"\n{len(cambios)} ajustados · {len(intactos)} ya estaban ceñidos · {len(fallos)} sin medir")
    if fallos:
        print("  sin medir:", ", ".join(fallos))
    return 0


if __name__ == "__main__":
    sys.exit(main())
