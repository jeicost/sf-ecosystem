"""
La ÚNICA verdad sobre a qué altura se imprime cada pieza.

Se lee de `diseno/generar-desarrollo.mjs` (bandas del cilindro y filas del
hombro), que es el arte de referencia que va al taller. `normalizar-trazo.py`
y `medir-imprimibilidad.py` importan de aquí: si hubiera dos mapas, uno de
los dos mentiría — ya pasó, la normalización asumía piezas de 17,4 mm cuando
el desarrollo las imprime a 11 y todo salía un 60 % más fino de lo prometido.
"""
import re
from pathlib import Path

AQUI = Path(__file__).resolve().parent

ALTO_LAGRIMOMETRO_MM = 84.0   # la columna-instrumento, a su carril del plano
ALTO_REMATE_MM = 4.6          # los remates solo viven en la botella

_GEN = (AQUI.parent / "generar-desarrollo.mjs").read_text()
_MAPA_WEB = (AQUI.parent.parent / "web" / "lib" / "iconos.ts").read_text()

ALTURA_MM: dict[str, float] = {}

_bandas = re.search(r"const BANDAS = \[(.*?)\n\];", _GEN, re.S).group(1)
for _alto, _ns in re.findall(r"\[(\d+), \[([\d, ]+)\]\]", _bandas):
    for _n in re.findall(r"\d+", _ns):
        ALTURA_MM[_n] = float(_alto)

_hombro = re.search(r"const HOMBRO_FILAS = \[(.*?)\n\];", _GEN, re.S).group(1)
for _alto, _ancho, _ns in re.findall(r"\[([\d.]+), (\d+), \[([\d, ]+)\]\]", _hombro):
    for _n in re.findall(r"\d+", _ns):
        ALTURA_MM[_n] = float(_alto)

ALTURA_MM["54"] = ALTO_LAGRIMOMETRO_MM


def alto_impreso_mm(slug: str) -> float:
    """Altura de impresión de una pieza por su nombre de fichero (sin .svg)."""
    if slug.startswith("r-"):
        return ALTO_REMATE_MM
    m = re.match(r"(\d+)-", slug)
    if m:
        n = m.group(1).lstrip("0") or "0"
        if n in ALTURA_MM:
            return ALTURA_MM[n]
    m2 = re.search(rf'(\d+): "{re.escape(slug)}"', _MAPA_WEB)
    if m2 and m2.group(1) in ALTURA_MM:
        return ALTURA_MM[m2.group(1)]
    return 11.0
