#!/usr/bin/env python3
"""
Compone las piezas de SOLO TEXTO del estampado, con sus tratamientos.

    python3 componer-texto.py            escribe las piezas
    python3 componer-texto.py --ver      dice qué haría

POR QUÉ UN GENERADOR Y NO 24 FICHEROS A MANO. La variedad del estampado tiene
que ser DELIBERADA, no accidental: ocho tratamientos repartidos a propósito,
ninguno tocando a otro igual. Eso se gobierna desde una tabla, no acordándose
de lo que hiciste hace veinte ficheros. Y cuando el dueño cambie una frase, la
pieza se regenera con su tratamiento intacto.

LOS OCHO TRATAMIENTOS salen de mirar la referencia (El Xitxarel·lo) pieza a
pieza: en un palmo de vidrio conviven nueve maneras distintas de poner una
palabra. Esa es la textura, y no se consigue con densidad — se consigue con
VARIEDAD sobre una sola tinta. Ver diseno/PROPUESTA-NIVEL-XITXARELLO.md.

Se mide en el navegador, con las fuentes cargadas, porque dónde acaba un
<text> no se calcula leyendo el fichero: los contenedores (cajas, sellos,
banderines) tienen que ceñirse al texto de verdad o el resultado es una caja
que baila.
"""
import argparse
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

AQUI = Path(__file__).resolve().parent
ICONOS = AQUI.parent.parent / "web" / "public" / "iconos"

TINTA = "#F6F1E6"

# El trazo que ENSANCHA el texto calado de las cajas: a 5,5-6 mm en el
# hombro las contraformas se cerraban (medido); con esto la palabra tallada
# respira aunque sus ojales internos se llenen — el mismo trato que la
# referencia da a su micro-texto calado.
# El ancho REAL lo pone normalizar-trazo.py (0,28 mm exactos a la altura de
# impresión de cada pieza): aquí solo se marca. El mínimo ciego de texto
# (0,5 mm) soldaba FACHA y las cajas del hombro en bloque ilegible.
TALLA_ANCHA = 'class="talla" stroke="#000" stroke-width="2" stroke-linejoin="round" letter-spacing="2.5"' 

# Los registros tipográficos. Siete voces con las cuatro familias que la web
# YA carga: cero bytes nuevos. El octavo (píxel) no es una fuente, se dibuja.
VOCES = {
    "cond":    ('font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700"', 1.0),
    "cond-lig":('font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="400"', 1.0),
    "serif":   ('font-family="Bodoni Moda, Didot, Georgia, serif" font-weight="700"', 0.92),
    "serif-it":('font-family="Bodoni Moda, Didot, Georgia, serif" font-style="italic"', 0.92),
    "redonda": ('font-family="Libre Franklin, Helvetica Neue, Arial, sans-serif" font-weight="800"', 0.80),
    "mono":    ('font-family="IBM Plex Mono, ui-monospace, monospace" font-weight="600"', 0.78),
    # El registro de ROTULISTA, para las palabras ancla. Es lo que separa una
    # palabra DIBUJADA de una palabra COMPUESTA, y era la diferencia de fondo
    # con la referencia: sus astas tienen flare y sus formas están apretadas
    # como un letrero pintado; Barlow es limpia y moderna.
    "cartel":  ('font-family="Staatliches" font-weight="400"', 1.12),
}

# ── Dígitos de píxeles ────────────────────────────────────────────────────
# Una cifra en bitmap dentro de una frase en condensada es el golpe de vista
# que más recuerda la referencia (allí es "TÈTRIC"). Diez glifos de 4×7
# bastan: solo se usa en las piezas que llevan número.
PIXELES = {
    "0": ["1111", "1001", "1001", "1001", "1001", "1001", "1111"],
    "1": ["0010", "0110", "0010", "0010", "0010", "0010", "0111"],
    "2": ["1111", "0001", "0001", "1111", "1000", "1000", "1111"],
    "3": ["1111", "0001", "0001", "0111", "0001", "0001", "1111"],
    "4": ["1001", "1001", "1001", "1111", "0001", "0001", "0001"],
    "5": ["1111", "1000", "1000", "1111", "0001", "0001", "1111"],
    "6": ["1111", "1000", "1000", "1111", "1001", "1001", "1111"],
    "7": ["1111", "0001", "0001", "0010", "0010", "0100", "0100"],
    "8": ["1111", "1001", "1001", "1111", "1001", "1001", "1111"],
    "9": ["1111", "1001", "1001", "1111", "0001", "0001", "1111"],
}


def pixeles(texto: str, x: float, y: float, u: float) -> tuple[str, float]:
    """Dibuja una cifra con rectángulos. Devuelve (svg, ancho)."""
    partes, cx = [], x
    for ch in texto:
        if ch not in PIXELES:
            cx += u * 2
            continue
        for fila, bits in enumerate(PIXELES[ch]):
            inicio = None
            for col in range(len(bits) + 1):
                encendido = col < len(bits) and bits[col] == "1"
                if encendido and inicio is None:
                    inicio = col
                elif not encendido and inicio is not None:
                    partes.append(
                        f'<rect x="{cx + inicio*u:.1f}" y="{y + fila*u:.1f}" '
                        f'width="{(col-inicio)*u:.1f}" height="{u*1.08:.1f}"/>'
                    )
                    inicio = None
        cx += u * 5
    return "".join(partes), cx - x - u


# ── El inventario y su tratamiento ────────────────────────────────────────
# n, slug, líneas de texto, tratamiento, voz.
# El reparto está pensado para que dos piezas del mismo tratamiento no caigan
# juntas en la retícula y para que el tratamiento DIGA algo de la frase: lo
# solemne en serif, lo burocrático en mono, el mantra en caja maciza.
PIEZAS = [
    # Era "sello" y la palabra quedaba a 1,2 mm dentro del aro: ilegible en
    # cualquier malla (medido). En hueca va a toda caja, como MEMA.
    (16, "t-hermanisimo",       ["HERMANÍSIMO"],                          "arco",    "cartel"),
    (19, "t-rufian",            ["rufián", "s. m."],                      "diccio",  "serif"),
    (20, "t-mema",              ["MEMA"],                                 "revuelto","cartel"),
    (21, "t-patxi-verguenza-ajena", ["PATXI", "VERGÜENZA", "AJENA"],      "desnuda", "cond"),
    (22, "t-al-menos-no-gobierna-la-ultraderecha",
         ["AL MENOS NO", "GOBIERNA LA", "ULTRADERECHA"],                  "desnuda", "cond"),
    (23, "t-no-dormiria-tranquilo", ["NO DORMIRÍA", "TRANQUILO"],         "desnuda", "cartel"),
    (24, "t-espana-va-como-un-cohete", ["ESPAÑA VA", "COMO UN COHETE"],   "desnuda", "cartel"),
    (25, "t-son-las-5-y-no-he-comido", ["SON LAS", "5", "Y NO HE COMIDO"], "cifra-fila","cond"),
    # La referencia NO tiene placas macizas: sus masas blancas son iconos.
    # FACHA pasa de caja a TAMPÓN de contorno, como su banderín TABALOT.
    (26, "t-facha",             ["FACHA"],                                "tampon",  "cartel"),
    (27, "t-yo-estoy-bien",     ["YO ESTOY", "BIEN"],                     "desnuda", "cartel"),
    (28, "t-por-7-votos",       ["POR", "7", "VOTOS"],                    "cifra-fila","cartel"),
    (29, "t-fiscal-soplon",     ["FISCAL", "SOPLÓN"],                     "sello",   "cartel"),
    (30, "t-ecologetas",        ["Ecologetas"],                           "sustituida","redonda"),
    (31, "t-soy-feminista-porque-soy-socialista",
         ["SOY FEMINISTA", "PORQUE SOY", "SOCIALISTA"],                   "desnuda", "cond"),
    (44, "t-alma-socialista-mente-de-tiburon",
         ["ALMA SOCIALISTA,", "MENTE DE TIBURÓN"],                        "desnuda", "cartel"),
    (45, "t-transversal-como-el-iva", ["TRANSVERSAL,", "COMO EL IVA"],    "regla",   "cartel"),
    (46, "t-horizonte-2030-legislatura-2027",
         ["HORIZONTE", "2030", "LEGISLATURA", "2027"],                "contador-fila","cond"),
    (47, "t-compromiso-firme-hasta-nueva-orden",
         ["COMPROMISO", "FIRME HASTA", "NUEVA ORDEN"],                    "desnuda", "cond"),
    (48, "t-escucha-activa-decision-tomada",
         ["ESCUCHA ACTIVA,", "DECISIÓN TOMADA"],                          "acta",    "mono"),
    (49, "t-resiliente-o-sea-que-aguantas",
         # Era "hueca" y a tres líneas el contorno (inflado por el mínimo de
         # trazo impreso) soldaba las líneas entre sí. La hueca solo vive en
         # MEMA: una línea y pintada grande.
         ["RESILIENTE,", "O SEA, QUE", "AGUANTAS"],                       "desnuda", "cartel"),
    (50, "t-transparencia-total-previa-cita",
         ["TRANSPARENCIA", "TOTAL,", "PREVIA CITA"],                      "desnuda", "cond"),
    (51, "t-el-pueblo-primero-despues-de-mi",
         ["EL PUEBLO PRIMERO.", "DESPUÉS DE MÍ."],                        "desnuda", "cartel"),
    (52, "t-cambio-de-opinion-no-de-sueldo",
         ["CAMBIO DE", "OPINIÓN,", "NO DE SUELDO"],                       "desnuda", "cond"),
    (53, "t-vocacion-de-servicio-nomina-de-por-vida",
         ["Vocación de servicio,", "nómina de por vida"],                 "solemne", "serif-it"),
]



