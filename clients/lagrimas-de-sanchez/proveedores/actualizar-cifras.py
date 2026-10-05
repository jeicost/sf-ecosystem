#!/usr/bin/env python3
"""
Pone al día las cifras de imprimibilidad de la especificación, desde la medición.

    python3 actualizar-cifras.py      (lo llama solo generar-pdf.py)

POR QUÉ EXISTE. La especificación le cuenta al taller cuántas piezas entran en
cada escenario de malla, y esas cifras cambian cada vez que se toca el arte.
Escritas a mano duran un día: el 29 de septiembre decían 5 piezas rotas y a
las 24 horas ya eran 6. Un documento que sale de casa citando mediciones se
genera del fichero que las mide, o miente sin avisar.
"""
import json
import re
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
INFORME = AQUI.parent / "diseno" / "INFORME-IMPRIMIBILIDAD.md"
ALTURAS = AQUI.parent / "diseno" / "alturas-impresion.json"
SPEC = AQUI / "ESPECIFICACION-TECNICA-SERIGRAFIA.md"


def cuenta() -> dict:
    t = INFORME.read_text()
    filas = re.findall(r"^\|\s*[\w-]+\s*\|.*\|\s*([✓⛔⚠️△][^|]*)\|\s*$", t, re.M)
    c = {"limpias": 0, "riesgo": 0, "fina": 0, "rotas": 0}
    for v in filas:
        if v.startswith("⛔"):
            c["rotas"] += 1
        elif v.startswith("⚠️"):
            c["fina"] += 1
        elif v.startswith("△"):
            c["riesgo"] += 1
        else:
            c["limpias"] += 1
    c["total"] = sum(c[k] for k in ("limpias", "riesgo", "fina", "rotas"))
    return c


def main() -> int:
    if not INFORME.exists():
        print(f"no encuentro {INFORME}", file=sys.stderr)
        return 1
    c = cuenta()
    if not c["total"]:
        print("el informe no tiene filas legibles — no toco la especificación", file=sys.stderr)
        return 1
    entran = c["total"] - c["rotas"]
    rotas = (f"**{c['rotas']} piezas**, y las estamos rehaciendo" if c["rotas"]
             else "**ninguna** — las " + str(c["total"]) + " entran")
    tabla = (
        "| **Estricto** | 0,80 mm | "
        f"{c['limpias']} piezas limpias · {c['riesgo']} con riesgo asumible |\n"
        "| **Malla fina** | 0,35 mm | "
        f"{c['fina']} piezas más entran sin problema — {entran} de {c['total']} en total |\n"
        f"| **Rotas en ambos** | — | {rotas} |"
    )
    t = SPEC.read_text()
    nuevo, n = re.subn(
        r"\| \*\*Estricto\*\* \|.*?\| \*\*Rotas en ambos\*\* \|[^\n]*\|",
        tabla, t, flags=re.S)
    if n != 1:
        print("no encuentro la tabla de escenarios en la especificación", file=sys.stderr)
        return 1
    # La frase que cuelga de la tabla lleva la misma cifra.
    nuevo = re.sub(r"tenemos \d+ piezas que redibujar",
                   f"tenemos {c['fina']} piezas que redibujar", nuevo)
    # Y las alturas, del fichero que las escribe el generador del desarrollo.
    if ALTURAS.exists():
        v = sorted(x for x in json.loads(ALTURAS.read_text()).values() if x)
        if v:
            nuevo = re.sub(
                r"de \*\*[\d,]+ mm\*\* la pieza más pequeña a \*\*[\d,]+ mm\*\*\n"
                r"la columna vertical del instrumento, con una \*\*mediana de [\d,]+ mm\*\*",
                f"de **{v[0]:.1f} mm**".replace(".", ",") + " la pieza más pequeña a "
                + f"**{v[-1]:.0f} mm**\nla columna vertical del instrumento, con una "
                + f"**mediana de {v[len(v)//2]:.1f} mm**".replace(".", ","),
                nuevo)
    if nuevo != t:
        SPEC.write_text(nuevo)
    print(f"  cifras: {c['limpias']} limpias · {c['riesgo']} riesgo · "
          f"{c['fina']} malla fina · {c['rotas']} rotas (de {c['total']})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
