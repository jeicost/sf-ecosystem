"""
Dadybox Playbook Renderer — v2.0
Layout inspirado en HubSpot Reports:
- Páginas oscuras (navy) de sección alternando con páginas crema de contenido
- Tipografía masiva y bold en los section openers
- Decoraciones geométricas de arco en esquinas (verde Dadybox)
- Stat boxes con bordes superiores, tip boxes en navy
- Checkmarks verdes para bullets de insights
"""

from pathlib import Path
from brand import COLORS, AUTHOR, COMPANY

CREAM = "#F5F2EB"   # Fondo crema cálido para páginas de contenido
NAVY  = COLORS["primary"]    # #0B1829
GREEN = COLORS["accent"]     # #3EE89A
GREEN_D = COLORS["accent_dark"]   # #1A9B60
GREEN_M = COLORS["accent_mid"]    # #2DC080


# ─────────────────────────────────────────────────────────────
# SVG ELEMENTS
# ─────────────────────────────────────────────────────────────

def logo_svg(size: int = 28) -> str:
    """Cubo isométrico Dadybox + texto."""
    s = size
    return f"""<span style="display:inline-flex;align-items:center;gap:{int(s*0.35)}px;line-height:1">
        <svg width="{s}" height="{s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">
            <polygon points="50,5 95,30 50,55 5,30" fill="{GREEN}"/>
            <polygon points="5,30 50,55 50,97 5,72" fill="{GREEN_D}"/>
            <polygon points="95,30 50,55 50,97 95,72" fill="{GREEN_M}"/>
        </svg>
        <span style="font-weight:800;letter-spacing:-0.5px;font-size:{int(s*0.75)}px">dadybox</span>
    </span>"""


def arc_tr(size=110, light=False):
    """Arcos decorativos esquina superior derecha, estilo HubSpot."""
    c1 = GREEN if not light else NAVY
    c2 = GREEN_M if not light else "#1A3A5C"
    c3 = GREEN_D if not light else "#0D2A44"
    op = "0.9" if not light else "0.12"
    w = size
    # Arcos cuartos de círculo centrados en la esquina (w, 0)
    return f"""<svg style="position:absolute;top:0;right:0;pointer-events:none" width="{w}" height="{w}" viewBox="0 0 {w} {w}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        <path d="M {w} {int(w*0.55)} A {int(w*0.55)} {int(w*0.55)} 0 0 0 {int(w*0.45)} 0" fill="none" stroke="{c1}" stroke-width="8" opacity="{op}"/>
        <path d="M {w} {int(w*0.75)} A {int(w*0.75)} {int(w*0.75)} 0 0 0 {int(w*0.25)} 0" fill="none" stroke="{c2}" stroke-width="8" opacity="{op}"/>
        <path d="M {w} {int(w*0.95)} A {int(w*0.95)} {int(w*0.95)} 0 0 0 {int(w*0.05)} 0" fill="none" stroke="{c3}" stroke-width="8" opacity="{op}"/>
    </svg>"""


def arc_bl(size=110, light=False):
    """Arcos decorativos esquina inferior izquierda."""
    c1 = GREEN if not light else NAVY
    c2 = GREEN_M if not light else "#1A3A5C"
    c3 = GREEN_D if not light else "#0D2A44"
    op = "0.9" if not light else "0.12"
    w = size
    return f"""<svg style="position:absolute;bottom:0;left:0;pointer-events:none" width="{w}" height="{w}" viewBox="0 0 {w} {w}" xmlns="http://www.w3.org/2000/svg" overflow="visible">
        <path d="M 0 {int(w*0.45)} A {int(w*0.55)} {int(w*0.55)} 0 0 1 {int(w*0.55)} {w}" fill="none" stroke="{c1}" stroke-width="8" opacity="{op}"/>
        <path d="M 0 {int(w*0.25)} A {int(w*0.75)} {int(w*0.75)} 0 0 1 {int(w*0.75)} {w}" fill="none" stroke="{c2}" stroke-width="8" opacity="{op}"/>
        <path d="M 0 {int(w*0.05)} A {int(w*0.95)} {int(w*0.95)} 0 0 1 {int(w*0.95)} {w}" fill="none" stroke="{c3}" stroke-width="8" opacity="{op}"/>
    </svg>"""


def geo_shapes_tr(dark_page=True):
    """Formas geométricas estilo HubSpot para esquina superior derecha."""
    if dark_page:
        c1, c2, c3 = GREEN, GREEN_M, GREEN_D
    else:
        c1, c2, c3 = NAVY, "#1A3A5C", "#0D2A44"
    op = "0.18" if not dark_page else "0.25"
    return f"""<svg style="position:absolute;top:0;right:0;pointer-events:none" width="70" height="130" viewBox="0 0 70 130" xmlns="http://www.w3.org/2000/svg">
        <path d="M 70 0 A 35 35 0 0 1 0 0 L 0 38 A 35 35 0 0 0 70 38 Z" fill="{c1}" opacity="{op}"/>
        <circle cx="35" cy="73" r="27" fill="{c2}" opacity="{op}"/>
        <path d="M 8 100 A 27 27 0 0 0 62 100 A 27 27 0 0 0 8 100 Z" fill="{c3}" opacity="{op}"/>
    </svg>"""