# ── Los pictogramas de las frases ─────────────────────────────────────────
# (24-sep, tras estudiar diseno/referencias/xixarel-2.png con lupa.) En la
# referencia CADA palabra lleva dibujo: barco sobre FILIBUSTER, percha sobre
# PENJAT, la palabra dentro de la cabeza, tijeras al lado, el € dentro de
# GARR€PA. Y NO HAY placas macizas: las masas blancas son los ICONOS, nunca
# cajas de texto. Cada dibujo vive en su caja local (ancho, alto, svg) y se
# coloca ENCIMA, AL LADO o FLANQUEANDO el texto ya medido.
def _dibujos(T):
    R = {}
    # 16 HERMANÍSIMO — cadena de muñecos de papel cogidos de las manos
    # un cable que se bifurca en dos clavijas idénticas — «enchufado», y hermanísimo
    R[16] = ("arriba", 124, 78, f'''<path fill="{T}" fill-rule="evenodd" d="M52 13 C58 7 64 6 72 6 H89 C95 6 99 9 99 14 V26 C99 31 95 34 89 34 H72 C64 34 58 33 52 27 Z M82 12 h6 a3 3 0 0 1 3 3 v10 a3 3 0 0 1 -3 3 h-6 a3 3 0 0 1 -3 -3 v-10 a3 3 0 0 1 3 -3 z"/>
<rect x="97" y="12" width="19" height="6" rx="3" fill="{T}"/>
<rect x="97" y="23" width="19" height="6" rx="3" fill="{T}"/>
<path fill="{T}" fill-rule="evenodd" d="M50 49 C56 43 62 42 70 42 H91 C97 42 101 45 101 50 V66 C101 71 97 74 91 74 H70 C62 74 56 73 50 67 Z M83 50 h6 a3 3 0 0 1 3 3 v10 a3 3 0 0 1 -3 3 h-6 a3 3 0 0 1 -3 -3 v-10 a3 3 0 0 1 3 -3 z"/>
<rect x="99" y="49" width="20" height="6.5" rx="3.2" fill="{T}"/>
<rect x="99" y="61" width="20" height="6.5" rx="3.2" fill="{T}"/>
<path fill="none" stroke="{T}" stroke-width="6.5" stroke-linecap="round" d="M53 20 C42 20 37 28 31 34 C27 38 24 39 20 39.5"/>
<path fill="none" stroke="{T}" stroke-width="6.5" stroke-linecap="round" d="M51 58 C41 58 36 50 30 44 C26 40 24 39.5 20 39.5"/>
<path fill="none" stroke="{T}" stroke-width="6.5" stroke-linecap="round" d="M21 39.5 C12 39.5 4 42 4 33 C4 25 12 23 16 28"/>''')
    # 21 PATXI — facepalm: la palma por delante de la cara
    # el facepalm de verdad: la mano POR DELANTE de la cara, dedos separados y un ojo mirando por la rendija
    # 21 PATXI — facepalm: la palma por delante de la cara
    R[21] = ("lado-izq", 88, 86, f'''
      <path fill="{T}" fill-rule="evenodd" d="M44 2 a40 40 0 1 1 -0.1 0 Z
        M28 26 a5.5 5.5 0 1 0 0.1 0 Z M60 26 a5.5 5.5 0 1 0 0.1 0 Z"/>
      <path fill="{T}" stroke="#141708" stroke-width="0" fill-rule="evenodd"
        d="M10 50 q0 -10 10 -11 l0 -6 q0 -7 7 -7 q6 0 7 6 q1 -7 8 -7 q7 0 8 7 q1 -6 7 -6 q7 0 7 7 l0 6 q10 1 10 11 l0 14 q0 22 -32 22 q-32 0 -32 -22 Z
        M24 40 l5 0 0 20 -5 0 Z M37 38 l5 0 0 22 -5 0 Z M50 40 l5 0 0 20 -5 0 Z"/>''')
    # 22 AL MENOS NO GOBIERNA… — extintor, por si acaso
    # una tirita: la herida sigue ahí, pero al menos hay tirita — el mal menor hecho objeto
    # una tirita: la herida sigue ahí, pero al menos hay tirita. Sin
    # escotaduras en el talle (parecía papel rasgado) y con RANURAS en vez
    # una tirita: la herida sigue ahí, pero al menos hay tirita. Lo que la
    # hace legible no es el detalle, es la PROPORCIÓN: cuadrada leía un dado
    # y con escotaduras en el talle, un papel rasgado. Larga y estrecha, con
    # la gasa calada en el centro y dos ranuras a cada lado.
    R[22] = ("lado-izq", 60, 108, f'''<g transform="rotate(-30 30 54)">
      <path fill="{T}" fill-rule="evenodd"
        d="M2 16 q0 -14 15 -14 l14 0 q15 0 15 14 l0 72 q0 14 -15 14 l-14 0 q-15 0 -15 -14 Z
           M11 36 l26 0 0 32 -26 0 Z"/>
      <g fill="{T}">
        <rect x="15" y="41" width="4" height="9" rx="2"/><rect x="29" y="41" width="4" height="9" rx="2"/>
        <rect x="15" y="54" width="4" height="9" rx="2"/><rect x="29" y="54" width="4" height="9" rx="2"/>
      </g>
    </g>''')
    # 23 NO DORMIRÍA TRANQUILO — el ojo que no se cierra
    # antifaz de dormir con dos ojazos abiertos pintados encima
    R[23] = ("arriba", 132, 66, f'''<path fill="{T}" fill-rule="evenodd" d="M 18 30 C 18 16 36 8 66 8 C 96 8 114 16 114 31 C 114 46 104 58 92 58 C 82 58 76 45 66 45 C 56 45 50 58 40 58 C 28 58 18 45 18 30 Z M 35 30.5 C 38 21.5 42.5 18.5 46.8 18.5 C 51.2 18.5 55 21.5 57.5 30.5 C 55 38.5 51.2 42 46.8 42 C 42.5 42 38 38.5 35 30.5 Z M 46.8 21.6 C 49.6 21.6 51.9 23.9 51.9 26.7 C 51.9 29.5 49.6 31.8 46.8 31.8 C 44 31.8 41.7 29.5 41.7 26.7 C 41.7 23.9 44 21.6 46.8 21.6 Z M 74 30 C 77 20.5 82 17.5 86.8 17.5 C 91.6 17.5 95.7 21 98 30 C 95.7 38.5 91.6 42.5 86.8 42.5 C 82 42.5 77 39 74 30 Z M 87.4 20.4 C 90.5 20.4 93 22.9 93 26 C 93 29.1 90.5 31.6 87.4 31.6 C 84.3 31.6 81.8 29.1 81.8 26 C 81.8 22.9 84.3 20.4 87.4 20.4 Z"/><path fill="none" stroke="{T}" stroke-width="7.5" stroke-linecap="round" d="M 21 26 C 13 20 8 21 4.2 27"/><path fill="none" stroke="{T}" stroke-width="7.5" stroke-linecap="round" d="M 111 30 C 121 26 127 30 127.8 39"/>''')
    # 24 ESPAÑA VA COMO UN COHETE — el cohete, claro
    # un CARACOL bajo «España va como un cohete» — el desmentido mudo del titular
    R[24] = ("abajo", 72.6, 49, f'''<g transform="translate(-19.5,-2.5)"><path fill="{T}" fill-rule="evenodd" d="M28.5,21a19.5,18.4 0 1,1 39.0,0a19.5,18.4 0 1,1 -39.0,0ZM40.1,17.1L40.5,16.0L41.1,14.9L41.9,13.9L42.8,13.0L43.9,12.3L45.1,11.8L46.4,11.4L47.8,11.3L49.2,11.3L50.6,11.6L51.9,12.2L53.2,12.9L54.3,13.8L55.3,14.9L56.1,16.2L56.7,17.6L57.1,19.1L57.3,20.7L57.1,22.3L56.8,23.9L56.2,25.4L55.3,26.8L54.2,28.1L53.0,29.2L51.5,30.1L49.9,30.8L48.2,31.2L46.4,31.4L44.6,31.2L42.8,30.8L41.1,30.1L39.5,29.1L38.1,27.9L36.9,26.5L35.9,24.8L35.1,23.0L34.7,21.1L34.5,19.1L34.7,17.1L35.2,15.1L36.0,13.2L37.1,11.5L38.4,9.9L40.0,8.5L41.9,7.4L43.9,6.6L46.0,6.1L48.2,6.0L50.4,6.2L52.6,6.7A2.1,2.1 0 0 1 51.0,10.6L49.4,10.3L47.9,10.2L46.4,10.3L44.9,10.7L43.5,11.3L42.3,12.1L41.2,13.1L40.3,14.2L39.6,15.4L39.1,16.7L38.8,18.1L38.7,19.4L38.8,20.7L39.2,22.0L39.7,23.2L40.4,24.2L41.3,25.2L42.2,25.9L43.3,26.5L44.4,26.9L45.6,27.1L46.7,27.2L47.8,27.0L48.9,26.7L49.9,26.3L50.7,25.7L51.5,24.9L52.1,24.1L52.6,23.2L52.9,22.3L53.1,21.4L53.1,20.4L52.9,19.5L52.6,18.6L52.2,17.9L51.7,17.2L51.1,16.6L50.5,16.1L49.8,15.8L49.0,15.5L48.3,15.4L47.5,15.5L46.8,15.6L46.2,15.8L45.6,16.2L45.1,16.6L44.6,17.1L44.3,17.6L44.1,18.1L44.0,18.7A2.1,2.1 0 0 1 40.1,17.1Z"/><path fill="{T}" d="M19.8,45.2 C23.2,39.9 32.5,37.9 44,37.9 L63,37.9 C69,37.9 72,35.4 75,31.9 C78,27.9 84,26.3 87.6,28.9 C91,31.5 90.6,35.9 88,39.3 C85.6,42.5 84.6,45.3 84.6,47.9 C84.6,49.9 83,51.1 81,51.1 L31,51.4 C25.4,51.4 18.4,50.4 19.8,45.2 Z"/><path fill="{T}" d="M85.4,29.6L85.9,28.0L86.4,26.6L86.9,25.1L87.4,23.7L87.9,22.4L88.3,21.0L88.8,19.7L89.3,18.3L89.7,17.0L90.2,15.6L90.6,14.3L89.1,12.2L89.1,12.2L86.6,12.9L86.1,14.2L85.7,15.6L85.2,16.9L84.7,18.2L84.2,19.5L83.7,20.9L83.2,22.2L82.7,23.6L82.1,25.0L81.6,26.5L81.0,28.0Z"/><path fill="{T}" d="M79.9,30.5L79.7,29.0L79.5,27.5L79.3,26.1L79.1,24.7L79.0,23.3L78.8,22.0L78.7,20.7L78.5,19.3L78.4,18.0L78.3,16.7L78.1,15.4L75.9,14.2L75.9,14.2L73.9,15.7L74.0,17.1L74.1,18.4L74.2,19.7L74.3,21.1L74.4,22.4L74.6,23.8L74.7,25.2L74.8,26.6L75.0,28.1L75.1,29.6L75.3,31.1Z"/><circle cx="89.1" cy="12.2" r="2.9" fill="{T}"/><circle cx="75.9" cy="14.2" r="2.9" fill="{T}"/></g>''')
    # 25 SON LAS 5 — tenedor y cuchillo flanqueando la cifra
    # el táper cerrado con su goma: el de las cinco, el que no te ha dado tiempo a abrir
    # el plato vacío visto desde arriba, a las cinco de la tarde. No hay nada que dibujar dentro: ese es el chiste
    R[25] = ("lado-der", 84, 84, f'''<path fill="{T}" fill-rule="evenodd" d="M42 0 a42 42 0 1 1 -0.1 0 Z M42 9 a33 33 0 1 0 0.1 0 Z"/>
    <path fill="{T}" fill-rule="evenodd" d="M42 16 a26 26 0 1 1 -0.1 0 Z M42 23 a19 19 0 1 0 0.1 0 Z"/>''')
    # 27 YO ESTOY BIEN — la taza humeante entre llamitas (todo bien)
    # las gafas de sol con el incendio ardiendo dentro: tres llamas gordas por cristal, no un cepillo de dientes
    R[27] = ("lado-der", 104, 74, f'''<path fill="{T}" d="M2 8 q0 -6 7 -6 l86 0 q7 0 7 6 l0 5 -100 0 Z"/>
    <path fill="{T}" fill-rule="evenodd"
      d="M4 13 l44 0 -3 42 q-1 14 -15 14 l-10 0 q-14 0 -16 -14 Z
         M13 22 q5 9 3 17 q6 -4 5 -13 q7 8 6 19 q6 -3 6 -12 q7 10 3 22 l-22 0 q-4 -18 -1 -33 Z"/>
    <path fill="{T}" fill-rule="evenodd"
      d="M56 13 l44 0 -4 42 q-2 14 -16 14 l-10 0 q-14 0 -15 -14 Z
         M65 22 q5 9 3 17 q6 -4 5 -13 q7 8 6 19 q6 -3 6 -12 q7 10 3 22 l-22 0 q-4 -18 -1 -33 Z"/>''')
    # 28 POR 7 VOTOS — la papeleta entrando en la urna
    # la urna convertida en tragaperras: sale 777
    R[28] = ("lado-der", 100, 84, f'''<path fill="{T}" fill-rule="evenodd" d="M 10 16 H 68 C 70 16 70 18 70 20 V 30 H 8 V 20 C 8 18 8 16 10 16 Z M 12 30 H 66 C 73 30 76 34 76 40 V 66 C 76 72 73 76 66 76 H 12 C 5 76 2 72 2 66 V 40 C 2 34 5 30 12 30 Z M 9 76 H 27 V 82 H 9 Z M 51 76 H 69 V 82 H 51 Z M 24 21 H 60 A 3 3 0 0 1 60 27 H 24 A 3 3 0 0 1 24 21 Z M 15 35 H 63 C 66 35 68 37 68 41 V 58 C 68 62 66 64 63 64 H 15 C 12 64 10 62 10 58 V 41 C 10 37 12 35 15 35 Z M 13 39 H 29 V 47 L 22.5 59 H 14 L 24 48 H 13 Z M 31 39 H 47 V 47 L 40.5 59 H 32 L 42 48 H 31 Z M 49 39 H 65 V 47 L 58.5 59 H 50 L 60 48 H 49 Z"/><path fill="{T}" d="M 36 6 L 49 3 L 52 8 L 53 27 L 37 27 Z"/><path fill="none" stroke="{T}" stroke-width="6" stroke-linecap="round" d="M 76 46 C 87 46 91 40 92 31"/><circle cx="92" cy="22" r="8" fill="{T}"/>''')
    # 29 FISCAL SOPLÓN — el silbato colgando junto al sello
    # el silbato de árbitro pitando de verdad: boquilla, cámara gorda, la bolita calada y tres rayas de canto
    # el silbato de árbitro, grande y de perfil, con la bolita calada y tres rayas de pitido
    R[29] = ("lado-der", 112, 76, f'''<g fill="{T}">
      <path fill-rule="evenodd"
        d="M2 26 q0 -10 11 -10 l36 0 0 14 17 0 q12 0 15 11 q7 20 -9 31 q-19 13 -39 3 q-31 -15 -31 -49 Z
           M30 48 a10 10 0 1 0 0.1 0 Z"/>
      <rect x="2" y="14" width="30" height="11" rx="5.5"/>
    </g>
    <g stroke="{T}" stroke-width="8" stroke-linecap="round" fill="none">
      <path d="M86 16 l18 -10"/><path d="M93 38 l19 0"/><path d="M88 58 l18 10"/>
    </g>''')
    # 30 Ecologetas — la hoja con enchufe
    # una huella de pie descalzo con un JET PRIVADO calado en la planta: el ecologeta predica descalzo y viaja en jet
    R[30] = ("lado-izq", 80, 100, f'''<path fill="{T}" d="M 12.8,1.2 C 18.9,1.4 22.9,5.2 22.8,9.7 C 22.7,14.4 18.1,17.7 12.1,17.6 C 6.2,17.5 2.4,13.9 2.5,9.3 C 2.6,4.6 6.9,1.0 12.8,1.2 Z"/><ellipse cx="33.6" cy="6.4" rx="7.0" ry="5.7" fill="{T}"/><ellipse cx="51.0" cy="7.6" rx="6.1" ry="5.2" fill="{T}"/><ellipse cx="66.4" cy="11.6" rx="5.6" ry="4.7" fill="{T}"/><ellipse cx="75.7" cy="21.2" rx="4.2" ry="3.8" fill="{T}"/><path fill="{T}" fill-rule="evenodd" d="M 4,46 C 3,33 13,22 30,21 C 44,20 62,23.5 71,30.5 C 77,35 79.5,42 78,48.5 C 76.5,57 69,62.5 58,65 C 43,68 24,67.5 14,61.5 C 7,57 3.5,53 4,46 Z M 66.0,42.5 L 64.0,40.3 L 57.0,39.3 L 49.0,39.0 L 34.0,29.2 L 28.4,32.9 L 37.5,39.4 L 28.0,40.1 L 17.5,35.0 L 17.5,42.5 L 17.5,50.0 L 28.0,44.9 L 37.5,45.6 L 28.4,52.1 L 34.0,55.8 L 49.0,46.0 L 57.0,45.7 L 64.0,44.7 Z"/><path fill="{T}" d="M 38,73 C 52,72.5 62.5,79 62.5,87 C 62.5,95 51.5,99.5 37,99.5 C 24,99.5 14,94 14.5,86 C 15,78.5 25,73.5 38,73 Z"/>''')
    # 31 SOY FEMINISTA… — el puño en alto
    # el puño en alto con el meñique estirado como quien sostiene la taza de té
    R[31] = ("arriba", 55, 82, f'''<mask id="m31mano" maskUnits="userSpaceOnUse" x="0" y="0" width="55" height="82"><rect x="0" y="0" width="55" height="82" fill="#fff"/><path d="M -4.9 34.8 C 6.1 33.8 18.1 36.3 24.1 42.3 C 28.7 47 27.7 53.4 21.1 55.2" fill="none" stroke="#000" stroke-width="5.2" stroke-linecap="round"/><path d="M 16.7 24.3 C 17.2 29.3 16.9 32.3 16.6 34.8" fill="none" stroke="#000" stroke-width="5.2" stroke-linecap="round"/><path d="M 30 22.8 C 30.5 27.8 30.2 30.8 29.9 33.3" fill="none" stroke="#000" stroke-width="5.2" stroke-linecap="round"/><circle cx="15.1" cy="74.3" r="4" fill="#000"/></mask><path mask="url(#m31mano)" fill="{T}" d="M 7.1 82 L 7.6 68.8 C 7.6 66.3 10.1 65.8 13.1 65.3 C 11.1 62.4 7.7 61.2 4.5 58.4 C 1.3 55.6 0.3 50.4 0.7 44.8 C 1.3 37.8 2.5 31.8 4.1 26.8 C 5.3 20.8 6.7 17.4 10.7 17.4 C 14.5 17.4 16.1 21.4 16.7 26.3 C 17.7 19.3 19.7 16.2 23.7 16.2 C 28.1 16.2 29.5 20.7 30 24.8 C 31.2 18.8 33.2 16.2 36.7 17 C 40 17.8 41.7 21.4 42.2 26.8 C 43.2 17.6 45.4 9.4 48.1 3.6 C 49.7 0.2 53.5 -0.6 54.7 2.6 C 55.7 5.4 52.9 7.4 51.7 10.8 C 50.5 14.2 50.9 16.3 50.8 18.8 C 51.7 32.8 51.1 46.8 48.1 58.8 C 45.6 62.8 43.1 63.8 41.9 65.3 C 45.1 65.8 47.6 66.3 47.6 68.8 L 48.1 82 Z"/>''')
    # 44 ALMA SOCIALISTA, MENTE DE TIBURÓN — la aleta asomando
    # cabeza de perfil con un tiburón donde va el cerebro (la maniobra de CAP de FAVA)
    R[44] = ("arriba", 104, 100, f'''<path fill="{T}" fill-rule="evenodd" d="M56 4 C74 5 84 16 86 29 C86 33 85 35 84 37 C88 40 93 44 93 47 C93 50 88 52 84 52 C86 55 86 57 83 58 C85 61 87 63 86 67 C82 74 73 79 63 82 L61 84 L61 100 L33 100 L33 80 C31 79 30 78 29 77 C19 69 12 56 13 40 C16 16 34 4 56 4 Z M24 34 C22 20 37 10 55 10 C72 10 80 19 80 32 C80 45 68 51 52 51 C36 51 26 45 24 34 Z"/><path fill="{T}" d="M75 28 C71 23 65 21 57 22 L55 24 L52 14 L48 27 C46 28 44 28 43 29 L31 24 L40 33 L34 43 L44 36 C45 37 46 37 48 38 L48 46 L57 37 C61 37 64 37 66 37 C70 36 73 32 75 28 Z"/>''')
    # 45 TRANSVERSAL, COMO EL IVA — el ticket de caja
    # ticket rasgado con un % descomunal en el total
    R[45] = ("lado-der", 56, 92, f'''<path fill="none" stroke="{T}" stroke-width="4.6" stroke-linejoin="round" stroke-linecap="round" d="M5.4,10.2 L11.2,5.2 L17,10 L23.2,4.2 L29,9.6 L35.4,4.8 L41,10.2 L46.8,4.4 L51.6,9.4 C53.4,30 53.2,60 51.8,87 C43.5,90.2 37,84.8 28.5,88 C20,91.2 12,85.8 5,88 C3.4,60 3.2,30 5.6,10.6 Z"/><path fill="none" stroke="{T}" stroke-width="5" stroke-linecap="round" d="M11,20.4 C18,19.6 32,21.2 41.5,20.2"/><path fill="none" stroke="{T}" stroke-width="5" stroke-linecap="round" d="M11,31.4 C16.5,30.8 22,32 27,31.2"/><path fill="{T}" fill-rule="evenodd" d="M52.6,43 C53,58 52.6,74 51.8,87 C43.5,90.2 37,84.8 28.5,88 C20,91.2 12,85.8 5,88 C4.1,74 3.9,58 4.3,43 Z M17.6,48 a6.6,6.6 0 1,0 0.05,0 z M39.4,68 a6.6,6.6 0 1,0 0.05,0 z M41.63,49.47 L45.57,53.73 L16.57,80.53 L12.63,76.27 Z"/>''')
    # 46 HORIZONTE 2030 — el sol pixelado saliendo (¿o poniéndose?)
    # el sol y un horizonte que se va deshilachando en rayas y puntos
    R[46] = ("abajo", 120, 40, f'''<g fill="none" stroke="{T}" stroke-linecap="round" stroke-linejoin="round"><path stroke-width="5.4" d="M2.9,33.6 C22,32.2 40,34.4 62,32.9 C68,32.5 71,33.2 74,32.8"/><path stroke-width="5" d="M84,32.6 C87.5,32.2 90,32.9 93,32.5"/><path stroke-width="5" d="M102.5,32.2 L108,32.6"/><path stroke-width="5" d="M117,32.1 L117.3,32.1"/><path stroke-width="4.9" d="M23.8,33.4 C22.2,22.8 29.6,18 39.8,17.8 C50.6,17.6 58.2,23 57,33.2"/></g><path fill="{T}" stroke="{T}" stroke-width="1.6" stroke-linejoin="round" d="M27.04,23.62 L17,20.72 L15.77,23.24 L24.24,29.37 Z M31.49,19.57 L20.42,10.34 L18.38,12.25 L26.81,23.93 Z M37.67,17.28 L32.79,9.16 L30.16,10.12 L31.65,19.47 Z M43.96,17.52 L42.68,2.67 L39.88,2.57 L37.57,17.3 Z M50.18,20.44 L53.29,9.95 L50.78,8.72 L44.43,17.64 Z M54.38,25.14 L63.06,14.9 L61.19,12.82 L50.1,20.38 Z M56.16,29.37 L63.28,23.9 L62.06,21.38 L53.36,23.62 Z"/>''')
    # 47 COMPROMISO FIRME… — los dedos cruzados a la espalda
    # un lápiz de una pieza firmando una rúbrica: firmado a lápiz, o sea, borrable
    R[47] = ("lado-der", 70, 98, f'''<g fill="{T}">
      <path fill-rule="evenodd"
        d="M22 2 q13 0 13 10 l0 6 -26 0 0 -6 q0 -10 13 -10 Z"/>
      <rect x="9" y="18" width="26" height="7"/>
      <path fill-rule="evenodd" d="M9 25 l26 0 0 38 -26 0 Z M19 30 l6 0 0 28 -6 0 Z"/>
      <path d="M9 63 l26 0 -13 19 Z"/>
      <path d="M19 78 l6 0 -3 5 Z"/>
      <path d="M2 92 q9 -9 16 -2 q6 6 13 -1 q6 -6 13 1 q5 5 11 0 l3 5 q-9 8 -17 1 q-6 -5 -11 1 q-7 7 -14 0 q-5 -5 -11 1 Z"/>
    </g>''')
    # 48 ESCUCHA ACTIVA… — la oreja
    # el buzón de sugerencias con un candado: échalas ahí, que no se abre
    # 48 ESCUCHA ACTIVA… — la oreja
    R[48] = ("lado-izq", 64, 88, f'''<g fill="none" stroke="{T}" stroke-width="9" stroke-linecap="round">
      <path d="M14 30 q0 -22 20 -22 q22 0 22 24 q0 14 -12 24 q-10 8 -10 18 q0 10 -10 10 q-10 0 -12 -10"/>
      <path d="M28 34 q0 -10 8 -10 q10 0 10 12"/></g>''')
    # 49 RESILIENTE… — el muelle con su pesa
    # un tío sin cabeza aguantando una casa entera encima
    R[49] = ("lado-der", 84, 94, f'''<path fill="{T}" d="M42 0 L80 22 L4 22 Z"/>
<path fill="{T}" d="M56 4 L66 4 L66 16 L56 16 Z"/>
<path fill="{T}" fill-rule="evenodd" d="M16 20 L68 20 L68 42 L16 42 Z M24 26 L36 26 L36 36 L24 36 Z"/>
<path fill="{T}" fill-rule="evenodd" d="M26 41 L58 41 C61 47 62 53 62 59 C62 64 59 68 55 70 L29 70 C25 68 22 64 22 59 C22 53 23 47 26 41 Z M28 57 L56 57 L56 62 L28 62 Z"/>
<path fill="{T}" d="M29 68 L39 68 L38 78 L28 86 L30 93 L10 93 L15 84 L24 76 Z"/>
<path fill="{T}" d="M45 68 L55 68 L58 77 L68 85 L71 93 L51 93 L53 86 L45 78 Z"/>''')
    # 50 TRANSPARENCIA TOTAL, PREVIA CITA — la máquina de turnos
    # la persiana echada del todo — transparencia, previa cita
    R[50] = ("arriba", 90, 92, f'''<rect fill="{T}" x="3" y="0" width="84" height="11" rx="3"/>
<rect fill="{T}" x="7" y="11" width="6" height="44"/>
<rect fill="{T}" x="77" y="11" width="6" height="44"/>
<path fill="{T}" d="M13 15 L78 14 Q80 19 78 23 L13 24 Q11 19 13 15 Z"/>
<path fill="{T}" d="M13 28 L76 27 Q78 32 76 36 L13 37 Q11 32 13 28 Z"/>
<path fill="{T}" d="M13 41 L78 40.5 Q80 45 78 49 L13 50 Q11 45 13 41 Z"/>
<path fill="{T}" fill-rule="evenodd" d="M6 54 L84 53 A4 4 0 0 1 84 66 L6 65 A4 4 0 0 1 6 54 Z M17 57 L37 56.5 L37 62 L17 62.5 Z"/>
<g transform="rotate(6 45 78)">
  <path fill="{T}" fill-rule="evenodd" d="M33 82 L33 71 A12 12 0 0 1 57 71 L57 82 L50 82 L50 71 A5 5 0 0 0 40 71 L40 82 Z"/>
  <rect fill="{T}" x="29" y="77" width="32" height="17" rx="3"/>
</g>''')
    # 51 EL PUEBLO PRIMERO… — la cola, y uno colándose
    # un trajeado apartando la cola con la manaza
    R[51] = ("arriba", 162, 82, f'''<path fill="{T}" d="M5.2,49 a5.8,5.8 0 1,0 11.6,0 a5.8,5.8 0 1,0 -11.6,0 Z"/><path fill="{T}" d="M2.2,80 C1.9,67 5.54,59 11,59 C16.46,59 20.1,67 19.8,80 Z"/><path fill="{T}" d="M28.6,49 a5.4,5.4 0 1,0 10.8,0 a5.4,5.4 0 1,0 -10.8,0 Z"/><path fill="{T}" d="M25.7,80 C25.4,67 28.85,59 34,59 C39.15,59 42.6,67 42.3,80 Z"/><path fill="{T}" d="M51.3,49 a5.7,5.7 0 1,0 11.4,0 a5.7,5.7 0 1,0 -11.4,0 Z"/><path fill="{T}" d="M48.4,80 C48.1,67 51.67,59 57,59 C62.33,59 65.9,67 65.6,80 Z"/><path fill="{T}" d="M74.7,49 a5.3,5.3 0 1,0 10.6,0 a5.3,5.3 0 1,0 -10.6,0 Z"/><path fill="{T}" d="M71.8,80 C71.5,67 74.92,59 80,59 C85.08,59 88.5,67 88.2,80 Z"/><path fill="{T}" fill-rule="evenodd" d="M113,0 L134,0 C143,3 148,9 149,17 L151,32 C155,37 156,47 154,54 L152,82 L137,82 L135,57 C130,53 125,53 120,57 L118,82 L103,82 L101,54 C99,46 97,40 96,33 L58,33 C51,36 40,38 31,37 C24,36.5 20,33 20,28 L20,13 C20,8 25,4.8 32,4.4 L43,4 C43.5,0.8 47,0 50,1 C53.5,2.4 54.5,7.5 53,11.5 L57,12.5 L96,17 C96,9 104,3 113,0 Z M117,6 L133,6 L135,15.5 L129.5,19.5 L136,34 L126,45 L116,33 L122.5,19.5 L115,15.5 Z M26.8,12.6 L44.2,12.6 A2.3,2.3 0 0,1 44.2,17.2 L26.8,17.2 A2.3,2.3 0 0,1 26.8,12.6 Z M26.8,22.6 L44.2,22.6 A2.3,2.3 0 0,1 44.2,27.2 L26.8,27.2 A2.3,2.3 0 0,1 26.8,22.6 Z"/>''')
    # 52 CAMBIO DE OPINIÓN… — la veleta
    # veleta de gallo sobre la flecha, con el € clavado en la peana
    R[52] = ("lado-izq", 90, 112, f'''<g transform="translate(6,0) scale(0.86)"><path fill="{T}" d="M88,18 C83,13 79,12 76,12 C76,8 74,5 71,6 C71,2 66,1.5 65,6 C64,2 59,2 58,7 C57,3 52,4.5 51,10 C48,14 46,18 43,23 C37,21 30,22 26,26 C24,17 18,8 8,2 C5,6 4,14 7,21 C12,29 19,34 27,37 C31,36.5 35,36 38,38 C29,41 17,39 8,33 C5,41 14,51 26,53 C29,55 36,57 44,56 C53,54 60,47 61,38 C62,31 61,26 59,22 C62,21 66,23 68,21 C71,20 74,19 76,18 Z"/></g><path fill="{T}" d="M37,43 L42.5,43 L42.5,56 L37,56 Z"/><path fill="{T}" d="M48,42 L53.5,42 L52.5,56 L47,56 Z"/><path fill="{T}" d="M2,45 L17,58 L2,71 L20,63 L60,63 L60,71 L88,58 L60,45 L60,53 L20,53 Z"/><path fill="{T}" d="M41,62 L49,62 L50,80 L40,80 Z"/><mask id="m52" maskUnits="userSpaceOnUse" x="0" y="0" width="90" height="112"><rect x="0" y="0" width="90" height="112" fill="#fff"/><path fill="none" stroke="#000" stroke-width="5" stroke-linecap="butt" d="M52.7,87.6 A10,10 0 1 0 52.7,100.4"/><rect x="28" y="86.9" width="24" height="4.6" fill="#000"/><rect x="28" y="96.5" width="24" height="4.6" fill="#000"/></mask><path fill="{T}" mask="url(#m52)" d="M13,76 L77,76 L77,107 C77,110 74.5,112 71,112 L19,112 C15.5,112 13,110 13,107 Z"/>''')
    # 53 Vocación de servicio… — el sobre de la nómina, lacrado con euro
    # la poltrona con el tornillo de estrella en el asiento: atornillado al sillón
    # 53 Vocación de servicio… — el sobre de la nómina, lacrado con euro
    R[53] = ("lado-izq", 94, 66, f'''
      <path fill="{T}" fill-rule="evenodd" d="M2 4 q0 -2 2 -2 l86 0 q2 0 2 2 l0 56 q0 4 -4 4 l-82 0 q-4 0 -4 -4 Z
        M8 8 l39 24 -39 24 Z M86 8 l-39 24 39 24 Z"/>
      <path fill="{T}" d="M47 22 a17 17 0 1 1 -0.1 0 Z"/>
      <text x="47" y="47" text-anchor="middle" fill="#22260F" font-family="Barlow Condensed" font-weight="700" font-size="26">€</text>''')
    return R

