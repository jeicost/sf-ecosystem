"""Genera el PDF del Brand Brain a partir del .md.

    pip3 install --user markdown playwright && python3 build-brand-brain-pdf.py

El .md es la fuente de verdad; el PDF se regenera. No editar el PDF a mano.

Gotchas de python-markdown que ya mordieron una vez:
  - Una lista que va detrás de un párrafo NECESITA una línea en blanco delante,
    o sale como texto corrido con guiones.
  - Dos líneas seguidas sin línea en blanco se funden en el mismo párrafo.
"""
import io, re, asyncio, markdown, pathlib

SRC = '/Users/carlosjacoste/Developer/Claude/clients/discoolver/deliverables/BRAND_BRAIN_DISCOOLVER_2026-08.md'
OUT = '/Users/carlosjacoste/Developer/Claude/clients/discoolver/deliverables/BRAND_BRAIN_DISCOOLVER_2026-08.pdf'

md = io.open(SRC, encoding='utf-8').read()

# La cabecera del .md (título + dos líneas de meta) se convierte en portada aparte
lines = md.split('\n')
body_md = '\n'.join(lines[6:]) if lines[0].startswith('# ') else md

html_body = markdown.markdown(body_md, extensions=['tables', 'fenced_code', 'sane_lists'])

# Cada "## " abre página nueva salvo la primera
html_body = re.sub(r'<h2>', '<h2 class="pb">', html_body)
html_body = html_body.replace('<h2 class="pb">', '<h2>', 1)

CSS = """
@page { size: A4; margin: 20mm 18mm 22mm; }
* { box-sizing: border-box; }
body { font-family: "Helvetica Neue", Arial, sans-serif; font-size: 10pt; line-height: 1.55;
       color: #1b1b22; margin: 0; -webkit-font-smoothing: antialiased; }

/* ---------- portada ---------- */
/* A4 297mm - 20mm arriba - 22mm abajo = 255mm de caja. 248 deja holgura para
   que la línea de versión no se desborde a una página huérfana. */
.cover { height: 248mm; display: flex; flex-direction: column; justify-content: space-between;
         page-break-after: always; overflow: hidden; }
.cover__top { padding-top: 38mm; }
.cover__mark { display: flex; align-items: center; gap: 10px; margin-bottom: 54px; }
.cover__glyph { width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(90deg, #C8006B 0 50%, transparent 50% 100%); position: relative; }
.cover__glyph::after { content: ""; position: absolute; left: 15px; top: 4px;
  border-left: 13px solid #C8006B; border-top: 11px solid transparent; border-bottom: 11px solid transparent; }
.cover__word { font-size: 21pt; font-weight: 300; letter-spacing: -0.02em; color: #1b1b22; }
.cover h1 { font-size: 40pt; line-height: 1.02; font-weight: 300; letter-spacing: -0.035em;
            margin: 0 0 20px; color: #1b1b22; }
.cover h1 em { font-style: normal; color: #C8006B; }
.cover__sub { font-size: 12.5pt; color: #55555f; max-width: 118mm; line-height: 1.5; font-weight: 300; }
.cover__rule { width: 54px; height: 3px; background: #C8006B; margin: 30px 0; }
.cover__meta { font-size: 8.5pt; color: #86868f; letter-spacing: .04em; text-transform: uppercase; }
.cover__meta strong { color: #1b1b22; font-weight: 600; }
.cover__brands { display: flex; gap: 12px; margin-top: 26px; }
.cover__brand { flex: 1; border: 1px solid #e4e0e6; border-radius: 8px; padding: 14px 16px; }
.cover__brand h4 { margin: 0 0 5px; font-size: 11pt; font-weight: 600; letter-spacing: -0.01em; }
.cover__brand p { margin: 0; font-size: 8.5pt; color: #6b6b76; line-height: 1.45; }
.b2c h4 { color: #C8006B; } .b2b h4 { color: #8A00A8; }

/* ---------- tipografía ---------- */
h2 { font-size: 19pt; font-weight: 300; letter-spacing: -0.025em; color: #1b1b22;
     margin: 0 0 4px; padding-bottom: 9px; border-bottom: 2px solid #C8006B; }
h2.pb { page-break-before: always; margin-top: 0; }
h3 { font-size: 12pt; font-weight: 600; letter-spacing: -0.01em; color: #1b1b22;
     margin: 22px 0 7px; page-break-after: avoid; }
p { margin: 0 0 9px; }
strong { font-weight: 600; color: #0f0f14; }
em { color: #44444d; }
code { font-family: "SF Mono", Menlo, monospace; font-size: 8.5pt; background: #f4eff3;
       color: #A0005A; padding: 1px 4px; border-radius: 3px; }
pre { background: #1b1b22; color: #e8e6ea; padding: 13px 16px; border-radius: 7px;
      font-size: 8pt; line-height: 1.45; overflow: hidden; page-break-inside: avoid; }
pre code { background: none; color: inherit; padding: 0; font-size: 8pt; }
hr { border: 0; border-top: 1px solid #e8e4ea; margin: 22px 0; }
a { color: #C8006B; text-decoration: none; }

ul, ol { margin: 0 0 10px; padding-left: 17px; }
li { margin-bottom: 4px; padding-left: 2px; }
li::marker { color: #C8006B; }

/* ---------- tablas ---------- */
table { width: 100%; border-collapse: collapse; margin: 12px 0 16px; font-size: 8.5pt;
        page-break-inside: avoid; }
th { background: #1b1b22; color: #fff; text-align: left; padding: 8px 10px; font-weight: 600;
     font-size: 8pt; letter-spacing: .02em; }
th:first-child { border-radius: 5px 0 0 0; } th:last-child { border-radius: 0 5px 0 0; }
td { padding: 7px 10px; border-bottom: 1px solid #ece8ee; vertical-align: top; line-height: 1.42; }
tr:nth-child(even) td { background: #faf8fa; }

/* ---------- realces ---------- */
blockquote { margin: 0 0 12px; padding: 10px 15px; background: #faf6f9;
             border-left: 3px solid #C8006B; font-size: 9.5pt; }
blockquote p:last-child { margin-bottom: 0; }
"""