# ─────────────────────────────────────────────────────────────
# CSS
# ─────────────────────────────────────────────────────────────

def get_css() -> str:
    return f"""
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* {{ margin: 0; padding: 0; box-sizing: border-box; }}

body {{
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    background: #fff;
}}

/* ── PAGE BASE ───────────────────────────────────────────── */
.page {{
    width: 210mm;
    min-height: 297mm;
    position: relative;
    overflow: hidden;
    page-break-after: always;
}}

/* ── DARK PAGES (navy) ─────────────────────────────────── */
.dark-page {{
    background: {NAVY};
    color: #FFFFFF;
    display: flex;
    flex-direction: column;
    height: 297mm;
    padding: 15mm 16mm;
}}

/* ── LIGHT PAGES (cream) ───────────────────────────────── */
.light-page {{
    background: {CREAM};
    color: {NAVY};
    min-height: 297mm;
    padding: 0 0 16mm 0;
}}

/* ── PAGE HEADER (light pages) ─────────────────────────── */
.page-header {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 16mm 8px;
    margin-bottom: 8mm;
    border-top: 3px solid {GREEN};
    background: {CREAM};
}}
.page-header-section {{
    font-size: 7pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: {NAVY};
    opacity: 0.55;
}}
.page-header-logo {{
    color: {NAVY};
    opacity: 0.4;
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: -0.3px;
    text-transform: lowercase;
}}

.page-body {{
    padding: 0 16mm;
}}

/* ── PAGE FOOTER (light pages) ─────────────────────────── */
.page-footer {{
    position: absolute;
    bottom: 8mm;
    left: 16mm;
    right: 16mm;
    display: flex;
    justify-content: space-between;
    font-size: 7pt;
    color: {NAVY};
    opacity: 0.3;
    border-top: 1px solid rgba(11,24,41,0.12);
    padding-top: 5px;
}}

/* ── COVER ─────────────────────────────────────────────── */
.cover-top {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 9mm;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 0;
    color: #fff;
}}
.cover-badge {{
    background: rgba(62,232,154,0.12);
    border: 1px solid rgba(62,232,154,0.28);
    color: {GREEN};
    font-size: 7pt;
    font-weight: 700;
    padding: 5px 13px;
    border-radius: 20px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
}}
.cover-hero {{
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding-bottom: 13mm;
}}
.cover-eyebrow {{
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: {GREEN};
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
}}
.cover-eyebrow::before {{
    content: '';
    display: inline-block;
    width: 28px;
    height: 2px;
    background: {GREEN};
    border-radius: 1px;
}}
.cover-title {{
    font-size: 31pt;
    font-weight: 900;
    line-height: 1.08;
    letter-spacing: -1px;
    margin-bottom: 14px;
    max-width: 165mm;
}}
.cover-title em {{
    font-style: normal;
    color: {GREEN};
}}
.cover-subtitle {{
    font-size: 11pt;
    font-weight: 400;
    color: rgba(255,255,255,0.58);
    line-height: 1.6;
    max-width: 148mm;
    margin-bottom: 22px;
}}
.cover-divider {{
    width: 38px;
    height: 3px;
    background: {GREEN};
    border-radius: 2px;
    margin-bottom: 20px;
}}
.cover-author {{
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    margin-bottom: 14px;
}}
.cover-avatar {{
    width: 36px;
    height: 36px;
    background: {GREEN};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 11pt;
    color: {NAVY};
    flex-shrink: 0;
}}
.cover-author-name {{ font-size: 10pt; font-weight: 700; color: #fff; }}
.cover-author-role {{ font-size: 8pt; color: rgba(255,255,255,0.48); margin-top: 1px; }}

.cover-footer-strip {{
    background: {GREEN};
    margin: 0 -16mm;
    padding: 10px 16mm;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
}}
.cover-footer-strip span {{
    font-size: 8.5pt;
    font-weight: 700;
    color: {NAVY};
}}

/* ── TOC ───────────────────────────────────────────────── */
.toc-dark {{
    background: {NAVY};
    padding: 14mm 16mm 12mm;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}}
.toc-dark-left {{ }}
.toc-dark-eyebrow {{
    font-size: 7.5pt;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: {GREEN};
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
}}
.toc-dark-eyebrow::before {{
    content: '';
    display: inline-block;
    width: 18px;
    height: 2px;
    background: {GREEN};
}}
.toc-dark-title {{
    font-size: 26pt;
    font-weight: 900;
    color: #fff;
    letter-spacing: -0.8px;
    line-height: 1;
}}
.toc-dark-logo {{ color: #fff; opacity: 0.35; }}

.toc-cream {{
    background: {CREAM};
    padding: 10mm 16mm 16mm;
}}
.toc-entries {{ display: flex; flex-direction: column; gap: 3px; }}
.toc-entry {{
    display: flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 7px;
    text-decoration: none;
    color: {NAVY};
    border: 1px solid transparent;
}}
.toc-entry:hover {{ background: rgba(11,24,41,0.04); border-color: rgba(11,24,41,0.08); }}
.toc-num {{
    width: 26px;
    height: 26px;
    background: {NAVY};
    color: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8.5pt;
    font-weight: 800;
    flex-shrink: 0;
    margin-right: 11px;
}}
.toc-entry.green-num .toc-num {{
    background: {GREEN};
    color: {NAVY};
}}
.toc-info {{ flex: 1; }}
.toc-section-title {{ font-size: 10pt; font-weight: 600; color: {NAVY}; line-height: 1.2; }}
.toc-section-desc {{ font-size: 8pt; color: rgba(11,24,41,0.45); margin-top: 1px; }}
.toc-arrow {{ color: rgba(11,24,41,0.2); font-size: 12pt; flex-shrink: 0; margin-left: 4px; }}

/* ── SECTION OPENERS (dark pages) ─────────────────────── */
.opener-eyebrow {{
    font-size: 8pt;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: {GREEN};
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
}}
.opener-eyebrow::before {{
    content: '';
    display: inline-block;
    width: 24px;
    height: 2px;
    background: {GREEN};
}}
.opener-chapter-num {{
    font-size: 100pt;
    font-weight: 900;
    color: {GREEN};
    line-height: 0.85;
    letter-spacing: -5px;
    margin-bottom: 8px;
    opacity: 0.18;
    position: absolute;
    top: 18mm;
    right: 16mm;
}}
.opener-title {{
    font-size: 26pt;
    font-weight: 900;
    color: #fff;
    line-height: 1.1;
    letter-spacing: -0.5px;
    margin-bottom: 10mm;
    max-width: 150mm;
}}
.opener-intro {{
    font-size: 11.5pt;
    color: rgba(255,255,255,0.6);
    line-height: 1.65;
    max-width: 145mm;
    margin-top: auto;
    padding-top: 10mm;
    border-top: 1px solid rgba(255,255,255,0.1);
}}

/* ── CONTENT TYPOGRAPHY ────────────────────────────────── */
.chapter-title-inline {{
    font-size: 18pt;
    font-weight: 800;
    color: {NAVY};
    line-height: 1.15;
    margin-bottom: 5mm;
    letter-spacing: -0.3px;
}}
.section-title {{
    font-size: 12.5pt;
    font-weight: 700;
    color: {NAVY};
    margin-top: 6mm;
    margin-bottom: 3mm;
    letter-spacing: -0.2px;
}}
.body-text {{
    font-size: 10pt;
    line-height: 1.75;
    color: rgba(11,24,41,0.82);
    margin-bottom: 4mm;
}}
.intro-quote {{
    font-size: 11pt;
    font-style: italic;
    color: {NAVY};
    border-left: 4px solid {GREEN};
    padding-left: 14px;
    margin-bottom: 6mm;
    line-height: 1.65;
}}

/* ── BULLET LIST (checkmark style) ─────────────────────── */
.check-list {{ list-style: none; margin: 3mm 0; }}
.check-list li {{
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 5px 0;
    font-size: 10pt;
    line-height: 1.6;
    color: rgba(11,24,41,0.82);
}}
.check-list li::before {{
    content: "✓";
    color: {GREEN};
    font-weight: 900;
    font-size: 10pt;
    flex-shrink: 0;
    margin-top: 1px;
    background: {NAVY};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8pt;
}}

.arrow-list {{ list-style: none; margin: 3mm 0; }}
.arrow-list li {{
    padding: 5px 0 5px 20px;
    position: relative;
    font-size: 10pt;
    line-height: 1.65;
    color: rgba(11,24,41,0.82);
}}
.arrow-list li::before {{
    content: "▸";
    position: absolute;
    left: 0;
    color: {GREEN};
    font-weight: 700;
}}

/* ── STAT BOX ───────────────────────────────────────────── */
.stat-box {{
    background: {NAVY};
    border-radius: 10px;
    padding: 16px 18px;
    margin: 5mm 0;
    page-break-inside: avoid;
    text-align: center;
}}
.stat-value {{
    font-size: 40pt;
    font-weight: 900;
    color: {GREEN};
    line-height: 1;
    letter-spacing: -2px;
    margin-bottom: 6px;
}}
.stat-label {{
    font-size: 10pt;
    color: rgba(255,255,255,0.8);
    margin-bottom: 6px;
    font-weight: 500;
}}
.stat-source {{
    font-size: 7.5pt;
    color: rgba(255,255,255,0.35);
    font-style: italic;
}}

/* Stat boxes inline (2 cols) */
.stat-row {{ display: flex; gap: 10px; margin: 5mm 0; }}
.stat-row .stat-box {{ flex: 1; }}

/* ── TIP BOX ────────────────────────────────────────────── */
.tip-box {{
    background: {NAVY};
    border-radius: 10px;
    padding: 14px 16px;
    margin: 5mm 0;
    page-break-inside: avoid;
}}
.tip-box-label {{
    font-size: 7.5pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: {GREEN};
    margin-bottom: 7px;
    display: flex;
    align-items: center;
    gap: 6px;
}}
.tip-box-label::before {{
    content: '';
    display: inline-block;
    width: 14px;
    height: 2px;
    background: {GREEN};
}}
.tip-box-content {{
    font-size: 10pt;
    color: rgba(255,255,255,0.85);
    line-height: 1.65;
}}

/* ── QUOTE BOX ──────────────────────────────────────────── */
.quote-box {{
    background: rgba(11,24,41,0.06);
    border: 1px solid rgba(11,24,41,0.1);
    border-radius: 10px;
    padding: 14px 18px;
    margin: 5mm 0;
    page-break-inside: avoid;
    font-size: 10.5pt;
    color: {NAVY};
    font-style: italic;
    line-height: 1.65;
    font-weight: 500;
}}

/* ── NUMBERED STEPS ─────────────────────────────────────── */
.step-list {{ margin: 4mm 0; }}
.step-item {{
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid rgba(11,24,41,0.08);
}}
.step-item:last-child {{ border-bottom: none; margin-bottom: 0; }}
.step-num {{
    font-size: 20pt;
    font-weight: 900;
    color: {GREEN};
    line-height: 1;
    flex-shrink: 0;
    min-width: 28px;
}}
.step-text {{
    font-size: 10pt;
    color: rgba(11,24,41,0.82);
    line-height: 1.65;
    padding-top: 2px;
}}

/* ── INSIGHT GRID (2 cols) ──────────────────────────────── */
.insight-grid {{
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin: 4mm 0;
}}
.insight-item {{
    flex: 1;
    min-width: 42%;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(11,24,41,0.04);
    border-radius: 8px;
    padding: 12px;
}}
.insight-icon {{
    width: 24px;
    height: 24px;
    background: {GREEN};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: {NAVY};
    font-size: 10pt;
    font-weight: 900;
    flex-shrink: 0;
}}
.insight-text {{
    font-size: 9.5pt;
    color: rgba(11,24,41,0.82);
    line-height: 1.55;
}}

/* ── CASE STUDY ─────────────────────────────────────────── */
.case-study {{
    background: rgba(11,24,41,0.04);
    border-radius: 10px;
    padding: 16px;
    margin: 5mm 0;
    page-break-inside: avoid;
}}
.case-header {{
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}}
.case-badge {{
    background: {NAVY};
    color: #fff;
    font-size: 7pt;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}}
.case-industry {{
    font-size: 8.5pt;
    color: rgba(11,24,41,0.45);
    font-weight: 500;
}}
.case-title {{
    font-size: 12pt;
    font-weight: 700;
    color: {NAVY};
    margin-bottom: 10px;
    letter-spacing: -0.2px;
}}
.case-row {{ display: flex; gap: 8px; }}
.case-block {{
    flex: 1;
    background: #fff;
    border-radius: 7px;
    padding: 10px 12px;
    border-top: 3px solid {GREEN};
}}
.case-block-label {{
    font-size: 7pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 5px;
    color: {NAVY};
    opacity: 0.5;
}}
.case-block-text {{ font-size: 9pt; color: rgba(11,24,41,0.82); line-height: 1.55; }}

/* ── CHECKLIST ──────────────────────────────────────────── */
.checklist-category {{
    font-size: 11pt;
    font-weight: 800;
    color: {NAVY};
    margin-top: 5mm;
    margin-bottom: 3mm;
    padding: 8px 10px;
    background: {NAVY};
    color: #fff;
    border-radius: 6px;
    letter-spacing: -0.2px;
}}
.checklist-item {{
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 7px 10px;
    border-radius: 6px;
    margin-bottom: 2px;
}}
.checklist-item:nth-child(even) {{ background: rgba(11,24,41,0.04); }}
.checkbox {{
    width: 18px;
    height: 18px;
    border: 2px solid rgba(11,24,41,0.2);
    border-radius: 4px;
    flex-shrink: 0;
    margin-top: 2px;
    background: #fff;
}}
.checklist-text {{ font-size: 10pt; color: rgba(11,24,41,0.82); line-height: 1.5; }}

/* ── RESOURCES ──────────────────────────────────────────── */
.resource-grid {{ display: flex; flex-wrap: wrap; gap: 9px; margin: 4mm 0; }}
.resource-card {{
    flex: 1;
    min-width: 45%;
    background: #fff;
    border-top: 4px solid {GREEN};
    border-radius: 0 0 8px 8px;
    padding: 12px 14px;
}}
.resource-type {{
    font-size: 7pt;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: {GREEN};
    margin-bottom: 5px;
}}
.resource-name {{ font-size: 10.5pt; font-weight: 700; color: {NAVY}; margin-bottom: 4px; }}
.resource-desc {{ font-size: 9pt; color: rgba(11,24,41,0.65); line-height: 1.5; }}

/* ── TAKEAWAYS ──────────────────────────────────────────── */
.takeaway-item {{
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(11,24,41,0.08);
}}
.takeaway-item:last-child {{ border-bottom: none; }}
.takeaway-check {{
    width: 22px;
    height: 22px;
    background: {GREEN};
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: {NAVY};
    font-size: 9pt;
    font-weight: 900;
    flex-shrink: 0;
    margin-top: 1px;
}}
.takeaway-text {{ font-size: 10.5pt; color: {NAVY}; line-height: 1.6; font-weight: 500; }}

/* ── CTA PAGE ───────────────────────────────────────────── */
.cta-eyebrow {{
    font-size: 8pt;
    font-weight: 800;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: {GREEN};
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
}}
.cta-eyebrow::before {{
    content: '';
    display: inline-block;
    width: 24px;
    height: 2px;
    background: {GREEN};
}}
.cta-title {{
    font-size: 28pt;
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -0.8px;
    margin-bottom: 16px;
}}
.cta-desc {{
    font-size: 11.5pt;
    color: rgba(255,255,255,0.62);
    max-width: 140mm;
    margin-bottom: 28px;
    line-height: 1.65;
}}
.cta-button {{
    display: inline-block;
    background: {GREEN};
    color: {NAVY};
    font-size: 11pt;
    font-weight: 800;
    padding: 13px 30px;
    border-radius: 50px;
    text-decoration: none;
    margin-bottom: 18px;
    letter-spacing: -0.2px;
}}
.cta-url {{ font-size: 9.5pt; color: rgba(255,255,255,0.35); margin-bottom: 28px; }}
.cta-pills {{ display: flex; gap: 8px; flex-wrap: wrap; }}
.cta-pill {{
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 20px;
    padding: 5px 13px;
    font-size: 8pt;
    color: rgba(255,255,255,0.7);
}}
"""