DIBUJOS_POR_PIEZA = _dibujos(TINTA)


# ── Letras sustituidas por un dibujo ──────────────────────────────────────
# El truco de la referencia que más ingenio tiene: el € que hace de E en
# GARR€PA y la O de DROPO que es una espiral. No es un dibujo AL LADO de la
# palabra, es un dibujo DENTRO — y por eso se lee de un golpe en vez de en
# dos tiempos. {n: (índice de la letra, ancho relativo a la caja alta, svg)}
def _sustituciones(T):
    return {
        # 30 · la «o» de Ecologetas es una hoja con su nervio
        # 30 · la «o» de Ecologetas es una hoja con su nervio. Caja baja
        # (0,56 del cuerpo) y algo más ancha que alta, como la o redonda.
        30: (2, 0.62, 0.56, f'''<path fill="{T}" fill-rule="evenodd"
              d="M50 3 Q95 30 91 60 Q87 97 50 97 Q13 97 9 60 Q5 30 50 3 Z
                 M43 30 l14 0 0 50 -14 0 Z"/>'''),
    }


SUSTITUCIONES = _sustituciones(TINTA)

# EL REPARTO DE VOCES es una decisión de composición, no de gusto: las
# piezas ANCLA (una o dos líneas, las que se leen a un metro) van en la voz
# de rotulista; las frases de tres líneas se quedan en la condensada, que
# aguanta mejor el bloque y —sobre todo— mantiene la VARIEDAD. Si todo
# fuera cartel, el estampado volvería a ser monótono por el otro lado.
CUERPO = 66          # tamaño base de letra
INTERLINEA = 0.88    # las frases van APRETADAS: es lo que hace bloque
MARGEN = 14

