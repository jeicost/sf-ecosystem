#!/usr/bin/env python3
"""
Compone los PICTOGRAMAS del estampado como signos, no como ilustraciones.

    python3 componer-signos.py

EL CAMBIO QUE HACE ESTE FICHERO. Los pictogramas anteriores eran siluetas
macizas y detalladas: un caballo con sus patas, un tucán con sus plumas. A 12
milímetros —que es el tamaño real sobre el vidrio— un dibujo detallado no se
ve como un dibujo, se ve como una mancha sucia. Y 56 siluetas macizas seguidas
aplanan el estampado: no hay respiración.

La referencia (El Xitxarel·lo) hace lo contrario y por eso funciona: **alterna
línea y masa**, las formas son signos de dos o tres trazos, y la palabra no va
nunca debajo del dibujo como un pie de foto — va AL LADO, DENTRO del objeto, o
el objeto ocupa el lugar de una letra.

LAS TRES REGLAS DEL SISTEMA
1. Un solo grosor de línea en todo el set (`TRAZO`), sea cual sea el tamaño
   final de la pieza. Es lo que hace que 56 piezas parezcan de la misma mano.
2. Todo se dibuja en la misma retícula de 100×100, así que todos los signos
   nacen con el mismo tamaño óptico.
3. Si el signo necesita más de seis trazos, está mal pensado.
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

AQUI = Path(__file__).resolve().parent
ICONOS = AQUI.parent.parent / "web" / "public" / "iconos"

TINTA = "#F6F1E6"
TRAZO = 7.5          # el grosor único de todo el set, en la retícula de 100
MARGEN = 5

L = f'fill="none" stroke="{TINTA}" stroke-width="{TRAZO}" stroke-linecap="round" stroke-linejoin="round"'
M = f'fill="{TINTA}"'


# ── Los signos, en la retícula de 100×100 ─────────────────────────────────
# Cada uno devuelve su dibujo. Nada de detalle interior que no sobreviva a
# 12 mm: si hay que entrecerrar los ojos para verlo, sobra.
SIGNOS = {
    # LÍNEA ────────────────────────────────────────────────────────────────
    "metronomo": f'<g {L}><path d="M50 12 L74 82 L26 82 Z"/><path d="M50 78 L38 30"/>'
                 f'<rect x="31" y="38" width="16" height="9" rx="2" {M}/></g>',
    "tele":      f'<g {L}><rect x="14" y="34" width="72" height="52" rx="7"/>'
                 f'<path d="M36 34 L26 14 M64 34 L74 14"/></g>',
    "urna":      f'<g {L}><path d="M18 40 h64 v46 a4 4 0 0 1 -4 4 h-56 a4 4 0 0 1 -4 -4 Z"/>'
                 f'<path d="M36 40 v-8 h28 v8"/><path d="M38 54 h24"/></g>',
    "lata":      f'<g {L}><ellipse cx="50" cy="60" rx="34" ry="22"/>'
                 f'<path d="M22 44 q28 -22 58 -4"/></g>'
                 f'<g {M}><circle cx="40" cy="58" r="5"/><circle cx="54" cy="55" r="5"/>'
                 f'<circle cx="62" cy="64" r="5"/><circle cx="46" cy="68" r="5"/></g>',
    "jet":       f'<path {M} d="M50 8 q7 0 8 10 l2 26 34 20 v10 l-34 -9 -2 18 12 10 v7 l-20 -5 -20 5 v-7 '
                 f'l12 -10 -2 -18 -34 9 v-10 l34 -20 2 -26 q1 -10 8 -10 Z"/>',
    "maquina":   f'<g {L}><path d="M30 34 L38 14 h26 l8 20"/>'
                 f'<rect x="24" y="34" width="52" height="34" rx="4"/>'
                 f'<path d="M38 68 v10 h26 v-10"/>'
                 f'<path d="M76 46 h10 v-14"/><circle cx="86" cy="28" r="6"/></g>'
                 f'<g {M}><path d="M44 82 q4 7 4 11 a6 6 0 0 1 -12 0 q0 -4 4 -11 Z"/>'
                 f'<path d="M60 82 q4 7 4 11 a6 6 0 0 1 -12 0 q0 -4 4 -11 Z"/></g>',
    "felpudo":   f'<g {L}><path d="M20 38 h60 l10 34 h-80 Z"/>'
                 f'<path d="M30 50 h40 M28 62 h44" stroke-dasharray="5 6"/></g>',
    "aviso":     f'<g {L}><path d="M50 16 L88 82 L12 82 Z"/><path d="M50 40 v18"/></g>'
                 f'<circle cx="50" cy="70" r="4.6" {M}/>',
    "vapor":     f'<g {L}><path d="M28 86 q14 -14 0 -28 q-14 -14 0 -28"/>'
                 f'<path d="M50 90 q15 -16 0 -32 q-15 -16 0 -32"/>'
                 f'<path d="M72 86 q14 -14 0 -28 q-14 -14 0 -28"/></g>',
    "cuernos":   f'<g {L}><path d="M40 84 q-8 -30 2 -48"/><path d="M36 60 q-14 -4 -20 -16"/>'
                 f'<path d="M38 42 q-12 -6 -14 -20"/>'
                 f'<path d="M60 84 q8 -30 -2 -48"/><path d="M64 60 q14 -4 20 -16"/>'
                 f'<path d="M62 42 q12 -6 14 -20"/></g>',
    "barras":    f'<g {M}><rect x="22" y="26" width="6" height="48"/>'
                 f'<rect x="33" y="26" width="3" height="48"/><rect x="41" y="26" width="7" height="48"/>'
                 f'<rect x="53" y="26" width="3" height="48"/><rect x="60" y="26" width="6" height="48"/>'
                 f'<rect x="71" y="26" width="3" height="48"/></g>',

    # MASA ─────────────────────────────────────────────────────────────────
    "corona":    f'<g {M}><path d="M16 74 L22 34 L38 50 L50 22 L62 50 L78 34 L84 74 Z"/>'
                 f'<rect x="14" y="78" width="72" height="11" rx="3"/></g>',
    "gota":      f'<path {M} d="M50 10 C58 34 78 48 78 64 A28 28 0 1 1 22 64 C22 48 42 34 50 10 Z"/>',
    "dedo":      f'<g {M}><path d="M44 10 q8 0 8 9 v36 h-16 v-36 q0 -9 8 -9 Z"/>'
                 f'<path d="M30 52 h30 q16 0 16 15 v10 q0 15 -16 15 h-22 q-14 0 -14 -14 v-12 q0 -14 6 -14 Z"/>'
                 f'<path d="M30 62 q-10 1 -10 10 q0 9 10 10 Z"/></g>',
    "coche":     f'<g {M}><path d="M12 62 q0 -8 10 -10 l10 -2 q8 -14 22 -14 h14 q13 0 18 14 l10 2 q6 2 6 10 v8 h-90 Z"/></g>'
                 f'<g {L}><circle cx="32" cy="72" r="8"/><circle cx="70" cy="72" r="8"/></g>',
    "caballo":   f'<path {M} d="M18 26 l6 -14 6 10 q10 -4 14 6 l4 14 q24 -2 32 10 '
                 f'q6 7 6 16 l2 26 h-10 l-4 -24 -14 4 -2 20 h-10 l2 -22 -14 -2 -4 24 h-10 '
                 f'l4 -28 q-10 -8 -8 -22 l-2 -14 q-6 -2 -6 -8 q0 -6 6 -6 Z"/>'
                 f'<path {M} d="M78 52 q10 6 16 16 q-8 -2 -14 -8 Z"/>',
    "mazo":      f'<g {M}><rect x="18" y="20" width="40" height="19" rx="4" transform="rotate(-26 38 30)"/>'
                 f'<rect x="44" y="40" width="9" height="30" rx="4" transform="rotate(-26 48 55)"/></g>'
                 f'<g {L}><path d="M46 84 h40"/><path d="M52 74 h28"/></g>',
    "recuadro":  f'<g {L}><rect x="12" y="32" width="76" height="36" rx="5"/></g>'
                 f'<g {M}><rect x="42" y="56" width="34" height="4" rx="2"/></g>',
}


# ── Las piezas: signo + palabra, con su tratamiento ───────────────────────
# `modo` es lo que rompe el patrón de «icono con pie de foto»:
#   solo     — el signo se basta
#   lado     — palabra a la derecha, misma línea base
#   dentro   — palabra CALADA dentro del signo
#   bajo     — debajo, pero apretado y pequeño (la excepción, no la regla)
PIEZAS = [
    (14, "14-marlaskona",             "mazo",      "MARLASKONA",  "lado"),
    (15, "15-felpudo-vi",             "felpudo",   "FELPUDO VI",  "bajo"),
    (18, "18-javierito",              "cuernos",   "JAVIERITO",   "lado"),
    (32, "32-sincronizada",           "metronomo", "SINCRONIZADA","bajo"),
    (33, "33-la-banda-del-peugeot",   "coche",     "LA BANDA",    "bajo"),
    (34, "34-fango",                  None,        "FANGO",       "goteo"),
    (35, "35-bulos",                  "aviso",     "BULOS",       "lado"),
    (36, "36-telepedro",              "tele",      "TELEPEDRO",   "dentro"),
    (37, "37-saunas",                 "vapor",     "SAUNAS",      "lado"),
    (38, "38-el-puto-amo",            "corona",    "EL PUTO AMO", "bajo"),
    (39, "39-el-uno",                 "dedo",      "EL UNO",      "lado"),
    (40, "40-falcon",                 "jet",       "FALCON",      "lado"),
    (41, "41-maquina-del-fango",      "maquina",   "MÁQUINA DEL FANGO", "bajo"),
    (42, "42-cabalgar-contradicciones","caballo",  "CABALGAR",    "bajo"),
    (43, "43-izquierda-caviar",       "lata",      "IZQUIERDA CAVIAR", "bajo"),
    (55, "55-pucherazo",              "urna",      "PUCHERAZO",   "lado"),
    (56, "56-contiene-lagrimas",      "gota",      None,          "solo"),
    (57, "57-edicion-numerada",       "recuadro",  "EDICIÓN Nº",  "lado"),
]

FAM = 'font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700"'


def pieza(signo, palabra, modo, slug, bajo=None):
    """Devuelve el interior del SVG en la retícula de 100 (el signo) más el
    texto colocado según el modo."""
    dib = SIGNOS[signo] if signo else ""

    if modo == "solo":
        return dib

    if modo == "goteo":
        # La palabra ES el objeto: gotea. El signo no existe aparte.
        gotas = "".join(
            f'<path {M} d="M{x} {y} q5 9 5 15 a7.5 7.5 0 0 1 -15 0 q0 -6 5 -15 Z"/>'
            for x, y in ((22, 52), (44, 60), (66, 54), (86, 62))
        )
        return (
            f'<text x="50" y="42" text-anchor="middle" fill="{TINTA}" {FAM} '
            f'font-size="34" letter-spacing="1">{palabra}</text>{gotas}'
        )

    if modo == "lado":
        # Signo a la izquierda, palabra a su derecha en la misma línea base.
        # Es el gesto que más aleja del «icono de aplicación».
        return (
            f'<g transform="translate(0 6) scale(0.86)">{dib}</g>'
            f'<text x="98" y="62" fill="{TINTA}" {FAM} font-size="30" '
            f'letter-spacing="0.5">{palabra}</text>'
        )

    if modo == "dentro":
        # La palabra calada DENTRO del objeto: la pantalla del televisor, el
        # frente de la urna. El objeto deja de ilustrar y pasa a contener.
        y = 62 if signo == "tele" else 72
        return (
            dib
            + f'<text x="50" y="{y}" text-anchor="middle" fill="{TINTA}" {FAM} '
            f'font-size="13" letter-spacing="0.4">{palabra}</text>'
        )

    # bajo — apretado contra el signo, no flotando a un cuerpo de distancia.
    y = (bajo if bajo is not None else 100) + 19
    return (
        dib
        + f'<text x="50" y="{y:.1f}" text-anchor="middle" fill="{TINTA}" {FAM} '
        f'font-size="19" letter-spacing="0.6">{palabra}</text>'
    )


# ── La familia de remates ─────────────────────────────────────────────────
# Lo que cose la composición y hasta ahora no existía. En la referencia hay
# flechas, asteriscos, estrellas y puntos metidos en los huecos de dos o tres
# milímetros. NO SIGNIFICAN NADA, y ese es exactamente su trabajo: sin ellos
# la retícula tiene agujeros; con ellos, tejido.
REMATES = {
    "r-flecha-ne":  f'<g {L}><path d="M20 80 L80 20"/><path d="M52 20 h28 v28"/></g>',
    "r-flecha-se":  f'<g {L}><path d="M20 20 L80 80"/><path d="M80 52 v28 h-28"/></g>',
    "r-flecha-e":   f'<g {L}><path d="M14 50 h64"/><path d="M56 30 L78 50 L56 70"/></g>',
    "r-flecha-n":   f'<g {L}><path d="M50 84 V22"/><path d="M28 42 L50 20 L72 42"/></g>',
    "r-asterisco":  f'<g {L}><path d="M50 16 V84 M22 33 L78 67 M78 33 L22 67"/></g>',
    "r-estrella":   f'<path {M} d="M50 14 L60 40 L88 42 L66 60 L74 88 L50 72 L26 88 L34 60 L12 42 L40 40 Z"/>',
    "r-rombos":     f'<g {M}><path d="M20 50 L32 36 L44 50 L32 64 Z"/><path d="M44 50 L56 36 L68 50 L56 64 Z"/>'
                    f'<path d="M68 50 L80 36 L92 50 L80 64 Z"/></g>',
    "r-cruz":       f'<g {L}><path d="M50 20 V80 M20 50 H80"/></g>',
    "r-puntos":     f'<g {M}><circle cx="24" cy="50" r="7"/><circle cx="50" cy="50" r="7"/>'
                    f'<circle cx="76" cy="50" r="7"/></g>',
    "r-barras":     f'<g {L}><path d="M34 22 V78 M54 22 V78 M74 22 V78"/></g>',
    "r-manecilla":  f'<g {L}><path d="M16 50 h52"/><path d="M52 34 L70 50 L52 66"/><path d="M80 30 v40"/></g>',
    "r-doble":      f'<g {L}><path d="M22 38 h56 M22 62 h56"/></g>',
}


PAGINA = """<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700&display=swap" rel="stylesheet">
<style>body{margin:0}</style></head><body><div id="caja"></div></body></html>"""


def main() -> int:
    with sync_playwright() as pw:
        nav = pw.chromium.launch()
        pag = nav.new_page()
        pag.set_content(PAGINA)
        pag.wait_for_timeout(2500)
        pag.evaluate("document.fonts.ready")

        def medir(cuerpo):
            return pag.evaluate(
                """(svg) => {
                    const c = document.getElementById('caja');
                    c.innerHTML = svg;
                    const el = c.querySelector('svg');
                    el.setAttribute('width','960'); el.setAttribute('height','600');
                    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
                    for (const h of el.querySelectorAll('path,rect,circle,ellipse,text,g')) {
                        let b; try { b = h.getBBox(); } catch { continue; }
                        if (!b || (!b.width && !b.height)) continue;
                        x0=Math.min(x0,b.x); y0=Math.min(y0,b.y);
                        x1=Math.max(x1,b.x+b.width); y1=Math.max(y1,b.y+b.height);
                    }
                    return isFinite(x0) ? {x:x0,y:y0,w:x1-x0,h:y1-y0} : null;
                }""",
                f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -20 320 200">{cuerpo}</svg>',
            )

        for n, slug, signo, palabra, modo in PIEZAS:
            # Dónde acaba el signo por abajo, para apoyar ahí la palabra.
            bajo = None
            if modo == "bajo" and signo:
                m0 = medir(SIGNOS[signo])
                if m0:
                    bajo = m0["y"] + m0["h"] + TRAZO / 2
            cuerpo = pieza(signo, palabra, modo, slug, bajo=bajo)
            bruto = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -20 320 200">{cuerpo}</svg>'
            caja = pag.evaluate(
                """(svg) => {
                    const c = document.getElementById('caja');
                    c.innerHTML = svg;
                    const el = c.querySelector('svg');
                    el.setAttribute('width','960'); el.setAttribute('height','600');
                    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
                    for (const h of el.querySelectorAll('path,rect,circle,ellipse,text,g')) {
                        let b; try { b = h.getBBox(); } catch { continue; }
                        if (!b || (!b.width && !b.height)) continue;
                        x0=Math.min(x0,b.x); y0=Math.min(y0,b.y);
                        x1=Math.max(x1,b.x+b.width); y1=Math.max(y1,b.y+b.height);
                    }
                    return isFinite(x0) ? {x:x0,y:y0,w:x1-x0,h:y1-y0} : null;
                }""",
                bruto,
            )
            if caja is None:
                print(f"  ✗ {slug}: no se pudo medir")
                continue
            # El trazo se pinta CENTRADO en el path: medio grosor se sale del
            # bbox por cada lado y, si no se suma, la pieza llega recortada.
            m = MARGEN + TRAZO / 2
            vb = (caja["x"] - m, caja["y"] - m, caja["w"] + 2 * m, caja["h"] + 2 * m)
            final = (
                f'<svg xmlns="http://www.w3.org/2000/svg" '
                f'viewBox="{vb[0]:.1f} {vb[1]:.1f} {vb[2]:.1f} {vb[3]:.1f}">\n  {cuerpo}\n</svg>\n'
            )
            (ICONOS / f"{slug}.svg").write_text(final, encoding="utf-8")
            print(f"  ✓ {slug:34s} {modo:7s} {vb[2]:5.0f}×{vb[3]:.0f}")

        for slug, dib in REMATES.items():
            caja = medir(dib)
            if caja is None:
                continue
            m = MARGEN + TRAZO / 2
            vb = (caja["x"] - m, caja["y"] - m, caja["w"] + 2 * m, caja["h"] + 2 * m)
            (ICONOS / f"{slug}.svg").write_text(
                f'<svg xmlns="http://www.w3.org/2000/svg" '
                f'viewBox="{vb[0]:.1f} {vb[1]:.1f} {vb[2]:.1f} {vb[3]:.1f}">\n  {dib}\n</svg>\n',
                encoding="utf-8",
            )
        print(f"  ✓ {len(REMATES)} remates")

        nav.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