# ─────────────────────────────────────────────────────────────
# PAGE BUILDERS
# ─────────────────────────────────────────────────────────────

def render_cover(d: dict) -> str:
    initials = AUTHOR["initials"]
    logo = logo_svg(24)
    return f"""
<div class="page dark-page" id="portada" style="position:relative">
    {arc_tr(130)}
    <div class="cover-top">
        <div style="color:#fff">{logo}</div>
        <div class="cover-badge">Playbook Gratuito</div>
    </div>
    <div class="cover-hero">
        <div class="cover-eyebrow">Logística &amp; Ecommerce</div>
        <div class="cover-title">{d['title']}</div>
        <div class="cover-subtitle">{d['subtitle']}</div>
        <div class="cover-divider"></div>
        <div class="cover-author">
            <div class="cover-avatar">{initials}</div>
            <div>
                <div class="cover-author-name">{AUTHOR['name']}</div>
                <div class="cover-author-role">{AUTHOR['role']}</div>
            </div>
        </div>
    </div>
    <div class="cover-footer-strip">
        <span>{COMPANY['website']}</span>
        <span>{d.get('date', '')}</span>
    </div>
</div>"""


def render_toc(d: dict) -> str:
    entries = [
        ("intro",       "Introducción",             "Carta de Natalia Aldea"),
        ("contexto",    "El contexto del sector",   "Por qué importa este tema ahora"),
    ]
    for i, ch in enumerate(d.get("chapters", []), 1):
        desc = ch.get("intro", "")
        entries.append((f"capitulo-{i}", ch["title"], (desc[:65] + "…") if len(desc) > 65 else desc))
    entries += [
        ("casos",       "Casos prácticos",      "Escenarios reales del sector"),
        ("checklist",   "Checklist accionable", "Tu plan de implementación"),
        ("recursos",    "Recursos",             "Herramientas y referencias útiles"),
        ("conclusion",  "Conclusión",           "Próximos pasos con Dadybox"),
    ]

    items_html = ""
    for idx, (anchor, title, desc) in enumerate(entries, 1):
        green_class = " green-num" if idx % 3 == 0 else ""
        items_html += f"""
        <a class="toc-entry{green_class}" href="#{anchor}">
            <div class="toc-num">{idx:02d}</div>
            <div class="toc-info">
                <div class="toc-section-title">{title}</div>
                <div class="toc-section-desc">{desc}</div>
            </div>
            <div class="toc-arrow">›</div>
        </a>"""

    logo = logo_svg(20)
    return f"""
<div class="page" id="indice" style="background:{NAVY}">
    <div class="toc-dark" style="position:relative">
        {geo_shapes_tr(dark_page=True)}
        <div class="toc-dark-left">
            <div class="toc-dark-eyebrow">Contenidos</div>
            <div class="toc-dark-title">Índice</div>
        </div>
        <div class="toc-dark-logo">{logo}</div>
    </div>
    <div class="toc-cream">
        <div class="toc-entries">{items_html}</div>
    </div>
</div>"""