# Interlínea CONSCIENTE DE COLISIONES. Con 0.88 fijo, la tilde de OPINIÓN
# subía hasta la O de CAMBIO («CAMBIQ»), la cola de la Q de PORQUE caía
# sobre la I de SOCIALISTA (los auditores la leyeron como İ turca) y la coma
# de TOTAL, aterrizaba en la I de CITA. La caja alta de Barlow deja 0.88 em
# de paso pero la tilde sube ~0.94 y la cola de Q/coma baja ~0.15: el choque
# es aritmético, no tipográfico. El bloque sigue apretado donde no hay
# riesgo; solo el par de líneas conflictivo respira.
_DESCENDENTES = set("QJ,;")          # lo que cuelga bajo la línea base
_DIACRITICOS = set("ÁÉÍÓÚÜÑáéíóúüñ")  # lo que asoma sobre la caja


def saltos_de(lineas: list, t: float) -> list:
    """Distancia de la línea i a la i+1, en unidades."""
    pasos = []
    for arriba, abajo in zip(lineas, lineas[1:]):
        extra = 0.0
        if set(arriba) & _DESCENDENTES:
            extra += 0.10
        if set(abajo) & _DIACRITICOS:
            extra += 0.13
        pasos.append(t * (INTERLINEA + extra))
    return pasos


