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

from alturas_impresion import alto_impreso_mm

AQUI = Path(__file__).resolve().parent
ICONOS = AQUI.parent.parent / "web" / "public" / "iconos"

MINIMO_MM = 0.85             # dibujos: nada por debajo, no imprime
# El TEXTO tiene su propio mínimo, más fino. Empujarlo a 0,85 cerraba las
# contraformas: a caja de 2,7 mm no caben astas y ojales de 0,8 a la vez
# (5 × 0,8 > 2,7 — es aritmética, no opinión). 0,5 mm imprime con malla
# fina y deja el ojal abierto; el escenario estricto vive en el informe
# de imprimibilidad y en la pregunta 7 del correo al serigrafista.
MINIMO_TEXTO_MM = 0.5
# 1,0 y no 0,8: a 4,6 mm de alto, un trazo clavado en el mínimo cae por
# debajo en cuanto la malla come medio punto — medido: las flechas perdían
# el 25-47 % de su tinta. La argamasa puede ser rotunda.
OBJETIVO_REMATE_MM = 1.0


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
        # La altura REAL de impresión (la del desarrollo plano), no una
        # suposición en píxeles: con ALTO_PIEZA=38 (17,4 mm) el mínimo salía
        # un 60 % más fino de lo prometido en las bandas de 11 mm.
        mm_impresos = alto_impreso_mm(f.stem)

        if remate:
            # Los remates sí se igualan: son argamasa y deben pesar lo mismo.
            ancho = OBJETIVO_REMATE_MM * (alto / mm_impresos)
            nuevo, n = re.subn(r'stroke-width="[\d.]+"', f'stroke-width="{ancho:.2f}"', svg)
            if n and nuevo != svg:
                f.write_text(nuevo, encoding="utf-8")
                tocados.append((f.name, ancho, OBJETIVO_REMATE_MM))
            continue

        # Las ilustraciones NO se igualan — su jerarquía de grosores es
        # deliberada, como en la referencia. Solo se SUBE al mínimo lo que no
        # imprimiría: un trazo por debajo de 0,85 mm sobre el vidrio.
        objetivo = MINIMO_TEXTO_MM if f.name.startswith("t-") else MINIMO_MM
        minimo = objetivo * (alto / mm_impresos)
        cambiado = False
        def sube(m):
            nonlocal cambiado
            v = float(m.group(1))
            if v < minimo:
                cambiado = True
                return f'stroke-width="{minimo:.2f}"'
            return m.group(0)
        nuevo = re.sub(r'stroke-width="([\d.]+)"', sube, svg)
        if cambiado:
            f.write_text(nuevo, encoding="utf-8")
            tocados.append((f.name, minimo, MINIMO_MM))

    for nombre, ancho, mm in tocados:
        print(f"  ✓ {nombre:44s} trazo {ancho:6.2f} u → {mm} mm impresos")
    print(f"\n{len(tocados)} piezas con el trazo igualado en milímetros impresos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