def render_intro(d: dict) -> str:
    intro = d.get("introduction", {})
    letter = intro.get("letter_content", "").replace("\n", "<br>")
    points = intro.get("key_points", [])
    points_html = "".join(f"<li>{p}</li>" for p in points)
    logo = logo_svg(14)

    return f"""
<div class="page light-page" id="intro">
    <div class="page-header">
        <span class="page-header-section">Introducción — Carta de la autora</span>
        <span class="page-header-logo">{logo}</span>
    </div>
    <div class="page-body">
        <div class="chapter-title-inline">Una carta de<br>{AUTHOR['name']}</div>
        <div class="intro-quote" style="margin-top:5mm">{letter[:480]}{"…" if len(letter.replace("<br>","")) > 450 else ""}</div>
        {"<div class='section-title' style='margin-top:5mm'>En este playbook encontrarás:</div><ul class='check-list'>" + points_html + "</ul>" if points else ""}
    </div>
    <div class="page-footer">
        <span>{COMPANY['website']}</span>
        <span>{AUTHOR['name']}</span>
    </div>
</div>"""


def render_context_opener(d: dict) -> str:
    ctx = d.get("context", {})
    return f"""
<div class="page dark-page" id="contexto" style="position:relative">
    {arc_tr(100)}
    {arc_bl(80)}
    <div class="opener-eyebrow">El contexto</div>
    <div class="opener-title">{ctx.get('title', 'El estado del sector')}</div>
    <div class="opener-intro">{ctx.get('intro', '')}</div>
</div>"""


