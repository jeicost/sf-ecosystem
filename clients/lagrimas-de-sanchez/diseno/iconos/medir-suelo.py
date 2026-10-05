#!/usr/bin/env python3
"""
Mide el SUELO de cada pieza: la altura impresa mínima a la que deja de romperse.

    python3 medir-suelo.py          escribe diseno/suelo-piezas.json

POR QUÉ EXISTE. El empaquetador reparte alturas con un RITMO fijo de contraste
de escala y **no sabe qué piezas son frágiles**. El 5 de octubre, arreglar dos
piezas de texto recolocó el tejido entero y tumbó otras tres que estaban bien:
`15-felpudo` (43 islas muertas: las cerdas), `11-la-cajera` y `55-pucherazo`
cayeron de 13,5 a 9 mm y se rompieron sin que nadie tocara su dibujo.

O sea: **«pieza rota» no es una propiedad del dibujo, es del dibujo A SU
TAMAÑO.** Y eso se mide. Aquí se busca por bisección el alto al que cada pieza
pasa el veredicto de malla fina, y el empaquetador usa ese número para no
mandarla nunca a una fila donde no cabe.

El suelo se mide SOLO en malla fina (0,35 mm): el escenario estricto lo decide
el taller y mientras no conteste no se le puede pedir al reparto que lo cumpla.
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

from medir_comun import ICONOS, MALLA_FINA_MM, RES, medir, rasterizar, rota

AQUI = Path(__file__).resolve().parent
SALIDA = AQUI.parent / "suelo-piezas.json"

#: Escalera de alturas en mm. Por debajo de 6 mm no hay pieza que aguante y
#: por encima de 26 el empaquetador no llega nunca (salvo el instrumento, que
#: va por su carril y se excluye).
ESCALERA = [6, 7.5, 9, 11, 13.5, 16, 19, 23]
#: Piezas con carril propio: su alto no lo decide el reparto.
EXENTAS = {"54-lagrimometro"}


def main() -> int:
    ficheros = sorted(f for f in ICONOS.glob("*.svg") if f.stem not in EXENTAS)
    radio = max(1, round(MALLA_FINA_MM / 2 * RES))
    suelo = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 1800, "height": 1800})
        for f in ficheros:
            svg = f.read_text()
            # Bisección sobre la escalera: la imprimibilidad es monótona en el
            # tamaño (más grande nunca imprime peor), así que basta con
            # encontrar el primer escalón que pasa.
            lo, hi, bueno = 0, len(ESCALERA) - 1, None
            while lo <= hi:
                m = (lo + hi) // 2
                if rota(*medir(rasterizar(pg, svg, ESCALERA[m]), radio)):
                    lo = m + 1
                else:
                    bueno = ESCALERA[m]
                    hi = m - 1
            suelo[f.stem] = bueno
            marca = "—" if bueno is None else f"{bueno:>4} mm"
            print(f"  {marca}  {f.stem}")
        b.close()

    sin_suelo = [k for k, v in suelo.items() if v is None]
    SALIDA.write_text(json.dumps(suelo, ensure_ascii=False, indent=1, sort_keys=True))
    print(f"\n{len(suelo)} piezas · {SALIDA.name}")
    if sin_suelo:
        # Estas no las arregla el reparto: ni al máximo de la escalera
        # imprimen, así que es trabajo de dibujo.
        print(f"⛔ {len(sin_suelo)} no pasan ni a {ESCALERA[-1]} mm — es el DIBUJO, no el tamaño:")
        for k in sin_suelo:
            print(f"   · {k}")
    altos = [v for v in suelo.values() if v and v > 11]
    print(f"⚠️  {len(altos)} piezas necesitan más de 11 mm")
    return 0


if __name__ == "__main__":
    sys.exit(main())
