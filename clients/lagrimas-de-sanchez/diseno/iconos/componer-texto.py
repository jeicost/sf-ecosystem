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
                        f'width="{(col-inicio)*u:.1f}" height="{u:.1f}"/>'
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
    (16, "t-hermanisimo",       ["HERMANÍSIMO"],                          "sello",   "cond"),
    (19, "t-rufian",            ["rufián", "s. m."],                      "diccio",  "serif"),
    (20, "t-mema",              ["MEMA"],                                 "hueca",   "cond"),
    (21, "t-patxi-verguenza-ajena", ["PATXI", "VERGÜENZA", "AJENA"],      "desnuda", "cond"),
    (22, "t-al-menos-no-gobierna-la-ultraderecha",
         ["AL MENOS NO", "GOBIERNA LA", "ULTRADERECHA"],                  "caja",    "cond"),
    (23, "t-no-dormiria-tranquilo", ["NO DORMIRÍA", "TRANQUILO"],         "desnuda", "cond"),
    (24, "t-espana-va-como-un-cohete", ["ESPAÑA VA", "COMO UN COHETE"],   "desnuda", "cond"),
    (25, "t-son-las-5-y-no-he-comido", ["SON LAS", "5", "Y NO HE COMIDO"], "cifra",  "cond"),
    (26, "t-facha",             ["FACHA"],                                "caja",    "cond"),
    (27, "t-yo-estoy-bien",     ["YO ESTOY", "BIEN"],                     "hueca",   "cond"),
    (28, "t-por-7-votos",       ["POR", "7", "VOTOS"],                    "cifra",   "cond"),
    (29, "t-fiscal-soplon",     ["FISCAL", "SOPLÓN"],                     "sello",   "cond"),
    (30, "t-ecologetas",        ["Ecologetas"],                           "desnuda", "redonda"),
    (31, "t-soy-feminista-porque-soy-socialista",
         ["SOY FEMINISTA", "PORQUE SOY", "SOCIALISTA"],                   "desnuda", "cond"),
    (44, "t-alma-socialista-mente-de-tiburon",
         ["ALMA SOCIALISTA,", "MENTE DE TIBURÓN"],                        "caja",    "cond"),
    (45, "t-transversal-como-el-iva", ["TRANSVERSAL,", "COMO EL IVA"],    "regla",   "cond"),
    (46, "t-horizonte-2030-legislatura-2027",
         ["HORIZONTE", "2030", "LEGISLATURA", "2027"],                    "contador","cond"),
    (47, "t-compromiso-firme-hasta-nueva-orden",
         ["COMPROMISO", "FIRME HASTA", "NUEVA ORDEN"],                    "desnuda", "cond"),
    (48, "t-escucha-activa-decision-tomada",
         ["ESCUCHA ACTIVA,", "DECISIÓN TOMADA"],                          "acta",    "mono"),
    (49, "t-resiliente-o-sea-que-aguantas",
         ["RESILIENTE,", "O SEA, QUE", "AGUANTAS"],                       "hueca",   "cond"),
    (50, "t-transparencia-total-previa-cita",
         ["TRANSPARENCIA", "TOTAL,", "PREVIA CITA"],                      "desnuda", "cond"),
    (51, "t-el-pueblo-primero-despues-de-mi",
         ["EL PUEBLO PRIMERO.", "DESPUÉS DE MÍ."],                        "caja",    "cond"),
    (52, "t-cambio-de-opinion-no-de-sueldo",
         ["CAMBIO DE", "OPINIÓN,", "NO DE SUELDO"],                       "desnuda", "cond"),
    (53, "t-vocacion-de-servicio-nomina-de-por-vida",
         ["Vocación de servicio,", "nómina de por vida"],                 "solemne", "serif-it"),
]

CUERPO = 66          # tamaño base de letra
INTERLINEA = 0.88    # las frases van APRETADAS: es lo que hace bloque
MARGEN = 14