def render_context_content(d: dict) -> str:
    ctx = d.get("context", {})
    stats = ctx.get("stats", [])
    logo = logo_svg(14)

    stats_html = ""
    if len(stats) >= 2:
        row = ""
        for s in stats[:2]:
            row += f"""<div class="stat-box" style="flex:1">
                <div class="stat-value">{s.get('value','')}</div>
                <div class="stat-label">{s.get('label','')}</div>
                <div class="stat-source">Fuente: {s.get('source','')}</div>
            </div>"""
        stats_html += f'<div class="stat-row">{row}</div>'
        for s in stats[2:]:
            stats_html += f"""<div class="stat-box">
                <div class="stat-value">{s.get('value','')}</div>
                <div class="stat-label">{s.get('label','')}</div>
                <div class="stat-source">Fuente: {s.get('source','')}</div>
            </div>"""
    else:
        for s in stats:
            stats_html += f"""<div class="stat-box">
                <div class="stat-value">{s.get('value','')}</div>
                <div class="stat-label">{s.get('label','')}</div>
                <div class="stat-source">Fuente: {s.get('source','')}</div>
            </div>"""

    return f"""
<div class="page light-page">
    <div class="page-header">
        <span class="page-header-section">El contexto del sector</span>
        <span class="page-header-logo">{logo}</span>
    </div>
    <div class="page-body">
        <div class="body-text">{ctx.get('content','')}</div>
        {stats_html}
    </div>
    <div class="page-footer">
        <span>{COMPANY['website']}</span>
        <span>dadybox</span>
    </div>
</div>"""


