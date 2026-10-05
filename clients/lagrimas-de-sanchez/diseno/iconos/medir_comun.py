#!/usr/bin/env python3
"""
El medidor de imprimibilidad, compartido.

Vive aparte porque lo usan DOS herramientas —`medir-imprimibilidad.py`, que
levanta el informe para el taller, y `medir-suelo.py`, que busca la altura
mínima de cada pieza— y porque una medición duplicada a mano es una medición
que deriva: el día que se afine el criterio de «rota» tiene que afinarse en
los dos sitios a la vez o los dos números dejan de hablar del mismo arte.
"""
import base64
import io

import numpy as np
from PIL import Image
from scipy import ndimage

from pathlib import Path

AQUI = Path(__file__).resolve().parent
ICONOS = AQUI.parent.parent / "web" / "public" / "iconos"

ESTRICTO_MM = 0.8
MALLA_FINA_MM = 0.35
RES = 40                 # px por mm al rasterizar (0,025 mm/px)


def medir(mask_tinta: np.ndarray, radio_px: int) -> tuple[float, float, int]:
    """(% tinta perdida, % calado cerrado, nº de islas de tinta que desaparecen)."""
    est = ndimage.generate_binary_structure(2, 1)
    disco = np.zeros((radio_px * 2 + 1, radio_px * 2 + 1), bool)
    yy, xx = np.ogrid[-radio_px:radio_px + 1, -radio_px:radio_px + 1]
    disco[yy * yy + xx * xx <= radio_px * radio_px] = True

    tinta = mask_tinta.sum()
    if not tinta:
        return 0.0, 0.0, 0
    fina = mask_tinta & ~ndimage.binary_opening(mask_tinta, disco)
    perdida = fina.sum() / tinta * 100

    # islas enteras que desaparecen (un remate, una tilde, una pata)
    et, n = ndimage.label(mask_tinta, est)
    abierta = ndimage.binary_opening(mask_tinta, disco)
    islas_muertas = 0
    for i in range(1, n + 1):
        isla = et == i
        if not (abierta & isla).any():
            islas_muertas += 1

    # contraformas: huecos que no tocan el borde. Un hueco cuenta como
    # CERRADO solo si la tinta dilatada lo cubre ENTERO — medir el área
    # tocada contaba el anillo del borde y daba 90 % en ojales que seguían
    # perfectamente abiertos.
    fondo = ~mask_tinta
    etf, nf = ndimage.label(fondo, est)
    borde = set(etf[0]) | set(etf[-1]) | set(etf[:, 0]) | set(etf[:, -1])
    ids_huecos = [i for i in range(1, nf + 1) if i not in borde]
    if ids_huecos:
        dilatada = ndimage.binary_dilation(mask_tinta, disco)
        area_total, area_cerrada = 0, 0
        for i in ids_huecos:
            hueco = etf == i
            a = hueco.sum()
            area_total += a
            if not (hueco & ~dilatada).any():
                area_cerrada += a
        pct_cerrado = area_cerrada / area_total * 100 if area_total else 0.0
        # El IMPACTO distingue el ojal de un rotulito (micro, se empasta y
        # queda como textura — la referencia está llena de eso) del calado
        # que LLEVA el chiste (PUCHERAZO, una pantalla, una caja calada):
        # área cerrada medida contra la tinta de la pieza.
        impacto = area_cerrada / max(tinta, 1) * 100
    else:
        pct_cerrado, impacto = 0.0, 0.0
    return perdida, pct_cerrado, impacto, islas_muertas


def rasterizar(pg, svg: str, mm: float) -> "np.ndarray":
    """La pieza, a su altura impresa, como máscara de tinta.

    data-URI y no file://: una página about:blank tiene prohibido cargar
    subrecursos file:// y el <img> roto medía SIEMPRE el glifo de imagen
    rota — 67 piezas con números idénticos.
    """
    uri = "data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode()
    pg.set_content(
        f'<body style="margin:0;background:#000">'
        f'<img src="{uri}" style="height:{max(24, round(mm * RES))}px;display:block">'
    )
    pg.wait_for_timeout(60)
    img = pg.locator("img").screenshot()
    return np.asarray(Image.open(io.BytesIO(img)).convert("L")) > 96


def rota(perdida: float, cerrado: float, impacto: float, islas: int) -> bool:
    """El veredicto de ROTA en malla fina, en un solo sitio.

    Islas solas no condenan: perder puntadas y ojales de calado es textura
    que se va, no pieza rota — la referencia está llena de eso. Rota = pierde
    TINTA de verdad o se le cierra el calado que LLEVA el chiste.
    """
    return perdida > 14 or impacto > 8 or (islas > 4 and perdida > 10)