def compon(lineas, trato, voz, medida=None, slug="x", n=None, avances=None, caja_dib=None) -> str:
    """Interior del SVG. `medida` es el bbox REAL del texto ya renderizado:
    los contenedores (caja, sello, corchetes, filetes) se ciñen a él en una
    segunda pasada, porque un contenedor de tamaño fijo baila según la
    longitud de la frase y eso se ve a la primera."""
    fam, ajuste = VOCES[voz]
    # "cartel" entra aquí: Staatliches es una display de peso Regular y sobre
    # el vidrio sale más fina que la condensada bold — al cambiar la voz de
    # las piezas ancla, cinco de ellas cayeron por debajo del mínimo.
    refuerza = voz in ("serif", "serif-it", "mono", "cond-lig", "cartel")
    t = CUERPO * ajuste
    pasos = saltos_de(lineas, t)
    cx, cy = 500, 300
    y0 = cy - sum(pasos) / 2
    ofs = [0.0]
    for paso in pasos:
        ofs.append(ofs[-1] + paso)

    def texto(ls, extra="", fill=TINTA, x=None, base=None):
        # `fill` se resuelve AQUÍ y no se repite en `extra`: un atributo
        # duplicado no da error, invalida el SVG entero y la pieza sale en
        # blanco sin avisar. Ya pasó con letter-spacing.
        xx = cx if x is None else x
        yy = y0 if base is None else base
        pintura = "" if fill is None else f'fill="{fill}" '
        # REFUERZO DE IMPRENTA: un trazo nominal del color del relleno. No es
        # decorativo — es el gancho para que `normalizar-trazo.py` pueda subir
        # el peso de la letra hasta el mínimo impreso de la pieza. Un asta de
        # letra vectorizada es un RELLENO y sin este stroke no hay nada que
        # engordar: la mitad del set quedaba por debajo de 0,8 mm y ningún
        # chequeo lo veía. En el texto calado de las cajas (fill #000) ancha
        # el hueco, que es exactamente lo que el calado necesita.
        # Solo a las voces FINAS (serif, cursiva, mono, ligera): la condensada
        # bold ya tiene el asta al límite natural y el stroke centrado le roba
        # 0,25 mm de ojal por cada lado sin ganar nada — medido: cerraba el
        # 100 % de las contraformas y no movía la tinta fina.
        if refuerza and fill is not None and "stroke=" not in extra:
            extra = f'stroke="{fill}" stroke-width="2.5" stroke-linejoin="round" ' + extra
        return "".join(
            f'<text x="{xx}" y="{yy + ofs[i]:.1f}" text-anchor="middle" '
            f'{pintura}{fam} font-size="{t:.1f}" {extra}>{l}</text>'
            for i, l in enumerate(ls)
        )

    def con_dibujo_con(cuerpo_svg, caja):
        """Coloca el pictograma de la pieza (si lo tiene) respecto a la caja
        dada — encima, al lado, debajo o flanqueando, como la referencia."""
        if n not in DIBUJOS_POR_PIEZA or caja is None:
            return cuerpo_svg
        pos, aw, ah, frag = DIBUJOS_POR_PIEZA[n]
        mx, my, mw, mh = caja["x"], caja["y"], caja["w"], caja["h"]
        # La caja REAL del fragmento, medida en el navegador, manda sobre la
        # declarada: un dibujo que se sale de su caja se monta encima del
        # texto (pasó con «EL PUEBLO PRIMERO», cuya multitud pisaba la
        # primera línea). Se corrige desplazando y escalando al hueco
        # declarado, que es el que la composición tiene reservado.
        ox = oy = 0.0
        if caja_dib and caja_dib.get("w") and caja_dib.get("h"):
            k = min(aw / caja_dib["w"], ah / caja_dib["h"], 1.0)
            if k < 0.999 or caja_dib["x"] < -0.5 or caja_dib["y"] < -0.5:
                ox, oy = -caja_dib["x"] * k, -caja_dib["y"] * k
                frag = f'<g transform="translate({ox:.2f} {oy:.2f}) scale({k:.4f})">{frag}</g>'
                aw, ah = caja_dib["w"] * k, caja_dib["h"] * k
        SEP = 16
        if pos == "arriba":
            dx, dy = cx - aw / 2, my - SEP - ah
        elif pos == "abajo":
            dx, dy = cx - aw / 2, my + mh + SEP
        elif pos == "lado-izq":
            dx, dy = mx - SEP - aw, my + mh / 2 - ah / 2
        elif pos == "lado-der":
            dx, dy = mx + mw + SEP, my + mh / 2 - ah / 2
        elif pos == "flancos":
            izq, der = frag.split("|||")
            return (f'<g transform="translate({mx - SEP - aw:.1f} {my + mh / 2 - ah / 2:.1f})">{izq}</g>'
                    + cuerpo_svg
                    + f'<g transform="translate({mx + mw + SEP:.1f} {my + mh / 2 - ah / 2:.1f})">{der}</g>')
        else:
            return cuerpo_svg
        return cuerpo_svg + f'<g transform="translate({dx:.1f} {dy:.1f})">{frag}</g>'

    def con_dibujo(cuerpo_svg):
        return con_dibujo_con(cuerpo_svg, medida)

    if trato == "desnuda":
        return con_dibujo(texto(lineas))

    if trato == "hueca":
        # Contorno sin relleno: ocupa su sitio en la retícula pero deja pasar
        # el vidrio. Es el respiro que no deja hueco.
        return con_dibujo(texto(
            lineas,
            fill="none",
            extra=f'stroke="{TINTA}" stroke-width="3.4" '
                  f'stroke-linejoin="round" stroke-linecap="round"',
        ))

    if trato == "caja":
        # Masa blanca con el texto CALADO: el acento oscuro del conjunto. En
        # serigrafía de una tinta, «calado» es tinta ausente — por eso máscara
        # de verdad y no un texto pintado del color del fondo, que sobre
        # vidrio no existe.
        #
        # El id de la máscara lleva el slug: varios SVG conviven en la misma
        # página (la botella, el catálogo, la lámina) y con `id="m"` en todos
        # se pisan entre ellos — la última máscara cargada gana y las demás
        # piezas salen en blanco.
        ancho = medida["w"] + 46
        alto = medida["h"] + 30
        x = cx - ancho / 2
        y = medida["y"] - 15
        return (
            # La región del <mask> va EXPLÍCITA. Con userSpaceOnUse y sin
            # x/y/width/height, el valor por defecto es ±10 % del VIEWPORT: al
            # ceñir el viewBox al final, esa región se queda fuera del rect y
            # la pieza desaparece ENTERA. Se veía bien mientras se medía (con
            # el lienzo grande) y salía en blanco al guardarla.
            f'<mask id="c-{slug}" maskUnits="userSpaceOnUse" '
            f'x="{x-20:.1f}" y="{y-20:.1f}" width="{ancho+40:.1f}" height="{alto+40:.1f}">'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{ancho:.1f}" height="{alto:.1f}" fill="#fff"/>'
            # El trazo negro ENSANCHA el calado: a 5,5-6 mm en el hombro las
            # contraformas de la caja se cerraban (medido); así la palabra
            # tallada respira aunque sus ojales internos se llenen — el mismo
            # trato que la referencia da a su micro-texto calado.
            f'{texto(lineas, fill="#000", extra=TALLA_ANCHA)}</mask>'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{ancho:.1f}" height="{alto:.1f}" '
            f'rx="6" fill="{TINTA}" mask="url(#c-{slug})"/>'
        )

    if trato == "sello":
        # Doble aro CEÑIDO: con radio fijo, una palabra corta nada dentro de
        # un círculo enorme y la pieza pierde densidad.
        r = max(medida["w"], medida["h"]) / 2 + 34
        sello = (
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{TINTA}" stroke-width="9"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r-26}" fill="none" stroke="{TINTA}" stroke-width="3"/>'
            + texto(lineas)
        )
        # El dibujo se coloca respecto al ARO, no al texto: con la caja del
        # texto, el silbato aterrizaba ENCIMA del anillo.
        medida_aro = {"x": cx - r, "y": cy - r, "w": 2 * r, "h": 2 * r}
        medida_texto, med2 = medida, medida_aro
        return con_dibujo_con(sello, med2)

    if trato == "sustituida":
        # Una letra de la palabra es un dibujo. Se compone letra a letra con
        # los avances medidos, y en el hueco de la letra elegida entra el
        # fragmento escalado a la altura de caja alta.
        if not avances or n not in SUSTITUCIONES:
            return con_dibujo(texto(lineas))
        idx, rel_w, rel_h, frag = SUSTITUCIONES[n]
        anchos = avances[0]
        letras = lineas[0]
        alta = t * rel_h
        ancho_dib = t * rel_w
        total = sum(a for i, a in enumerate(anchos) if i != idx) + ancho_dib
        partes = []
        x = cx - total / 2
        for i, ch in enumerate(letras):
            if i == idx:
                partes.append(
                    f'<g transform="translate({x:.1f} {cy - alta:.1f}) '
                    f'scale({ancho_dib / 100.0:.4f} {alta / 100.0:.4f})">{frag}</g>'
                )
                x += ancho_dib
            else:
                partes.append(
                    f'<text x="{x:.1f}" y="{cy:.1f}" fill="{TINTA}" {fam} '
                    f'font-size="{t:.1f}">{ch}</text>'
                )
                x += anchos[i]
        return con_dibujo("".join(partes))

    if trato == "arco":
        # La palabra montada en un ARCO, con cada letra girada a su tangente.
        # Es la maniobra de TROMPÍMETRE y de XULO en la referencia, y es de
        # las que más separan una palabra dibujada de una compuesta: una
        # línea base recta se lee como tipografía; una curva, como rótulo.
        if not avances:
            return texto(lineas)
        # 0,78: lo que se mide por diferencia de prefijos es la TINTA de cada
        # letra, no su avance, y en una condensada la tinta de una M es casi
        # su avance pero la de una I es mucho menor — al sumarlas el arco
        # sale un tercio más largo y las letras nadan.
        anchos = [a * 0.78 for a in avances[0]]
        total = sum(anchos)
        radio = max(total * 0.78, 90)
        partes = []
        recorrido = -total / 2
        for ch, av in zip(lineas[0], anchos):
            ang = (recorrido + av / 2) / radio          # radianes
            import math as _m
            px = cx + radio * _m.sin(ang)
            py = cy + radio - radio * _m.cos(ang)
            partes.append(
                f'<g transform="rotate({_m.degrees(ang):.2f} {px:.1f} {py:.1f})">'
                f'<text x="{px:.1f}" y="{py:.1f}" text-anchor="middle" fill="{TINTA}" '
                f'{fam} font-size="{t:.1f}">{ch}</text></g>'
            )
            recorrido += av
        return con_dibujo("".join(partes))

    if trato == "revuelto":
        # Cada letra con su cuerpo, su giro y su línea base, alternando caja
        # alta y baja: la maniobra de «SaPaSTre!». El patrón es FIJO (nunca
        # aleatorio: el render debe repetirse build tras build) y lo que hace
        # es que la palabra parezca escrita a mano, no tecleada.
        if not avances:
            return texto(lineas)
        CUERPOS = [1.0, 0.74, 1.14, 0.82, 1.06, 0.78, 1.18, 0.88]
        GIROS = [-6, 4, -3, 7, -5, 3, -7, 5]
        SALTOS = [0, 5, -4, 6, -3, 4, -6, 2]
        partes = []
        x = cx - sum(avances[0]) / 2
        for i, (ch, av) in enumerate(zip(lineas[0], avances[0])):
            k = CUERPOS[i % len(CUERPOS)]
            # La caja alta y baja se turnan; si la letra no tiene minúscula
            # (un signo, una cifra) se queda como está.
            letra = ch.lower() if i % 2 and ch.lower() != ch.upper() else ch
            partes.append(
                f'<g transform="rotate({GIROS[i % len(GIROS)]} {x + av / 2:.1f} {cy:.1f})">'
                f'<text x="{x + av / 2:.1f}" y="{cy + SALTOS[i % len(SALTOS)]:.1f}" '
                f'text-anchor="middle" fill="{TINTA}" {fam} font-size="{t * k:.1f}">{letra}</text></g>'
            )
            x += av * (0.88 + 0.12 * k)
        return con_dibujo("".join(partes))

    if trato == "tampon":
        # Sello de goma inclinado: DOBLE marco de contorno (nada macizo) con
        # la palabra dentro, ligeramente girado — la tinta del funcionario.
        ancho = medida["w"] + 52
        alto = medida["h"] + 40
        x, y = cx - ancho / 2, medida["y"] - 20
        cyt = y + alto / 2
        return (
            f'<g transform="rotate(-4 {cx} {cyt})">'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{ancho:.1f}" height="{alto:.1f}" rx="8" '
            f'fill="none" stroke="{TINTA}" stroke-width="9"/>'
            f'<rect x="{x+14:.1f}" y="{y+14:.1f}" width="{ancho-28:.1f}" height="{alto-28:.1f}" rx="4" '
            f'fill="none" stroke="{TINTA}" stroke-width="3"/>'
            + texto(lineas) + "</g>"
        )

    if trato == "diccio":
        # Entrada de diccionario: la capa que añade el icono cuando el nombre
        # ya lo dice todo.
        fam2, aj2 = VOCES["serif-it"]
        return (
            f'<text x="{cx}" y="{cy - 10}" text-anchor="middle" fill="{TINTA}" '
            f'stroke="{TINTA}" stroke-width="2.5" stroke-linejoin="round" {fam} '
            f'font-size="{CUERPO*1.35:.0f}">{lineas[0]}</text>'
            f'<text x="{cx}" y="{cy + 58}" text-anchor="middle" fill="{TINTA}" '
            f'stroke="{TINTA}" stroke-width="2.5" stroke-linejoin="round" {fam2} '
            f'font-size="{CUERPO*0.62:.0f}">{lineas[1]}</text>'
            f'<rect x="{cx-90}" y="{cy+82}" width="180" height="5" rx="2.5" fill="{TINTA}"/>'
        )

    if trato == "regla":
        # Subrayado grueso: da peso sin ocupar otra línea.
        w = medida["w"] * 0.98
        return con_dibujo(texto(lineas) + (
            f'<rect x="{cx - w/2:.1f}" y="{y0 + sum(pasos) + 20:.1f}" '
            f'width="{w:.1f}" height="9" rx="4.5" fill="{TINTA}"/>'
        ))

    if trato == "acta":
        # Registro burocrático: mono, tracking ancho y corchetes de expediente.
        cuerpo = texto(lineas, extra='letter-spacing="1.5"')
        y1, y2 = y0 - t * 0.95, y0 + sum(pasos) + t * 0.35
        xi, xd = cx - medida["w"] / 2 - 26, cx + medida["w"] / 2 + 26
        g = f'<g fill="none" stroke="{TINTA}" stroke-width="6">'
        g += f'<path d="M{xi+30:.0f} {y1:.0f} h-30 v{y2-y1:.0f} h30"/>'
        g += f'<path d="M{xd-30:.0f} {y1:.0f} h30 v{y2-y1:.0f} h-30"/></g>'
        return con_dibujo(cuerpo + g)

    if trato == "solemne":
        # Cursiva con filetes: la solemnidad es el chiste.
        cuerpo = texto(lineas)
        y1 = y0 - t * 1.25
        y2 = y0 + sum(pasos) + t * 0.6
        w = medida["w"] * 1.02
        return con_dibujo(
            cuerpo
            + f'<rect x="{cx - w/2:.1f}" y="{y1:.0f}" width="{w:.1f}" height="3" fill="{TINTA}"/>'
            + f'<rect x="{cx - w/2:.1f}" y="{y2:.0f}" width="{w:.1f}" height="3" fill="{TINTA}"/>'
        )

    if trato == "cifra-fila":
        # La cifra grande EN EL MEDIO y las palabras a sus lados, en una sola
        # fila. Apiladas (tratamiento «cifra») el bitmap se come la altura y
        # las palabras caen a 2 mm impresos: medido, perdían el 62 % de su
        # tinta. En fila, la pieza es ancha y baja, y las tres partes comparten
        # altura.
        cifra = next((l for l in lineas if l.isdigit()), None)
        palabras = [l for l in lineas if not l.isdigit()]
        if cifra is None:
            return texto(lineas)
        u = t * 1.45 / 7
        svg_c, ancho_c = pixeles(cifra, 0, 0, u)
        alto_c = 7 * u
        chico = t * 0.86
        # El ancho de cada palabra se estima con el avance medio de la
        # condensada (0,42 em): no hace falta más precisión porque las tres
        # partes se centran entre sí, no se justifican.
        anchos_p = [len(w) * chico * 0.42 for w in palabras]
        hueco = t * 0.34
        total = ancho_c + sum(anchos_p) + hueco * (len(palabras))
        x = cx - total / 2
        partes = []
        for i, w in enumerate(palabras):
            if i == 1:
                partes.append(
                    f'<g transform="translate({x:.1f} {cy - alto_c / 2:.1f})" fill="{TINTA}">{svg_c}</g>'
                )
                x += ancho_c + hueco
            partes.append(
                f'<text x="{x:.1f}" y="{cy + chico * 0.36:.1f}" fill="{TINTA}" '
                f'{fam} font-size="{chico:.1f}">{w}</text>'
            )
            x += anchos_p[i] + hueco
        if len(palabras) < 2:
            partes.append(
                f'<g transform="translate({x:.1f} {cy - alto_c / 2:.1f})" fill="{TINTA}">{svg_c}</g>'
            )
        # La caja de ESTA composición, no la del apilado que se midió en la
        # primera pasada: con la del apilado el pictograma aterrizaba encima
        # de la última palabra.
        return con_dibujo_con(
            "".join(partes),
            {"x": cx - total / 2, "y": cy - alto_c / 2, "w": total, "h": alto_c},
        )

    if trato == "contador-fila":
        # Pares PALABRA + CIFRA, cada par en su fila. Apilado («contador») son
        # cuatro renglones: la pieza mide 15 mm impresos y a HORIZONTE le
        # tocaban 2,6 mm con astas de 0,3 — medido, perdía el 93 % de su tinta
        # en el escenario estricto, y además la última cifra se salía de la
        # caja y el pictograma le caía encima. En dos filas la pieza es ancha
        # y baja y las cuatro partes caben al doble de cuerpo.
        pares, suelto = [], []
        for l in lineas:
            if l.isdigit() and suelto:
                pares.append((" ".join(suelto), l))
                suelto = []
            else:
                suelto.append(l)
        if not pares:
            return texto(lineas)
        u = t * 1.30 / 7
        alto_c = 7 * u
        chico = t * 0.95
        hueco = t * 0.30
        sep = alto_c * 0.34          # aire entre filas
        filas = []
        for palabra, cifra in pares:
            svg_c, ancho_c = pixeles(cifra, 0, 0, u)
            ancho_p = len(palabra) * chico * 0.42
            filas.append((palabra, ancho_p, svg_c, ancho_c, ancho_p + hueco + ancho_c))
        ancho_max = max(fi[4] for fi in filas)
        alto_total = len(filas) * alto_c + (len(filas) - 1) * sep
        y = cy - alto_total / 2
        partes = []
        for palabra, ancho_p, svg_c, ancho_c, ancho_f in filas:
            # Las filas se JUSTIFICAN al ancho de la más larga: alineadas por
            # el centro, las dos cifras bailaban y el bloque no leía como un
            # contador. Con los dos extremos a plomo sí.
            x = cx - ancho_max / 2
            hueco_f = ancho_max - ancho_p - ancho_c
            partes.append(
                f'<text x="{x:.1f}" y="{y + alto_c / 2 + chico * 0.36:.1f}" '
                f'fill="{TINTA}" {fam} font-size="{chico:.1f}">{palabra}</text>')
            partes.append(
                f'<g transform="translate({x + ancho_p + hueco_f:.1f} {y:.1f})" '
                f'fill="{TINTA}">{svg_c}</g>')
            y += alto_c + sep
        return con_dibujo_con(
            "".join(partes),
            {"x": cx - ancho_max / 2, "y": cy - alto_total / 2,
             "w": ancho_max, "h": alto_total},
        )

    if trato in ("cifra", "contador"):
        # La cifra en píxeles dentro de la frase en condensada: dos registros
        # en la misma pieza, que es lo que más textura da por pieza.
        # La cifra se dimensiona a partir del cuerpo de letra y AVANZA lo que
        # mide: con un salto de línea fijo, el bitmap invadía la línea de abajo.
        partes, y = [], y0
        # La cifra MANDA y el texto la acompaña: al revés no se lee como otro
        # registro, parece una errata.
        # 0.72/0.78 y no 0.62/0.54: a 16 mm las palabras de acompañamiento
        # quedaban con astas de 0,25 mm y morían ENTERAS mientras los dígitos
        # de píxel aguantaban de sobra (volcado horizonte-muerto.png).
        chico = t * (0.72 if trato == "cifra" else 0.78)
        for l in lineas:
            if l.isdigit():
                u = (t * (1.9 if trato == "cifra" else 1.45)) / 7
                svg, ancho = pixeles(l, 0, 0, u)
                alto = 7 * u
                partes.append(
                    f'<g transform="translate({cx - ancho/2:.1f} {y:.1f})" fill="{TINTA}">{svg}</g>'
                )
                y += alto + chico * 0.30
            else:
                partes.append(
                    f'<text x="{cx}" y="{y + chico*0.80:.1f}" text-anchor="middle" fill="{TINTA}" '
                    f'{fam} font-size="{chico:.1f}" letter-spacing="1">{l}</text>'
                )
                y += chico * 1.02
        return con_dibujo("".join(partes))

    raise ValueError(f"tratamiento desconocido: {trato}")