def render_chapter_opener(ch: dict, num: int) -> str:
    return f"""
<div class="page dark-page" id="capitulo-{num}" style="position:relative">
    {arc_tr(100)}
    {arc_bl(80)}
    <div class="opener-eyebrow">Capítulo {num:02d}</div>
    <div class="opener-title">{ch.get('title','')}</div>
    <div class="opener-intro">{ch.get('intro','')}</div>
</div>"""


def render_chapter_content(ch: dict, num: int) -> str:
    logo = logo_svg(14)
    sections_html = ""
    for sec in ch.get("sections", []):
        bullets = "".join(f"<li>{b}</li>" for b in sec.get("bullets", []))
        sections_html += f"""
        <div class="section-title">{sec.get('title','')}</div>
        <div class="body-text">{sec.get('content','')}</div>
        {"<ul class='arrow-list'>" + bullets + "</ul>" if bullets else ""}"""

    stat_html = ""
    s = ch.get("key_stat", {})
    if s and s.get("value"):
        stat_html = f"""<div class="stat-box">
            <div class="stat-value">{s['value']}</div>
            <div class="stat-label">{s.get('label','')}</div>
            <div class="stat-source">Fuente: {s.get('source','')}</div>
        </div>"""

    tip_html = ""
    if ch.get("tip_dadybox"):
        tip_html = f"""<div class="tip-box">
            <div class="tip-box-label">Tip Dadybox</div>
            <div class="tip-box-content">{ch['tip_dadybox']}</div>
        </div>"""

    return f"""
<div class="page light-page">
    <div class="page-header">
        <span class="page-header-section">Capítulo {num:02d} — {ch.get('title','')[:45]}</span>
        <span class="page-header-logo">{logo}</span>
    </div>
    <div class="page-body">
        {sections_html}
        {stat_html}
        {tip_html}
    </div>
    <div class="page-footer">
        <span>{COMPANY['website']}</span>
        <span>dadybox</span>
    </div>
</div>"""


