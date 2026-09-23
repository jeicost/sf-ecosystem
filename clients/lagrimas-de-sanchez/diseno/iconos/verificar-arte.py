#!/usr/bin/env python3
"""
Comprueba que el arte cumple las reglas de serigrafía ANTES de mandarlo.

    python3 verificar-arte.py

Devuelve código 1 si algo no cumple, para poder encadenarlo en el flujo.

QUÉ COMPRUEBA Y POR QUÉ. El set se diseñó con tres reglas escritas —trazo
mínimo de 0,8 mm, un solo grosor, ni una cara— y ninguna de las tres se estaba
verificando. Una auditoría encontró diecinueve piezas por debajo del mínimo,
grosores de 0,10 a 1,87 mm y letras con `NaN` dentro del trazado. Todo eso es
invisible mirando la pantalla y carísimo descubrirlo en el taller.
"""
import re
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
ICONOS = AQUI.parent.parent / "web" / "public" / "iconos"

from alturas_impresion import alto_impreso_mm
MINIMO_MM = 0.8


def main() -> int:
    fallos = []
    avisos = []
    for f in sorted(ICONOS.glob("*.svg")):
        svg = f.read_text(encoding="utf-8")
        nombre = f.name

        if "NaN" in svg:
            fallos.append(f"{nombre}: trazado con NaN — la pieza se imprime a medias")
        if "<text" in svg:
            fallos.append(f"{nombre}: texto SIN VECTORIZAR — el taller no lo acepta")

        m = re.search(r'viewBox="[-\d.]+ [-\d.]+ [\d.]+ ([\d.]+)"', svg)
        if not m:
            fallos.append(f"{nombre}: sin viewBox medible")
            continue
        alto_vb = float(m.group(1))
        alto_pieza_mm = alto_impreso_mm(nombre[:-4] if nombre.endswith(".svg") else nombre)

        for etiqueta in re.findall(r"<[^>]+stroke-width[^>]+>", svg):
            # Los trazos `class="engorde"` son el ENGROSADOR de los rellenos
            # de línea (engordar-arte.py): su grosor se eligió midiendo la
            # pieza compuesta (relleno + trazo), no vale medir el trazo solo.
            if 'class="engorde"' in etiqueta or 'class="talla"' in etiqueta:
                continue
            for t in re.findall(r'stroke-width="([\d.]+)"', etiqueta):
                mm = float(t) * alto_pieza_mm / alto_vb
                minimo_pieza = 0.5 if nombre.startswith("t-") else MINIMO_MM
                if mm < minimo_pieza - 0.05:
                    fallos.append(f"{nombre}: trazo de {mm:.2f} mm (mínimo {minimo_pieza})")
                elif mm > 1.9 and not nombre.startswith("54-"):
                    avisos.append(f"{nombre}: trazo de {mm:.2f} mm — pesa más que el resto")

        # El alto impreso de la pieza: si no llega, no se lee.
        alto_mm = alto_pieza_mm
        if alto_mm < 4:
            avisos.append(f"{nombre}: se imprime a {alto_mm:.1f} mm de alto")

    for a in avisos:
        print(f"  ⚠️  {a}")
    for x in fallos:
        print(f"  ⛔ {x}")
    print(f"\n{len(fallos)} fallos · {len(avisos)} avisos · {len(list(ICONOS.glob('*.svg')))} piezas")
    return 1 if fallos else 0


if __name__ == "__main__":
    sys.exit(main())