PAGINA = """<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;1,400&family=Bodoni+Moda:ital,wght@0,400;0,700;1,400;1,700&family=Libre+Franklin:wght@400;800&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>body{margin:0}</style></head><body><div id="caja"></div></body></html>"""


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ver", action="store_true")
    args = ap.parse_args()

    with sync_playwright() as pw:
        nav = pw.chromium.launch()
        pag = nav.new_page()
        pag.set_content(PAGINA)
        pag.wait_for_timeout(3000)
        pag.evaluate("document.fonts.ready")

        def medir(cuerpo: str):
            return pag.evaluate(
                """(svg) => {
                    const c = document.getElementById('caja');
                    c.innerHTML = svg;
                    const el = c.querySelector('svg');
                    el.setAttribute('width','1000'); el.setAttribute('height','600');
                    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
                    for (const h of el.querySelectorAll('path,rect,circle,text,g')) {
                        if (h.closest('mask')) continue;
                        let b; try { b = h.getBBox(); } catch { continue; }
                        if (!b || (!b.width && !b.height)) continue;
                        x0=Math.min(x0,b.x); y0=Math.min(y0,b.y);
                        x1=Math.max(x1,b.x+b.width); y1=Math.max(y1,b.y+b.height);
                    }
                    return isFinite(x0) ? {x:x0,y:y0,w:x1-x0,h:y1-y0} : null;
                }""",
                f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600">{cuerpo}</svg>',
            )

        reparto: dict[str, int] = {}
        for n, slug, lineas, trato, voz in PIEZAS:
            reparto[trato] = reparto.get(trato, 0) + 1

            # Pasada 1: el texto desnudo, para saber cuánto ocupa de verdad.
            medida = medir(compon(lineas, "desnuda", voz))
            if medida is None:
                print(f"  ✗ {slug}: no se pudo medir el texto")
                continue
            # Para las maniobras de rotulación hace falta el AVANCE DE CADA
            # LETRA, no el ancho del bloque: se mide en el navegador, con la
            # fuente cargada, pidiendo prefijos cada vez más largos (así el
            # kerning real entra en la cuenta).
            # La caja real del pictograma, si lo tiene.
            caja_dib = None
            if n in DIBUJOS_POR_PIEZA:
                _pos, _aw, _ah, _frag = DIBUJOS_POR_PIEZA[n]
                for trozo in _frag.split("|||"):
                    m = medir(trozo)
                    if m:
                        caja_dib = m if caja_dib is None else {
                            "x": min(caja_dib["x"], m["x"]),
                            "y": min(caja_dib["y"], m["y"]),
                            "w": max(caja_dib["w"], m["w"]),
                            "h": max(caja_dib["h"], m["h"]),
                        }

            avances = None
            if trato in ("arco", "revuelto", "sustituida"):
                anchos = []
                previo = 0.0
                for k in range(1, len(lineas[0]) + 1):
                    m = medir(compon([lineas[0][:k]], "desnuda", voz))
                    ancho = m["w"] if m else 0.0
                    anchos.append(max(ancho - previo, CUERPO * 0.18))
                    previo = ancho
                avances = [anchos]

            # Pasada 2: la pieza con sus contenedores ajustados a esa medida.
            cuerpo = compon(lineas, trato, voz, medida=medida, slug=slug, n=n, avances=avances, caja_dib=caja_dib)
            bruto = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600">{cuerpo}</svg>'

            caja = pag.evaluate(
                """(svg) => {
                    const c = document.getElementById('caja');
                    c.innerHTML = svg;
                    const el = c.querySelector('svg');
                    el.setAttribute('width', '1000'); el.setAttribute('height', '600');
                    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
                    for (const h of el.querySelectorAll('path,rect,circle,text,g')) {
                        if (h.closest('mask')) continue;   // la máscara no es dibujo
                        let b; try { b = h.getBBox(); } catch { continue; }
                        if (!b || (!b.width && !b.height)) continue;
                        x0=Math.min(x0,b.x); y0=Math.min(y0,b.y);
                        x1=Math.max(x1,b.x+b.width); y1=Math.max(y1,b.y+b.height);
                    }
                    return isFinite(x0) ? {x0,y0,x1,y1} : null;
                }""",
                bruto,
            )
            if caja is None:
                print(f"  ✗ {slug}: no se pudo medir")
                continue

            x0, y0 = caja["x0"] - MARGEN, caja["y0"] - MARGEN
            w, h = caja["x1"] - caja["x0"] + 2 * MARGEN, caja["y1"] - caja["y0"] + 2 * MARGEN
            final = (
                f'<svg xmlns="http://www.w3.org/2000/svg" '
                f'viewBox="{x0:.1f} {y0:.1f} {w:.1f} {h:.1f}">\n  {cuerpo}\n</svg>\n'
            )
            if not args.ver:
                (ICONOS / f"{slug}.svg").write_text(final, encoding="utf-8")
            print(f"  {'(vería)' if args.ver else '✓'} {slug:46s} {trato:9s} {voz:9s} {w:.0f}×{h:.0f}")

        nav.close()

    print("\nReparto de tratamientos:")
    for t, c in sorted(reparto.items(), key=lambda kv: -kv[1]):
        print(f"  {t:10s} {c:2d}  {'█' * c}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