def render_cases_opener() -> str:
    return f"""
<div class="page dark-page" id="casos" style="position:relative">
    {arc_tr(100)}
    <div class="opener-eyebrow">Casos prácticos</div>
    <div class="opener-title">Del mundo real al<br>tuyo</div>
    <div class="opener-intro">Escenarios reales del sector ecommerce para que veas cómo aplicar lo aprendido en situaciones concretas.</div>
</div>"""


def render_cases_content(d: dict) -> str:
    logo = logo_svg(14)
    cases_html = ""
    for case in d.get("case_studies", []):
        cases_html += f"""
        <div class="case-study">
            <div class="case-header">
                <span class="case-badge">Caso práctico</span>
                <span class="case-industry">{case.get('industry','')}</span>
            </div>
            <div class="case-title">{case.get('title', case.get('brand',''))}</div>
            <div class="case-row">
                <div class="case-block">
                    <div class="case-block-label">El reto</div>
                    <div class="case-block-text">{case.get('challenge','')}</div>
                </div>
                <div class="case-block">
                    <div class="case-block-label">La solución</div>
                    <div class="case-block-text">{case.get('solution','')}</div>
                </div>
                <div class="case-block">
                    <div class="case-block-label">El resultado</div>
                    <div class="case-block-text">{case.get('result','')}</div>
                </div>
            </div>
        </div>"""

    return f"""
<div class="page light-page">
    <div class="page-header">
        <span class="page-header-section">Casos prácticos</span>
        <span class="page-header-logo">{logo}</span>
    </div>
    <div class="page-body">{cases_html}</div>
    <div class="page-footer">
        <span>{COMPANY['website']}</span>
        <span>dadybox</span>
    </div>
</div>"""


def render_checklist_opener() -> str:
    return f"""
<div class="page dark-page" id="checklist" style="position:relative">
    {arc_tr(100)}
    {arc_bl(80)}
    <div class="opener-eyebrow">Checklist accionable</div>
    <div class="opener-title">Tu plan de<br>implementación</div>
    <div class="opener-intro">Usa esta lista de verificación para asegurarte de que estás aplicando todos los aprendizajes de este playbook.</div>
</div>"""


def render_checklist_content(d: dict) -> str:
    logo = logo_svg(14)
    cl = d.get("checklist", {})
    categories_html = ""
    for cat in cl.get("items", []):
        items_html = ""
        for task in cat.get("tasks", []):
            items_html += f"""
            <div class="checklist-item">
                <div class="checkbox"></div>
                <div class="checklist-text">{task}</div>
            </div>"""
        categories_html += f"""
        <div class="checklist-category">{cat.get('category','')}</div>
        {items_html}"""

    return f"""
<div class="page light-page">
    <div class="page-header">
        <span class="page-header-section">{cl.get('title','Checklist de implementación')}</span>
        <span class="page-header-logo">{logo}</span>
    </div>
    <div class="page-body">{categories_html}</div>
    <div class="page-footer">
        <span>{COMPANY['website']}</span>
        <span>dadybox</span>
    </div>
</div>"""


def render_resources(d: dict) -> str:
    logo = logo_svg(14)
    resources_html = ""
    for r in d.get("resources", []):
        resources_html += f"""
        <div class="resource-card">
            <div class="resource-type">{r.get('type','Recurso')}</div>
            <div class="resource-name">{r.get('name','')}</div>
            <div class="resource-desc">{r.get('description','')}</div>
        </div>"""

    return f"""
<div class="page light-page" id="recursos">
    <div class="page-header">
        <span class="page-header-section">Recursos recomendados</span>
        <span class="page-header-logo">{logo}</span>
    </div>
    <div class="page-body">
        <div class="chapter-title-inline">Herramientas y referencias</div>
        <div class="resource-grid" style="margin-top:5mm">{resources_html}</div>
    </div>
    <div class="page-footer">
        <span>{COMPANY['website']}</span>
        <span>dadybox</span>
    </div>
</div>"""