COVER = """
<div class="cover">
  <div class="cover__top">
    <div class="cover__mark">
      <div class="cover__glyph"></div>
      <div class="cover__word">discoolver</div>
    </div>
    <h1>Brand Brain<br><em>2026</em></h1>
    <div class="cover__rule"></div>
    <p class="cover__sub">Arquitectura de marca, separación de servicios y reglas de comunicación.
    Documento de referencia: si algo aquí choca con un documento anterior, manda este.</p>
    <div class="cover__brands">
      <div class="cover__brand b2c">
        <h4>discoolver</h4>
        <p>B2C · La app, las guías editoriales y el programa de creators. Viajeros, locales y creadores.</p>
      </div>
      <div class="cover__brand b2b">
        <h4>discoolver 360</h4>
        <p>B2B · Plataforma SaaS modular. Destinos, alojamientos y agencias.</p>
      </div>
    </div>
  </div>
  <div class="cover__meta">Versión <strong>6 de agosto de 2026</strong> &nbsp;·&nbsp; Uso interno y equipo</div>
</div>
"""

HTML = f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Discoolver — Brand Brain 2026</title><style>{CSS}</style></head>
<body>{COVER}{html_body}</body></html>"""

tmp = '/private/tmp/claude-501/-Users-carlosjacoste/2cc740ac-50ff-4ead-9b68-a319f7419cae/scratchpad/bb.html'
io.open(tmp, 'w', encoding='utf-8').write(HTML)


async def main():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.goto('file://' + tmp, wait_until='networkidle')
        await pg.pdf(
            path=OUT, format='A4', print_background=True,
            margin={'top': '20mm', 'bottom': '22mm', 'left': '18mm', 'right': '18mm'},
            display_header_footer=True,
            header_template='<div></div>',
            footer_template=(
                '<div style="width:100%;font-family:Helvetica,Arial;font-size:7.5pt;color:#9a9aa4;'
                'padding:0 18mm;display:flex;justify-content:space-between;">'
                '<span>discoolver · Brand Brain 2026</span>'
                '<span class="pageNumber"></span></div>'),
        )
        await b.close()

asyncio.run(main())
print('OK', OUT, pathlib.Path(OUT).stat().st_size, 'bytes')
