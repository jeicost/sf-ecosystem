#!/usr/bin/env python3
"""
Exporta la proporción (ancho/alto) del arte real a `web/lib/proporciones.ts`.

    python3 exportar-proporciones.py

El empaquetador de la botella (components/Botella.tsx) necesita saber cuánto
ocupa cada pieza ANTES de pintarla: si compone una fila a ciegas, el ancho
real solo aparece en el navegador y la densidad sale despareja. Se ejecuta al
final de la tubería, después de `ajustar-viewbox.py`.
"""
import glob
import os
import re
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
ICONOS = AQUI.parent.parent / "web" / "public" / "iconos"
SALIDA = AQUI.parent.parent / "web" / "lib" / "proporciones.ts"


def main() -> int:
    rel = {}
    for f in sorted(glob.glob(str(ICONOS / "*.svg"))):
        svg = open(f).read()
        m = re.search(r'viewBox="([-\d.]+) ([-\d.]+) ([\d.]+) ([\d.]+)"', svg)
        if not m:
            print(f"  ✗ {os.path.basename(f)}: sin viewBox")
            continue
        rel[os.path.basename(f)[:-4]] = round(float(m.group(3)) / float(m.group(4)), 4)

    lineas = [
        "/**",
        " * La PROPORCIÓN (ancho/alto) del arte real de cada pieza, generada por",
        " * `diseno/iconos/exportar-proporciones.py` desde los SVG ceñidos.",
        " *",
        " * El empaquetador necesita saber cuánto ocupa cada pieza ANTES de pintarla:",
        " * sin esto, una fila se compone a ciegas y el ancho real solo se descubre en",
        " * el navegador — que es justo lo que hacía que la densidad fuera despareja.",
        " * NO se edita a mano: se regenera al pasar la tubería de arte.",
        " */",
        "export const PROPORCION: Record<string, number> = {",
    ]
    lineas += [f'  "{k}": {v},' for k, v in rel.items()]
    lineas.append("};")
    SALIDA.write_text("\n".join(lineas) + "\n")
    print(f"{len(rel)} proporciones → {SALIDA}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