def render_conclusion(d: dict) -> str:
    logo = logo_svg(14)
    conc = d.get("conclusion", {})
    takeaways_html = ""
    for t in conc.get("takeaways", []):
        takeaways_html += f"""
        <div class="takeaway-item">
            <div class="takeaway-check">✓</div>
            <div class="takeaway-text">{t}</div>
        </div>"""

    return f"""
<div class="page light-page" id="conclusion">
    <div class="page-header">
        <span class="page-header-section">Conclusión — Próximos pasos</span>
        <span class="page-header-logo">{logo}</span>
    </div>
    <div class="page-body">
        <div class="chapter-title-inline">Lo que hemos aprendido</div>
        <div class="body-text" style="margin-top:4mm">{conc.get('text','')}</div>
        <div class="section-title" style="margin-top:6mm">Para llevar contigo</div>
        {takeaways_html}
    </div>
    <div class="page-footer">
        <span>{COMPANY['website']}</span>
        <span>dadybox</span>
    </div>
</div>"""


def render_cta(d: dict) -> str:
    cta = d.get("cta", {})
    pills_html = "".join(f'<div class="cta-pill">{s}</div>' for s in COMPANY["services"])
    return f"""
<div class="page dark-page" style="position:relative;justify-content:center">
    {arc_tr(110)}
    {arc_bl(90)}
    <div class="cta-eyebrow">Siguiente paso</div>
    <div class="cta-title">{cta.get('headline','¿Listo para escalar sin dramas logísticos?')}</div>
    <div class="cta-desc">{cta.get('description','')}</div>
    <a class="cta-button" href="{COMPANY['contact_url']}">{cta.get('button_text', COMPANY['cta_label'])}</a>
    <div class="cta-url">{COMPANY['website']}</div>
    <div class="cta-pills">{pills_html}</div>
</div>"""


def render_back_cover() -> str:
    services_html = "".join(
        f'<div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:6px 14px;font-size:8.5pt;color:rgba(255,255,255,0.75)">{s}</div>'
        for s in COMPANY["services"]
    )
    logo = logo_svg(32)
    return f"""
<div class="page dark-page" style="justify-content:center;align-items:center;text-align:center;position:relative">
    <div style="position:absolute;top:0;left:0;right:0;height:5px;background:{GREEN}"></div>
    {arc_tr(90)}
    <div style="color:#fff;margin-bottom:12px;font-size:28pt">{logo}</div>
    <div style="font-size:12pt;color:rgba(255,255,255,0.55);margin-bottom:22px">{COMPANY['tagline']}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:22px">{services_html}</div>
    <div style="width:40px;height:3px;background:{GREEN};border-radius:2px;margin:0 auto 18px"></div>
    <div style="font-size:14pt;font-weight:700;color:#fff;margin-bottom:5px">{COMPANY['website']}</div>
    <div style="font-size:9pt;color:rgba(255,255,255,0.38)">comercial@dadybox.com · +34 913 775 242</div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:5px;background:{GREEN}"></div>
</div>"""


# ─────────────────────────────────────────────────────────────
# MAIN HTML ASSEMBLER
# ─────────────────────────────────────────────────────────────

def build_html(data: dict) -> str:
    chapters_html = ""
    for i, ch in enumerate(data.get("chapters", []), 1):
        chapters_html += render_chapter_opener(ch, i)
        chapters_html += render_chapter_content(ch, i)

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{data['title']} | Dadybox</title>
    <style>{get_css()}</style>
</head>
<body>
    {render_cover(data)}
    {render_toc(data)}
    {render_intro(data)}
    {render_context_opener(data)}
    {render_context_content(data)}
    {chapters_html}
    {render_cases_opener()}
    {render_cases_content(data)}
    {render_checklist_opener()}
    {render_checklist_content(data)}
    {render_resources(data)}
    {render_conclusion(data)}
    {render_cta(data)}
    {render_back_cover()}
</body>
</html>"""


# ─────────────────────────────────────────────────────────────
# PDF GENERATOR
# ─────────────────────────────────────────────────────────────

def generate_pdf(data: dict, output_path: str) -> str:
    """Renders content dict to PDF via Playwright. Returns output path."""
    from playwright.sync_api import sync_playwright

    html = build_html(data)
    html_path = Path(output_path).with_suffix(".html")
    html_path.write_text(html, encoding="utf-8")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"file://{html_path.resolve()}", wait_until="networkidle")
        page.pdf(
            path=output_path,
            format="A4",
            print_background=True,
            margin={"top": "0mm", "right": "0mm", "bottom": "0mm", "left": "0mm"},
        )
        browser.close()

    return output_path