def compon(lineas, trato, voz, medida=None, slug="x") -> str:
    """Interior del SVG. `medida` es el bbox REAL del texto ya renderizado:
    los contenedores (caja, sello, corchetes, filetes) se ciñen a él en una
    segunda pasada, porque un contenedor de tamaño fijo baila según la
    longitud de la frase y eso se ve a la primera."""
    fam, ajuste = VOCES[voz]
    t = CUERPO * ajuste
    salto = t * INTERLINEA
    cx, cy = 500, 300
    y0 = cy - (len(lineas) - 1) * salto / 2

    def texto(ls, extra="", fill=TINTA, x=None, base=None):
        # `fill` se resuelve AQUÍ y no se repite en `extra`: un atributo
        # duplicado no da error, invalida el SVG entero y la pieza sale en
        # blanco sin avisar. Ya pasó con letter-spacing.
        xx = cx if x is None else x
        yy = y0 if base is None else base
        pintura = "" if fill is None else f'fill="{fill}" '
        return "".join(
            f'<text x="{xx}" y="{yy + i*salto:.1f}" text-anchor="middle" '
            f'{pintura}{fam} font-size="{t:.1f}" {extra}>{l}</text>'
            for i, l in enumerate(ls)
        )

    if trato == "desnuda":
        return texto(lineas)

    if trato == "hueca":
        # Contorno sin relleno: ocupa su sitio en la retícula pero deja pasar
        # el vidrio. Es el respiro que no deja hueco.
        return texto(lineas, fill="none", extra=f'stroke="{TINTA}" stroke-width="3.2"')

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
            f'{texto(lineas, fill="#000")}</mask>'
            f'<rect x="{x:.1f}" y="{y:.1f}" width="{ancho:.1f}" height="{alto:.1f}" '
            f'rx="6" fill="{TINTA}" mask="url(#c-{slug})"/>'
        )

    if trato == "sello":
        # Doble aro CEÑIDO: con radio fijo, una palabra corta nada dentro de
        # un círculo enorme y la pieza pierde densidad.
        r = max(medida["w"], medida["h"]) / 2 + 34
        return (
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{TINTA}" stroke-width="9"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r-19}" fill="none" stroke="{TINTA}" stroke-width="3"/>'
            + texto(lineas)
        )

    if trato == "diccio":
        # Entrada de diccionario: la capa que añade el icono cuando el nombre
        # ya lo dice todo.
        fam2, aj2 = VOCES["serif-it"]
        return (
            f'<text x="{cx}" y="{cy - 10}" text-anchor="middle" fill="{TINTA}" {fam} '
            f'font-size="{CUERPO*1.35:.0f}">{lineas[0]}</text>'
            f'<text x="{cx}" y="{cy + 58}" text-anchor="middle" fill="{TINTA}" {fam2} '
            f'font-size="{CUERPO*0.62:.0f}">{lineas[1]}</text>'
            f'<rect x="{cx-90}" y="{cy+82}" width="180" height="5" rx="2.5" fill="{TINTA}"/>'
        )

    if trato == "regla":
        # Subrayado grueso: da peso sin ocupar otra línea.
        w = medida["w"] * 0.98
        return texto(lineas) + (
            f'<rect x="{cx - w/2:.1f}" y="{y0 + (len(lineas)-1)*salto + 20:.1f}" '
            f'width="{w:.1f}" height="9" rx="4.5" fill="{TINTA}"/>'
        )

    if trato == "acta":
        # Registro burocrático: mono, tracking ancho y corchetes de expediente.
        cuerpo = texto(lineas, extra='letter-spacing="1.5"')
        y1, y2 = y0 - t * 0.95, y0 + (len(lineas) - 1) * salto + t * 0.35
        xi, xd = cx - medida["w"] / 2 - 26, cx + medida["w"] / 2 + 26
        g = f'<g fill="none" stroke="{TINTA}" stroke-width="6">'
        g += f'<path d="M{xi+30:.0f} {y1:.0f} h-30 v{y2-y1:.0f} h30"/>'
        g += f'<path d="M{xd-30:.0f} {y1:.0f} h30 v{y2-y1:.0f} h-30"/></g>'
        return cuerpo + g

    if trato == "solemne":
        # Cursiva con filetes: la solemnidad es el chiste.
        cuerpo = texto(lineas)
        y1 = y0 - t * 1.25
        y2 = y0 + (len(lineas) - 1) * salto + t * 0.6
        w = medida["w"] * 1.02
        return (
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
        chico = t * (0.62 if trato == "cifra" else 0.54)
        for l in lineas:
            if l.isdigit():
                u = (t * (1.55 if trato == "cifra" else 1.05)) / 7
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
        return "".join(partes)

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
            cuerpo = compon(lineas, trato, voz, medida=medida, slug=slug)
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
