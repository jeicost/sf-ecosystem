#!/usr/bin/env python3
"""
Iguala el GROSOR DE TRAZO impreso de todo el set.

    python3 normalizar-trazo.py

EL PROBLEMA. `componer-signos.py` declara `TRAZO = 7.5` y lo llama «el grosor
único de todo el set». Lo es en la retícula de 100×100 donde se dibuja — pero
después cada SVG se ciñe a su propio dibujo (`ajustar-viewbox.py`) y la botella
lo escala POR ALTURA. Dos piezas con el mismo 7.5 acaban con viewBox de alturas
distintas y, por tanto, con grosores impresos distintos.

Medido sobre el vidrio antes de esto: de 0,10 mm a 1,87 mm. Diecinueve piezas
por debajo del mínimo de serigrafía (0,8 mm), que es lo mismo que decir que no
se imprimen; y los remates, que debían ser argamasa invisible, eran las marcas
más gordas de la botella.

LA REGLA QUE QUEDA: el grosor se fija en MILÍMETROS IMPRESOS, no en unidades de
retícula. Se calcula al revés, desde el alto al que la pieza va a caer en la
banda.
"""
import re
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
ICONOS = AQUI.parent.parent / "web" / "public" / "iconos"

PX_POR_MM = 830 / 380.9      # la caja de la botella contra la botella real
ALTO_BANDA = 21              # alto típico de banda en Botella.tsx (18-24)
ALTO_REMATE = ALTO_BANDA * 0.62

OBJETIVO_MM = 1.0            # con margen sobre el mínimo de 0,8
OBJETIVO_REMATE_MM = 0.8     # el relleno NO debe pesar más que el contenido


def alto_viewbox(svg):
    m = re.search(r'viewBox="[-\d.]+ [-\d.]+ [\d.]+ ([\d.]+)"', svg)
    return float(m.group(1)) if m else None


def main() -> int:
    tocados = []
    for f in sorted(ICONOS.glob("*.svg")):
        svg = f.read_text(encoding="utf-8")
        if "stroke-width" not in svg:
            continue
        alto = alto_viewbox(svg)
        if not alto:
            continue

        remate = f.name.startswith("r-")
        destino_mm = OBJETIVO_REMATE_MM if remate else OBJETIVO_MM
        alto_px = ALTO_REMATE if remate else ALTO_BANDA

        # Cuánto mide, en unidades del viewBox, un trazo que sobre el vidrio
        # dé exactamente `destino_mm`.
        ancho = destino_mm * PX_POR_MM * (alto / alto_px)

        nuevo, n = re.subn(r'stroke-width="[\d.]+"', f'stroke-width="{ancho:.2f}"', svg)
        if n and nuevo != svg:
            f.write_text(nuevo, encoding="utf-8")
            tocados.append((f.name, ancho, destino_mm))

    for nombre, ancho, mm in tocados:
        print(f"  ✓ {nombre:44s} trazo {ancho:6.2f} u → {mm} mm impresos")
    print(f"\n{len(tocados)} piezas con el trazo igualado en milímetros impresos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
