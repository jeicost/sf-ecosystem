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
    (16, "t-hermanisimo",       ["HERMANÍSIMO"],                          "hueca",   "cond"),
    (19, "t-rufian",            ["rufián", "s. m."],                      "diccio",  "serif"),
    (20, "t-mema",              ["MEMA"],                                 "hueca",   "cond"),
    (21, "t-patxi-verguenza-ajena", ["PATXI", "VERGÜENZA", "AJENA"],      "desnuda", "cond"),
    (22, "t-al-menos-no-gobierna-la-ultraderecha",
         ["AL MENOS NO", "GOBIERNA LA", "ULTRADERECHA"],                  "desnuda", "cond"),
    (23, "t-no-dormiria-tranquilo", ["NO DORMIRÍA", "TRANQUILO"],         "desnuda", "cond"),
    (24, "t-espana-va-como-un-cohete", ["ESPAÑA VA", "COMO UN COHETE"],   "desnuda", "cond"),
    (25, "t-son-las-5-y-no-he-comido", ["SON LAS", "5", "Y NO HE COMIDO"], "cifra",  "cond"),
    # La referencia NO tiene placas macizas: sus masas blancas son iconos.
    # FACHA pasa de caja a TAMPÓN de contorno, como su banderín TABALOT.
    (26, "t-facha",             ["FACHA"],                                "tampon",  "cond"),
    (27, "t-yo-estoy-bien",     ["YO ESTOY", "BIEN"],                     "desnuda", "cond"),
    (28, "t-por-7-votos",       ["POR", "7", "VOTOS"],                    "cifra",   "cond"),
    (29, "t-fiscal-soplon",     ["FISCAL", "SOPLÓN"],                     "sello",   "cond"),
    (30, "t-ecologetas",        ["Ecologetas"],                           "desnuda", "redonda"),
    (31, "t-soy-feminista-porque-soy-socialista",
         ["SOY FEMINISTA", "PORQUE SOY", "SOCIALISTA"],                   "desnuda", "cond"),
    (44, "t-alma-socialista-mente-de-tiburon",
         ["ALMA SOCIALISTA,", "MENTE DE TIBURÓN"],                        "desnuda", "cond"),
    (45, "t-transversal-como-el-iva", ["TRANSVERSAL,", "COMO EL IVA"],    "regla",   "cond"),
    (46, "t-horizonte-2030-legislatura-2027",
         ["HORIZONTE", "2030", "LEGISLATURA", "2027"],                    "contador","cond"),
    (47, "t-compromiso-firme-hasta-nueva-orden",
         ["COMPROMISO", "FIRME HASTA", "NUEVA ORDEN"],                    "desnuda", "cond"),
    (48, "t-escucha-activa-decision-tomada",
         ["ESCUCHA ACTIVA,", "DECISIÓN TOMADA"],                          "acta",    "mono"),
    (49, "t-resiliente-o-sea-que-aguantas",
         # Era "hueca" y a tres líneas el contorno (inflado por el mínimo de
         # trazo impreso) soldaba las líneas entre sí. La hueca solo vive en
         # MEMA: una línea y pintada grande.
         ["RESILIENTE,", "O SEA, QUE", "AGUANTAS"],                       "desnuda", "cond"),
    (50, "t-transparencia-total-previa-cita",
         ["TRANSPARENCIA", "TOTAL,", "PREVIA CITA"],                      "desnuda", "cond"),
    (51, "t-el-pueblo-primero-despues-de-mi",
         ["EL PUEBLO PRIMERO.", "DESPUÉS DE MÍ."],                        "desnuda", "cond"),
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
    R[16] = ("arriba", 150, 74, f'''<g fill="{T}">
      <circle cx="30" cy="18" r="14"/><circle cx="75" cy="18" r="14"/><circle cx="120" cy="18" r="14"/>
      <path d="M14 74 l6 -34 q10 -6 20 0 l6 34 Z"/><path d="M59 74 l6 -34 q10 -6 20 0 l6 34 Z"/>
      <path d="M104 74 l6 -34 q10 -6 20 0 l6 34 Z"/>
      <rect x="40" y="46" width="24" height="7" rx="3.5"/><rect x="86" y="46" width="24" height="7" rx="3.5"/></g>''')
    # 21 PATXI — facepalm: la palma por delante de la cara
    R[21] = ("lado-izq", 88, 86, f'''
      <path fill="{T}" fill-rule="evenodd" d="M44 2 a40 40 0 1 1 -0.1 0 Z
        M28 26 a5.5 5.5 0 1 0 0.1 0 Z M60 26 a5.5 5.5 0 1 0 0.1 0 Z"/>
      <path fill="{T}" stroke="#141708" stroke-width="0" fill-rule="evenodd"
        d="M10 50 q0 -10 10 -11 l0 -6 q0 -7 7 -7 q6 0 7 6 q1 -7 8 -7 q7 0 8 7 q1 -6 7 -6 q7 0 7 7 l0 6 q10 1 10 11 l0 14 q0 22 -32 22 q-32 0 -32 -22 Z
        M24 40 l5 0 0 20 -5 0 Z M37 38 l5 0 0 22 -5 0 Z M50 40 l5 0 0 20 -5 0 Z"/>''')
    # 22 AL MENOS NO GOBIERNA… — extintor, por si acaso
    R[22] = ("lado-izq", 74, 96, f'''<g fill="{T}">
      <path fill-rule="evenodd" d="M18 38 q0 -12 12 -12 l10 0 q12 0 12 12 l0 38 q0 12 -12 12 l-10 0 q-12 0 -12 -12 Z
        M26 44 l18 0 0 24 -18 0 Z"/>
      <rect x="26" y="14" width="18" height="10" rx="4"/>
      <path d="M44 8 q22 -6 26 12 l-9 3 q-4 -12 -17 -8 Z"/>
      <rect x="8" y="4" width="26" height="8" rx="4" transform="rotate(-18 21 8)"/></g>''')
    # 23 NO DORMIRÍA TRANQUILO — el ojo que no se cierra
    R[23] = ("arriba", 132, 64, f'''<g fill="none" stroke="{T}" stroke-width="8" stroke-linecap="round">
      <path d="M10 40 Q66 -4 122 40 Q66 78 10 40 Z" fill="{T}"/>
      <line x1="30" y1="12" x2="24" y2="2"/><line x1="66" y1="8" x2="66" y2="-4"/><line x1="102" y1="12" x2="108" y2="2"/></g>
      <circle cx="66" cy="38" r="16" fill="#22260F"/><circle cx="66" cy="38" r="7" fill="{T}"/>''')
    # 24 ESPAÑA VA COMO UN COHETE — el cohete, claro
    R[24] = ("lado-der", 80, 98, f'''<g transform="rotate(38 40 49)"><g fill="{T}">
      <path fill-rule="evenodd" d="M40 2 q20 18 20 48 l0 14 -40 0 0 -14 q0 -30 20 -48 Z
        M40 30 a10 10 0 1 0 0.1 0 Z"/>
      <path d="M20 56 l-14 18 14 4 Z"/><path d="M60 56 l14 18 -14 4 Z"/>
      <path d="M28 72 q12 8 24 0 l-6 20 q-6 6 -12 0 Z"/></g></g>''')
    # 25 SON LAS 5 — tenedor y cuchillo flanqueando la cifra
    R[25] = ("flancos", 30, 96, f'''<g fill="{T}">
      <rect x="11" y="34" width="8" height="60" rx="4"/>
      <rect x="2" y="2" width="6" height="30" rx="3"/><rect x="12" y="2" width="6" height="30" rx="3"/>
      <rect x="22" y="2" width="6" height="30" rx="3"/><path d="M2 28 q13 12 26 0 l0 8 -26 0 Z"/></g>|||<g fill="{T}">
      <rect x="8" y="34" width="8" height="60" rx="4"/>
      <path d="M8 2 q14 8 14 26 l0 6 -14 0 Z"/></g>''')
    # 27 YO ESTOY BIEN — la taza humeante entre llamitas (todo bien)
    R[27] = ("lado-der", 100, 86, f'''<g fill="{T}">
      <path fill-rule="evenodd" d="M18 34 l54 0 -6 44 q-2 8 -10 8 l-22 0 q-8 0 -10 -8 Z"/>
      <path fill-rule="evenodd" d="M72 40 q18 -2 18 14 q0 16 -20 14 l2 -9 q10 1 10 -6 q0 -7 -9 -5 Z"/>
      <path d="M32 26 q-5 -8 1 -14 M46 26 q-5 -8 1 -14 M60 26 q-5 -8 1 -14" stroke="{T}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M2 72 q8 -14 3 -26 q12 8 10 26 q-2 12 -13 0 Z"/>
      <path d="M92 74 q7 -12 3 -22 q10 7 9 22 q-2 11 -12 0 Z"/></g>''')
    # 28 POR 7 VOTOS — la papeleta entrando en la urna
    R[28] = ("lado-der", 84, 80, f'''<g fill="{T}">
      <path fill-rule="evenodd" d="M6 40 q0 -8 8 -8 l56 0 q8 0 8 8 l0 30 q0 8 -8 8 l-56 0 q-8 0 -8 -8 Z
        M22 38 l40 0 0 8 -40 0 Z"/>
      <rect x="28" y="2" width="30" height="20" rx="3" transform="rotate(14 43 12)"/></g>''')
    # 29 FISCAL SOPLÓN — el silbato colgando junto al sello
    R[29] = ("lado-der", 78, 74, f'''
      <path fill="{T}" fill-rule="evenodd" d="M8 28 q0 -12 12 -12 l34 0 0 16 12 0 q6 0 5 7 l-2 10 q-13 22 -34 13 q-27 -8 -27 -34 Z
        M26 36 a9 9 0 1 0 0.1 0 Z"/>
      <path d="M52 6 q14 -4 20 8" stroke="{T}" stroke-width="5" fill="none" stroke-linecap="round"/>''')
    # 30 Ecologetas — la hoja con enchufe
    R[30] = ("lado-izq", 84, 90, f'''<g fill="{T}">
      <path fill-rule="evenodd" transform="rotate(-24 40 34)" d="M40 0 q34 18 28 50 q-5 22 -28 22 q-23 0 -28 -22 q-6 -32 28 -50 Z
        M37 14 l6 0 0 50 -6 0 Z"/>
      <path d="M46 66 q10 14 22 16 l-2 9 q-16 -2 -26 -18 Z"/>
      <rect x="64" y="78" width="16" height="12" rx="3"/></g>
      <g stroke="{T}" stroke-width="6" stroke-linecap="round"><line x1="70" y1="96" x2="70" y2="106"/><line x1="80" y1="96" x2="80" y2="106"/></g>''')
    # 31 SOY FEMINISTA… — el puño en alto
    R[31] = ("arriba", 76, 94, f'''<g fill="{T}">
      <path fill-rule="evenodd" d="M10 46 q0 -8 8 -10 l0 -8 q0 -8 8 -8 q6 0 8 5 l0 -3 q0 -8 8 -8 q7 0 8 7 l0 3 q2 -6 9 -5 q7 1 7 9 l0 8 q8 2 8 10 l0 18 q0 26 -32 26 q-32 0 -32 -26 Z
        M24 34 l6 0 0 16 -6 0 Z M38 30 l6 0 0 20 -6 0 Z M52 34 l6 0 0 16 -6 0 Z"/>
      <path d="M6 58 q-8 -14 4 -22 l5 8 q-7 5 -1 13 Z"/>
      <rect x="12" y="82" width="52" height="10" rx="5"/></g>''')
    # 44 ALMA SOCIALISTA, MENTE DE TIBURÓN — la aleta asomando
    R[44] = ("arriba", 132, 66, f'''<g fill="{T}">
      <path d="M62 2 q30 12 34 46 l-56 0 q4 -30 22 -46 Z"/>
      <path d="M2 58 q10 -10 22 0 q10 10 22 0 q10 -10 22 0 q10 10 22 0 q10 -10 22 0 l0 8 -110 0 Z" opacity="0.9"/></g>''')
    # 45 TRANSVERSAL, COMO EL IVA — el ticket de caja
    R[45] = ("lado-der", 62, 92, f'''
      <path fill="{T}" fill-rule="evenodd" d="M8 6 l46 0 0 78 -7 -6 -8 6 -8 -6 -8 6 -8 -6 -7 6 Z
        M18 20 l26 0 0 6 -26 0 Z M18 34 l26 0 0 6 -26 0 Z M18 48 l18 0 0 6 -18 0 Z
        M20 60 l6 -1 14 15 -6 1 Z M40 60 l6 1 -14 15 -6 -1 Z"/>''')
    # 46 HORIZONTE 2030 — el sol pixelado saliendo (¿o poniéndose?)
    R[46] = ("abajo", 120, 40, f'''<g fill="{T}">
      <rect x="44" y="8" width="10" height="10"/><rect x="55" y="2" width="10" height="10"/><rect x="66" y="8" width="10" height="10"/>
      <rect x="33" y="14" width="10" height="10"/><rect x="77" y="14" width="10" height="10"/>
      <rect x="0" y="28" width="120" height="8"/></g>''')
    # 47 COMPROMISO FIRME… — los dedos cruzados a la espalda
    R[47] = ("lado-der", 70, 92, f'''<g fill="{T}" transform="rotate(14 35 46)">
      <path fill-rule="evenodd" d="M14 22 q0 -18 21 -18 q21 0 21 18 q0 12 -10 14 l0 10 q14 2 14 12 l-50 0 q0 -10 14 -12 l0 -10 q-10 -2 -10 -14 Z
        M22 16 q4 -6 12 -6 l0 6 q-6 0 -8 4 Z"/>
      <path d="M32 58 l6 0 -2 26 q-1 6 -2 0 Z"/></g>''')
    # 48 ESCUCHA ACTIVA… — la oreja
    R[48] = ("lado-izq", 64, 88, f'''<g fill="none" stroke="{T}" stroke-width="9" stroke-linecap="round">
      <path d="M14 30 q0 -22 20 -22 q22 0 22 24 q0 14 -12 24 q-10 8 -10 18 q0 10 -10 10 q-10 0 -12 -10"/>
      <path d="M28 34 q0 -10 8 -10 q10 0 10 12"/></g>''')
    # 49 RESILIENTE… — el muelle con su pesa
    R[49] = ("lado-der", 78, 88, f'''<rect x="14" y="2" width="50" height="12" rx="4" fill="{T}"/>
      <g fill="none" stroke="{T}" stroke-width="8" stroke-linecap="round">
      <path d="M16 24 l46 8 M62 32 l-46 10 M16 42 l46 10 M62 52 l-46 10 M16 62 l46 10"/></g>
      <rect x="6" y="78" width="66" height="10" rx="4" fill="{T}"/>''')
    # 50 TRANSPARENCIA TOTAL, PREVIA CITA — la máquina de turnos
    R[50] = ("arriba", 88, 86, f'''<g fill="{T}">
      <path fill-rule="evenodd" d="M4 4 l80 0 0 58 -80 0 Z
        M14 14 l60 0 0 22 -60 0 Z M22 44 l44 0 0 8 -44 0 Z"/>
      <path fill-rule="evenodd" d="M30 66 l28 0 0 20 -28 0 Z
        M36 72 l16 0 0 3 -16 0 Z M36 79 l10 0 0 3 -10 0 Z"/></g>''')
    # 51 EL PUEBLO PRIMERO… — la cola, y uno colándose
    R[51] = ("arriba", 150, 70, f'''<g fill="{T}" opacity="0.85">
      <circle cx="96" cy="16" r="11"/><path d="M84 70 l3 -30 q9 -6 18 0 l3 30 Z"/>
      <circle cx="122" cy="16" r="11"/><path d="M110 70 l3 -30 q9 -6 18 0 l3 30 Z"/></g>
      <g fill="{T}">
      <circle cx="24" cy="12" r="13"/><path d="M8 70 l4 -34 q12 -8 24 0 l4 34 Z"/>
      <path d="M40 30 l16 -8 M8 30 l-6 -10" stroke="{T}" stroke-width="7" stroke-linecap="round"/></g>''')
    # 52 CAMBIO DE OPINIÓN… — la veleta
    R[52] = ("arriba", 104, 84, f'''
      <path fill="{T}" d="M20 84 l0 -40 q0 -26 30 -26 q30 0 30 26 l0 6 14 0 -22 26 -22 -26 14 0 0 -6 q0 -12 -14 -12 q-14 0 -14 12 l0 40 Z"/>''')
    # 53 Vocación de servicio… — el sobre de la nómina, lacrado con euro
    R[53] = ("lado-izq", 94, 66, f'''
      <path fill="{T}" fill-rule="evenodd" d="M2 4 q0 -2 2 -2 l86 0 q2 0 2 2 l0 56 q0 4 -4 4 l-82 0 q-4 0 -4 -4 Z
        M8 8 l39 24 -39 24 Z M86 8 l-39 24 39 24 Z"/>
      <path fill="{T}" d="M47 22 a17 17 0 1 1 -0.1 0 Z"/>
      <text x="47" y="47" text-anchor="middle" fill="#22260F" font-family="Barlow Condensed" font-weight="700" font-size="26">€</text>''')
    return R

DIBUJOS_POR_PIEZA = _dibujos(TINTA)

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


def compon(lineas, trato, voz, medida=None, slug="x", n=None) -> str:
    """Interior del SVG. `medida` es el bbox REAL del texto ya renderizado:
    los contenedores (caja, sello, corchetes, filetes) se ciñen a él en una
    segunda pasada, porque un contenedor de tamaño fijo baila según la
    longitud de la frase y eso se ve a la primera."""
    fam, ajuste = VOCES[voz]
    refuerza = voz in ("serif", "serif-it", "mono", "cond-lig")
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
            # Pasada 2: la pieza con sus contenedores ajustados a esa medida.
            cuerpo = compon(lineas, trato, voz, medida=medida, slug=slug, n=n)
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
