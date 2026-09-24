"""
La ÚNICA verdad sobre a qué altura se imprime cada pieza.

La escribe `diseno/generar-desarrollo.mjs` en `diseno/alturas-impresion.json`
al montar la lámina, porque es quien de verdad lo decide: desde que el
desarrollo empaqueta en filas justificadas con autoajuste, la altura de una
pieza depende de toda la cola y ninguna tabla escrita a mano puede seguirle
el ritmo (la anterior asumía 17,4 mm donde el plano imprimía 11).

La leen `normalizar-trazo.py`, `verificar-arte.py` y `medir-imprimibilidad.py`.
Si el JSON no existe todavía se estima y AVISA: hay que pasar
`node generar-desarrollo.mjs` antes que la puerta de arte.
"""
import json
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
_JSON = AQUI.parent / "alturas-impresion.json"

ALTO_POR_DEFECTO_MM = 11.0

if _JSON.exists():
    ALTURA_MM: dict = json.loads(_JSON.read_text())
else:
    ALTURA_MM = {}
    print(
        "  ⚠️  falta diseno/alturas-impresion.json — pasa antes "
        f"`node generar-desarrollo.mjs`; mientras, se estima a {ALTO_POR_DEFECTO_MM} mm",
        file=sys.stderr,
    )


def alto_impreso_mm(slug: str) -> float:
    """Altura de impresión de una pieza por su nombre de fichero (sin .svg)."""
    return ALTURA_MM.get(slug, ALTO_POR_DEFECTO_MM)
