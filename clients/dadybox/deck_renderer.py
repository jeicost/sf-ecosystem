"""
Dadybox Deck Renderer v2 — slides 16:9, diseño alineado con dossier oficial hellodadybox.com.
Mejoras v2: títulos verdes en slides blancos, cover con badge strip inferior, plans muy verde,
círculo verde decorativo, paneles con cubo + anillos, densidad mejorada, services split.
"""

from pathlib import Path
from brand import COLORS, COMPANY, STATS, TEAM

NAVY    = COLORS["primary"]      # #0B1829
GREEN   = COLORS["accent"]       # #3EE89A
GREEN_D = COLORS["accent_dark"]  # #1A9B60
GREEN_M = COLORS["accent_mid"]   # #2DC080
WHITE   = "#FFFFFF"

SLIDE_W = "338.7mm"
SLIDE_H = "190.5mm"


# ─────────────────────────────────────────────────────────────
# SVG / DECORATIVE ELEMENTS
# ─────────────────────────────────────────────────────────────

def logo_svg(size: int = 28, dark_bg: bool = True) -> str:
    text_color = WHITE if dark_bg else NAVY
    gap = int(size * 0.32)
    txt = int(size * 0.72)
    return (
        f'<span style="display:inline-flex;align-items:center;gap:{gap}px;line-height:1">'
        f'<svg width="{size}" height="{size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">'
        f'<polygon points="50,5 95,30 50,55 5,30" fill="{GREEN}"/>'
        f'<polygon points="5,30 50,55 50,97 5,72" fill="{GREEN_D}"/>'
        f'<polygon points="95,30 50,55 50,97 95,72" fill="{GREEN_M}"/>'
        f'</svg>'
        f'<span style="font-weight:800;letter-spacing:-0.5px;font-size:{txt}px;color:{text_color}">dadybox</span>'
        f'</span>'
    )


def cube_only_svg(size: int = 90, opacity: float = 0.7) -> str:
    """Solo el cubo SVG, sin texto."""
    return (
        f'<svg width="{size}" height="{size}" viewBox="0 0 100 100" '
        f'xmlns="http://www.w3.org/2000/svg" style="opacity:{opacity}">'
        f'<polygon points="50,5 95,30 50,55 5,30" fill="{GREEN}"/>'
        f'<polygon points="5,30 50,55 50,97 5,72" fill="{GREEN_D}"/>'
        f'<polygon points="95,30 50,55 50,97 95,72" fill="{GREEN_M}"/>'
        f'</svg>'
    )


def cube_pattern(opacity: float = 0.04) -> str:
    return (
        f'<svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none" '
        f'xmlns="http://www.w3.org/2000/svg" opacity="{opacity}">'
        f'<defs><pattern id="cg{int(opacity*1000)}" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">'
        f'<polygon points="30,2 58,17 30,32 2,17" fill="none" stroke="{GREEN}" stroke-width="1.2"/>'
        f'<polygon points="2,17 30,32 30,50 2,35" fill="none" stroke="{GREEN_D}" stroke-width="1.2"/>'
        f'<polygon points="58,17 30,32 30,50 58,35" fill="none" stroke="{GREEN_M}" stroke-width="1.2"/>'
        f'</pattern></defs>'
        f'<rect width="100%" height="100%" fill="url(#cg{int(opacity*1000)})"/>'
        f'</svg>'
    )


def green_circle_accent(size: int = 80) -> str:
    """Círculo verde decorativo parcial en esquina inferior derecha — igual que referencia oficial."""
    half = size // 2
    return (
        f'<div style="position:absolute;bottom:-{half}px;right:-{half}px;'
        f'width:{size}px;height:{size}px;border-radius:50%;'
        f'background:{GREEN};opacity:0.9;pointer-events:none;z-index:1"></div>'
    )


def panel_decoration() -> str:
    """Panel oscuro de slide split: cubo grande + anillos concéntricos."""
    ring = "rgba(62,232,154,0.12)"
    return (
        '<div style="position:absolute;inset:0;display:flex;align-items:center;'
        'justify-content:center;overflow:hidden">'
        f'<div style="position:absolute;width:200px;height:200px;border-radius:50%;border:1px solid {ring}"></div>'
        f'<div style="position:absolute;width:270px;height:270px;border-radius:50%;border:1px solid {ring}"></div>'
        f'<div style="position:absolute;width:340px;height:340px;border-radius:50%;border:1px solid {ring}"></div>'
        f'<div style="position:relative;z-index:2">{cube_only_svg(88, 0.75)}</div>'
        '</div>'
    )


def green_glow_overlay() -> str:
    """Halo verde — evoca el warehouse iluminado en verde de la referencia oficial."""
    return (
        '<div style="position:absolute;top:-15%;left:10%;width:80%;height:80%;'
        'background:radial-gradient(ellipse,rgba(62,232,154,0.16) 0%,rgba(62,232,154,0.04) 45%,transparent 68%);'
        'pointer-events:none;z-index:1"></div>'
        '<div style="position:absolute;bottom:5%;right:0%;width:50%;height:55%;'
        'background:radial-gradient(ellipse,rgba(62,232,154,0.10) 0%,transparent 62%);'
        'pointer-events:none;z-index:1"></div>'
    )


def green_stripe_top() -> str:
    return f'<div style="position:absolute;top:0;left:0;right:0;height:4px;background:{GREEN};z-index:5"></div>'


# ─────────────────────────────────────────────────────────────
# CSS
# ─────────────────────────────────────────────────────────────

def get_css() -> str:
    return f"""
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{
    font-family:'Inter','Helvetica Neue',Arial,sans-serif;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
    background:#fff; margin:0; padding:0;
}}

/* ── SLIDE BASE ─────────────────────────────────────────── */
.slide {{
    width:338.7mm; height:190.5mm;
    position:relative; overflow:hidden;
    page-break-after:always;
    display:flex; flex-direction:column;
}}
.slide-dark     {{ background:{NAVY}; color:{WHITE}; }}
.slide-light    {{ background:{WHITE}; color:{NAVY}; }}
.slide-gradient {{ background:linear-gradient(150deg,#081E12 0%,#0C2418 20%,#123C28 55%,#1A5832 100%); color:{WHITE}; }}
.slide-green    {{ background:linear-gradient(135deg,#1A5030 0%,#0F3A22 45%,#0B2218 100%); color:{WHITE}; }}

/* ── LOGO ────────────────────────────────────────────────── */
.logo-bar {{ position:absolute; top:16px; left:22px; z-index:10; }}

/* ── EYEBROW ─────────────────────────────────────────────── */
.eyebrow {{
    font-size:6.5pt; font-weight:700; letter-spacing:2.5px;
    text-transform:uppercase; color:{GREEN};
    margin-bottom:9px;
    display:flex; align-items:center; gap:7px;
}}
.eyebrow::before {{
    content:''; display:inline-block; width:16px; height:2px;
    background:{GREEN}; border-radius:1px; flex-shrink:0;
}}

/* ── TYPOGRAPHY ──────────────────────────────────────────── */
/* Título: VERDE en todos los contextos por defecto (override en dark) */
.slide-title {{
    font-size:23pt; font-weight:900;
    line-height:1.08; letter-spacing:-0.7px; margin-bottom:11px;
    color:{GREEN};
}}
.slide-title-white {{ color:{WHITE}; }}   /* override para fondos oscuros */

.slide-title-lg {{
    font-size:30pt; font-weight:900;
    line-height:1.05; letter-spacing:-1.2px; margin-bottom:14px; color:{WHITE};
}}
.slide-subtitle {{
    font-size:10.5pt; font-weight:700; line-height:1.4;
    margin-bottom:11px; color:{NAVY};
}}
.slide-subtitle-muted {{ font-weight:400; color:rgba(255,255,255,0.58); }}
.slide-body {{ font-size:9pt; line-height:1.65; color:rgba(11,24,41,0.70); margin-bottom:7px; }}

/* ── SPLIT LAYOUT ────────────────────────────────────────── */
.split-layout {{ display:flex; flex:1; height:100%; }}
.image-panel {{ position:relative; overflow:hidden; flex-shrink:0; }}
.panel-green  {{ background:linear-gradient(160deg,#051218 0%,#0B2218 50%,#1A4D2E 100%); }}
.panel-navy   {{ background:linear-gradient(160deg,#040E1A 0%,{NAVY} 55%,#0D2030 100%); }}
.panel-mid    {{ background:linear-gradient(160deg,#0B2218 0%,#0D3020 50%,{NAVY} 100%); }}

/* ── NUMBERED ITEM ───────────────────────────────────────── */
.num-item {{
    display:flex; align-items:flex-start; gap:11px;
    margin-bottom:12px; padding-bottom:12px;
    border-bottom:1px solid rgba(11,24,41,0.07);
}}
.num-item:last-child {{ border-bottom:none; margin-bottom:0; padding-bottom:0; }}
.num-circle {{
    width:32px; height:32px; min-width:32px;
    background:{GREEN}; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:10pt; font-weight:900; color:{NAVY};
}}
.num-circle-dark {{ background:rgba(62,232,154,0.15); color:{GREEN}; border:1px solid {GREEN}; }}
.num-title {{ font-size:10.5pt; font-weight:700; color:{NAVY}; margin-bottom:2px; line-height:1.2; }}
.num-desc  {{ font-size:8.5pt; line-height:1.55; color:rgba(11,24,41,0.62); }}

/* Numbered items on dark slide */
.on-dark .num-title {{ color:{WHITE}; }}
.on-dark .num-desc  {{ color:rgba(255,255,255,0.62); }}

/* ── STAT ITEM ───────────────────────────────────────────── */
.stat-value {{ font-size:44pt; font-weight:900; color:{GREEN}; line-height:1; letter-spacing:-2px; }}
.stat-label {{ font-size:9pt; color:rgba(255,255,255,0.58); line-height:1.4; margin-top:4px; }}

/* ── PLAN CARD ───────────────────────────────────────────── */
.plan-card {{
    flex:1; background:rgba(255,255,255,0.90); border-radius:14px;
    padding:16px 14px 12px; position:relative; display:flex; flex-direction:column;
}}
.plan-card-featured {{
    background:{WHITE}; box-shadow:0 6px 28px rgba(0,0,0,0.22);
}}
.plan-name {{ font-size:14pt; font-weight:900; color:{NAVY}; margin-bottom:3px; }}
.plan-volume {{
    font-size:7pt; background:rgba(62,232,154,0.18); color:{GREEN_D};
    border-radius:20px; padding:2px 9px; display:inline-block;
    margin-bottom:9px; font-weight:700;
}}
.plan-button {{
    display:block; background:{GREEN}; color:{NAVY};
    text-align:center; font-size:8pt; font-weight:800;
    padding:6px 10px; border-radius:30px; margin-bottom:9px;
}}
.plan-bullet {{
    display:flex; align-items:flex-start; gap:5px;
    font-size:7.5pt; line-height:1.5; color:rgba(11,24,41,0.75); margin-bottom:3px;
}}
.plan-bullet::before {{ content:"✓"; color:{GREEN_D}; font-weight:900; flex-shrink:0; }}
.plan-tagline {{
    font-size:7pt; color:rgba(11,24,41,0.42); font-style:italic;
    margin-top:auto; padding-top:7px; border-top:1px solid rgba(11,24,41,0.08);
}}
.plan-featured-badge {{
    position:absolute; top:-10px; left:50%; transform:translateX(-50%);
    background:{GREEN}; color:{NAVY}; font-size:6.5pt; font-weight:900;
    padding:3px 13px; border-radius:20px; white-space:nowrap;
}}

/* ── TEAM ────────────────────────────────────────────────── */
.team-card {{ display:flex; flex-direction:column; align-items:center; text-align:center; flex:1; }}
.team-avatar {{
    width:96px; height:96px; border-radius:50%;
    border:3px solid {GREEN};
    background:linear-gradient(145deg,{GREEN},{GREEN_D});
    display:flex; align-items:center; justify-content:center;
    font-size:22pt; font-weight:900; color:{WHITE};
    margin-bottom:12px; flex-shrink:0;
    box-shadow: 0 4px 20px rgba(62,232,154,0.25);
}}
.team-name {{ font-size:9.5pt; font-weight:700; color:{WHITE}; margin-bottom:3px; }}
.team-role {{ font-size:8pt; color:rgba(255,255,255,0.60); line-height:1.4; }}

/* ── COMPARISON TABLE ────────────────────────────────────── */
.comp-table {{ width:100%; border-collapse:collapse; margin-top:10px; }}
.comp-table th {{
    background:{NAVY}; color:{WHITE};
    padding:9px 13px; text-align:left; font-size:8.5pt; font-weight:700;
}}
.comp-table td {{
    padding:9px 13px; font-size:8.5pt;
    border-bottom:1px solid rgba(11,24,41,0.07); color:{NAVY};
}}
.comp-table tr:last-child td {{ border-bottom:none; }}
.comp-table tr:nth-child(even) td {{ background:rgba(11,24,41,0.025); }}

/* ── FLOW ────────────────────────────────────────────────── */
.flow-item {{ display:flex; flex-direction:column; align-items:center; text-align:center; flex:1; }}
.flow-icon {{
    width:70px; height:70px; background:{GREEN}; border-radius:16px;
    display:flex; align-items:center; justify-content:center;
    margin-bottom:14px; flex-shrink:0;
}}
.flow-arrow {{ font-size:18pt; color:{GREEN}; align-self:center; margin-top:-29px; flex-shrink:0; }}
.flow-title {{ font-size:10pt; font-weight:700; color:{GREEN}; margin-bottom:4px; }}
.flow-desc  {{ font-size:8.5pt; color:rgba(255,255,255,0.62); line-height:1.5; }}

/* ── SERVICE CARD ────────────────────────────────────────── */
.service-card {{
    background:{WHITE}; border-radius:10px; padding:14px 13px;
    box-shadow:0 2px 14px rgba(0,0,0,0.07);
    display:flex; flex-direction:column; border-top:4px solid {GREEN};
}}
.service-name    {{ font-size:14pt; font-weight:900; color:{GREEN}; margin-bottom:2px; }}
.service-time    {{ font-size:7pt; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:{NAVY}; opacity:0.45; margin-bottom:4px; }}
.service-tagline {{ font-size:8.5pt; font-style:italic; font-weight:600; color:{NAVY}; margin-bottom:9px; }}
.service-bullet  {{
    display:flex; align-items:flex-start; gap:5px;
    font-size:8pt; color:rgba(11,24,41,0.72); margin-bottom:4px; line-height:1.45;
}}
.service-bullet::before {{ content:"•"; color:{GREEN}; font-weight:900; flex-shrink:0; }}

/* ── CONTACT ─────────────────────────────────────────────── */
.contact-item {{
    display:flex; align-items:center; gap:13px;
    margin-bottom:15px; font-size:11pt; font-weight:600; color:{NAVY};
}}
.contact-icon {{
    width:40px; height:40px; background:{GREEN}; border-radius:50%;
    display:flex; align-items:center; justify-content:center; font-size:13pt; flex-shrink:0;
}}

/* ── CTA BUTTON ──────────────────────────────────────────── */
.cta-button {{
    display:inline-block; background:{GREEN}; color:{NAVY};
    font-size:11pt; font-weight:800; padding:13px 34px;
    border-radius:50px; text-decoration:none; letter-spacing:-0.2px;
}}
"""


# ─────────────────────────────────────────────────────────────
# SLIDE RENDERERS
# ─────────────────────────────────────────────────────────────

def render_cover(s: dict) -> str:
    badges = s.get("badges", [
        f'{STATS["experience_years"]} años de experiencia',
        "estructura propia",
        "partner oficial de la red GLS",
    ])
    badges_str = " · ".join(badges)

    return f"""
<div class="slide slide-gradient" style="position:relative">
    {cube_pattern(0.05)}
    {green_glow_overlay()}
    {green_circle_accent(90)}
    <div class="logo-bar">{logo_svg(24, dark_bg=True)}</div>

    <!-- Contenido central -->
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
                text-align:center;padding:44px 72px 16px;position:relative;z-index:2">
        <div style="margin-bottom:18px">{cube_only_svg(62, 0.95)}</div>
        <div class="slide-title-lg" style="max-width:290mm;margin-bottom:12px;font-size:32pt">
            {s.get("headline", COMPANY["headline"])}
        </div>
        <div style="font-size:10.5pt;color:rgba(255,255,255,0.52);max-width:230mm;line-height:1.6;font-weight:400">
            {s.get("subheadline", COMPANY["subheadline"])}
        </div>
    </div>

    <!-- Badge strip inferior — igual que referencia oficial -->
    <div style="background:{GREEN};padding:11px 32px;position:relative;z-index:3;flex-shrink:0">
        <p style="font-size:8.5pt;font-weight:700;color:{NAVY};text-align:center;letter-spacing:0.3px">
            {badges_str}
        </p>
    </div>
</div>"""


def render_tagline(s: dict) -> str:
    return f"""
<div class="slide slide-dark" style="position:relative">
    {cube_pattern(0.07)}
    {green_circle_accent(70)}
    <div class="logo-bar">{logo_svg(22, dark_bg=True)}</div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
                text-align:center;padding:40px 60px;position:relative;z-index:2">
        {"<div class='eyebrow' style='justify-content:center'>" + s["eyebrow"] + "</div>" if s.get("eyebrow") else ""}
        <div class="slide-title-lg" style="max-width:270mm">{s["title"]}</div>
        {"<div style='font-size:11pt;color:rgba(255,255,255,0.52);max-width:230mm;line-height:1.6;font-weight:400'>" + s["subtitle"] + "</div>" if s.get("subtitle") else ""}
    </div>
</div>"""


def render_split_content(s: dict) -> str:
    flip       = s.get("flip", False)
    panel_cls  = f"panel-{s.get('panel_color', 'green')}"
    panel_w    = s.get("panel_width", "38%")

    items_html = ""
    for i, item in enumerate(s.get("items", []), 1):
        if isinstance(item, str):
            items_html += (
                f'<div class="num-item">'
                f'<div class="num-circle">{i}</div>'
                f'<div class="num-desc" style="font-size:9.5pt;color:rgba(11,24,41,0.80)">{item}</div>'
                f'</div>'
            )
        else:
            items_html += (
                f'<div class="num-item">'
                f'<div class="num-circle">{i}</div>'
                f'<div>'
                f'<div class="num-title">{item.get("title","")}</div>'
                f'<div class="num-desc">{item.get("desc","")}</div>'
                f'</div></div>'
            )

    # Subtítulo: navy bold en blanco, no muted
    subtitle_html = (
        f'<div style="font-size:10pt;font-weight:700;color:{NAVY};margin-bottom:13px;line-height:1.4">'
        f'{s["subtitle"]}</div>'
    ) if s.get("subtitle") else ""

    body_html = (
        f'<div class="slide-body">{s["body"]}</div>'
    ) if s.get("body") else ""

    # Key metric bottom — rellena el espacio vacío en slides con pocos items
    key_metric_html = ""
    if s.get("key_metric"):
        key_metric_html = f"""
        <div style="margin-top:auto;padding-top:14px;border-top:1px solid rgba(11,24,41,0.07)">
            <span style="font-size:8.5pt;font-weight:700;color:{GREEN};letter-spacing:0.2px">{s["key_metric"]}</span>
        </div>"""

    content_side = f"""
    <div style="flex:1;display:flex;flex-direction:column;justify-content:flex-start;
                padding:44px 32px 28px 28px;position:relative;z-index:2">
        {"<div class='eyebrow'>" + s["eyebrow"] + "</div>" if s.get("eyebrow") else ""}
        <div class="slide-title">{s.get("title","")}</div>
        {subtitle_html}
        {body_html}
        {items_html}
        {key_metric_html}
    </div>"""

    panel_side = (
        f'<div class="image-panel {panel_cls}" style="width:{panel_w};flex-shrink:0;position:relative">'
        f'{panel_decoration()}'
        f'</div>'
    )

    left  = panel_side if not flip else content_side
    right = content_side if not flip else panel_side

    # Logo encima del panel (mismo lado oscuro)
    logo_side = "left:22px" if not flip else "right:22px"

    return f"""
<div class="slide slide-light" style="position:relative">
    {green_stripe_top()}
    {green_circle_accent(68)}
    <div class="logo-bar" style="top:16px;{logo_side}">{logo_svg(20, dark_bg=False)}</div>
    <div class="split-layout" style="height:100%">
        {left}
        {right}
    </div>
</div>"""


def render_numbered_items(s: dict) -> str:
    items  = s.get("items", [])
    cols   = min(len(items), 4)
    is_grad = s.get("gradient", True)
    bg_cls = "slide-gradient" if is_grad else "slide-dark"

    cols_html = ""
    for i, item in enumerate(items, 1):
        cols_html += f"""
        <div style="flex:1;padding:0 10px;border-right:1px solid rgba(255,255,255,0.06)">
            <div class="num-circle" style="margin-bottom:14px;width:38px;height:38px;font-size:11pt">{i}</div>
            <div style="font-size:10.5pt;font-weight:800;color:{WHITE};margin-bottom:7px;line-height:1.3">{item.get("title","")}</div>
            <div style="font-size:8.5pt;color:rgba(255,255,255,0.60);line-height:1.55">{item.get("desc","")}</div>
        </div>"""

    # Photo-placeholder row at bottom (4 rounded dark boxes — evoca las fotos de la referencia)
    placeholders = "".join(
        f'<div style="flex:1;height:88px;background:rgba(62,232,154,0.06);border-radius:10px;'
        f'border:1px solid rgba(62,232,154,0.12)"></div>'
        for _ in range(cols)
    )

    footer_html = f"""<div style="font-size:8pt;color:rgba(255,255,255,0.33);font-weight:600;letter-spacing:0.3px;padding-top:8px">{s["footer"]}</div>""" if s.get("footer") else '<div></div>'

    return f"""
<div class="slide {bg_cls}" style="position:relative">
    {cube_pattern(0.05)}
    {green_circle_accent(72)}
    <div class="logo-bar">{logo_svg(20, dark_bg=True)}</div>

    <div style="height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:34px 28px 18px;position:relative;z-index:2">
        <!-- Header -->
        <div>
            {"<div class='eyebrow'>" + s["eyebrow"] + "</div>" if s.get("eyebrow") else ""}
            <div class="slide-title slide-title-white" style="font-size:20pt;margin-bottom:4px">{s.get("title","")}</div>
            {"<div style='font-size:9pt;color:rgba(255,255,255,0.50);font-weight:400'>" + s["subtitle"] + "</div>" if s.get("subtitle") else ""}
        </div>
        <!-- Columns -->
        <div style="display:flex;gap:6px;align-items:flex-start">
            {cols_html}
        </div>
        <!-- Photo placeholder row + footer -->
        <div>
            <div style="display:flex;gap:10px;margin-bottom:8px">
                {placeholders}
            </div>
            {footer_html}
        </div>
    </div>
</div>"""


def render_stats_grid(s: dict) -> str:
    stats = s.get("stats", [
        {"value": STATS["clients"],          "label": "clientes activos"},
        {"value": STATS["shipments_year"],   "label": "envíos al año"},
        {"value": STATS["on_time_delivery"], "label": "de entregas a tiempo"},
        {"value": STATS["sla"],              "label": "de SLA"},
        {"value": STATS["carriers"],         "label": "transportistas"},
    ])

    stats_html = ""
    for st in stats:
        stats_html += f"""
        <div style="flex:1;padding:0 18px;border-right:1px solid rgba(255,255,255,0.08);text-align:center">
            <div class="stat-value">{st["value"]}</div>
            <div class="stat-label">{st["label"]}</div>
        </div>"""

    from brand import REFERENCES
    refs_pills = "".join(
        f'<span style="background:rgba(62,232,154,0.10);border:1px solid rgba(62,232,154,0.20);'
        f'color:rgba(255,255,255,0.55);font-size:7pt;font-weight:600;padding:4px 11px;'
        f'border-radius:20px;white-space:nowrap">{r}</span>'
        for r in REFERENCES[:5]
    )

    return f"""
<div class="slide slide-dark" style="position:relative;display:flex;flex-direction:column">
    {cube_pattern(0.06)}
    {green_circle_accent(75)}

    <!-- Header -->
    <div style="padding:28px 28px 0;position:relative;z-index:2;flex-shrink:0">
        <div style="margin-bottom:10px">{logo_svg(20, dark_bg=True)}</div>
        {"<div class='eyebrow'>" + s["eyebrow"] + "</div>" if s.get("eyebrow") else ""}
        <div class="slide-title slide-title-white" style="font-size:20pt;margin-bottom:4px">{s.get("title","Números que hablan")}</div>
        {"<div style='font-size:8.5pt;color:rgba(255,255,255,0.38);line-height:1.5;max-width:170mm'>" + s["subtitle"] + "</div>" if s.get("subtitle") else ""}
    </div>

    <!-- Stats centrados en espacio restante -->
    <div style="flex:1;display:flex;align-items:center;position:relative;z-index:2;padding:0 20px">
        <div style="display:flex;width:100%">
            {stats_html}
        </div>
    </div>

    <!-- Referencias — rellena el vacío inferior igual que referencia oficial -->
    <div style="padding:12px 28px 14px;border-top:1px solid rgba(255,255,255,0.07);
                position:relative;z-index:2;flex-shrink:0">
        <div style="font-size:7pt;color:rgba(255,255,255,0.30);margin-bottom:6px;font-weight:600;letter-spacing:0.5px">
            CLIENTES DE REFERENCIA
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
            {refs_pills}
        </div>
    </div>
</div>"""


def render_plans(s: dict) -> str:
    from brand import PLANS
    plans_data = s.get("plans", PLANS)

    cards_html = ""
    for plan in plans_data:
        bullets_html = "".join(
            f'<div class="plan-bullet">{b}</div>'
            for b in plan["bullets"][:5]
        )
        featured_badge = '<div class="plan-featured-badge">Más elegido</div>' if plan.get("featured") else ""
        card_cls = "plan-card plan-card-featured" if plan.get("featured") else "plan-card"
        margin = "margin:0 5px" if not plan.get("featured") else "margin:0 5px;margin-top:-6px;margin-bottom:-6px"
        cards_html += f"""
        <div class="{card_cls}" style="{margin};position:relative">
            {featured_badge}
            <div class="plan-volume">{plan["volume"]}</div>
            <div class="plan-name">{plan["name"]}</div>
            <a class="plan-button" href="{COMPANY["contact_url"]}">{COMPANY["cta_label"]}</a>
            {bullets_html}
            <div class="plan-tagline">{plan["tagline"]}</div>
        </div>"""

    return f"""
<div class="slide slide-green" style="position:relative">
    {cube_pattern(0.06)}
    {green_circle_accent(78)}
    <div class="logo-bar">{logo_svg(20, dark_bg=True)}</div>

    <div style="padding:42px 24px 20px;height:100%;display:flex;flex-direction:column;position:relative;z-index:2">
        <div class="slide-title slide-title-white" style="text-align:center;font-size:22pt;margin-bottom:5px">
            {s.get("title","Planes que crecen contigo")}
        </div>
        <div style="font-size:9.5pt;color:rgba(255,255,255,0.52);text-align:center;margin-bottom:18px;font-weight:400">
            {s.get("subtitle","Elige el volumen que mejor encaja con tu marca.")}
        </div>
        <div style="flex:1;display:flex;align-items:stretch">
            {cards_html}
        </div>
    </div>
</div>"""


def render_team(s: dict) -> str:
    members_data = s.get("members", TEAM)
    bios = [
        "Visión estratégica y liderazgo del grupo",
        "Comunicación, marca e innovación",
        "Plataforma tecnológica y back office",
        "Atención y experiencia del cliente",
    ]

    cards_html = "".join(f"""
    <div class="team-card">
        <div class="team-avatar">{m["initials"]}</div>
        <div class="team-name">{m["name"]}</div>
        <div class="team-role">{m["role"]}</div>
        <div style="font-size:7.5pt;color:rgba(255,255,255,0.45);margin-top:5px;line-height:1.35">{bios[i]}</div>
    </div>""" for i, m in enumerate(members_data))

    return f"""
<div class="slide slide-light" style="position:relative;display:flex;flex-direction:column">
    {green_stripe_top()}
    {green_circle_accent(65)}
    <div class="logo-bar">{logo_svg(20, dark_bg=False)}</div>

    <!-- Header blanco compacto -->
    <div style="text-align:center;padding:32px 36px 16px;flex-shrink:0">
        <div class='eyebrow' style='justify-content:center'>{s.get("eyebrow","Equipo")}</div>
        <div class="slide-title" style="font-size:21pt;margin-bottom:0">{s.get("title","Un equipo especializado")}</div>
    </div>

    <!-- Banda oscura con avatares — igual al fondo oscuro de la referencia para sección equipo -->
    <div style="flex:1;background:linear-gradient(160deg,#061810 0%,#0B2018 50%,#0F3020 100%);
                display:flex;align-items:center;justify-content:center;gap:20px;
                padding:20px 28px;position:relative;overflow:hidden">
        {cube_pattern(0.05)}
        {green_circle_accent(55)}
        <div style="display:flex;gap:20px;width:100%;justify-content:center;position:relative;z-index:2">
            {cards_html}
        </div>
    </div>
</div>"""


def render_comparison_table(s: dict) -> str:
    from brand import SHIPPING_SERVICES
    services_data = s.get("services", SHIPPING_SERVICES)

    rows_html = "".join(f"""
    <tr>
        <td style="font-weight:700">{svc["name"]}</td>
        <td>{svc["time"]}</td>
        <td>{"Alto" if svc["name"]=="Premium" else ("Medio" if svc["name"]=="24H" else "Bajo")}</td>
        <td>{svc["tagline"].split(".")[0]}</td>
        <td>{svc.get("experience","")}</td>
    </tr>""" for svc in services_data)

    return f"""
<div class="slide slide-light" style="position:relative">
    {green_stripe_top()}
    {green_circle_accent(65)}
    <div class="logo-bar">{logo_svg(20, dark_bg=False)}</div>

    <div style="padding:44px 32px 22px">
        {"<div class='eyebrow'>" + s.get("eyebrow","Servicios") + "</div>" if s.get("eyebrow") else ""}
        <div class="slide-title" style="font-size:21pt;margin-bottom:4px">{s.get("title","Compara nuestros servicios de envío")}</div>
        {"<div style='font-size:9.5pt;color:rgba(11,24,41,0.52);margin-bottom:12px'>" + s["subtitle"] + "</div>" if s.get("subtitle") else ""}
        <table class="comp-table">
            <thead>
                <tr>
                    <th>Servicio</th><th>Tiempo de entrega</th>
                    <th>Coste relativo</th><th>Ideal para</th><th>Experiencia</th>
                </tr>
            </thead>
            <tbody>{rows_html}</tbody>
        </table>
        {"<div style='margin-top:14px;font-size:8pt;color:rgba(11,24,41,0.38);font-style:italic'>" + s["footer"] + "</div>" if s.get("footer") else ""}
    </div>
</div>"""


def render_flow(s: dict) -> str:
    from brand import PROCESS_STEPS

    # SVG icons propios — stroke blanco sobre fondo verde
    S = WHITE
    svg_icons = [
        f'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="{S}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
        f'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="{S}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        f'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="{S}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
        f'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="{S}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    ]

    steps_data = s.get("steps", PROCESS_STEPS)
    icons = svg_icons[:len(steps_data)]

    flow_html = ""
    for i, (step, icon) in enumerate(zip(steps_data, icons)):
        flow_html += f"""
        <div class="flow-item" style="flex:1;padding:0 8px">
            <div class="flow-icon">{icon}</div>
            <div class="flow-title">{step["title"]}</div>
            <div class="flow-desc">{step["desc"]}</div>
        </div>"""
        if i < len(steps_data) - 1:
            flow_html += f'<div style="font-size:20pt;color:rgba(255,255,255,0.4);align-self:center;margin-top:-32px;flex-shrink:0;padding:0 4px">→</div>'

    return f"""
<div class="slide slide-light" style="position:relative;display:flex;flex-direction:column">
    {green_stripe_top()}
    <div class="logo-bar">{logo_svg(20, dark_bg=False)}</div>

    <!-- Zona blanca: logo + header -->
    <div style="padding:34px 32px 18px;flex-shrink:0">
        {"<div class='eyebrow'>" + s["eyebrow"] + "</div>" if s.get("eyebrow") else ""}
        <div class="slide-title" style="font-size:22pt;margin-bottom:4px">{s.get("title","Un sistema que conecta toda tu operación")}</div>
        {"<div style='font-size:9pt;color:rgba(11,24,41,0.50);font-weight:400'>" + s["subtitle"] + "</div>" if s.get("subtitle") else ""}
    </div>

    <!-- Zona oscura: flow icons (igual que la referencia hellodadybox.com slide 11) -->
    <div style="flex:1;background:linear-gradient(160deg,#061810 0%,#0B2018 50%,#0F3020 100%);
                display:flex;align-items:center;padding:18px 28px 14px;position:relative;overflow:hidden">
        {cube_pattern(0.06)}
        {green_circle_accent(60)}
        <div style="display:flex;width:100%;position:relative;z-index:2">
            {flow_html}
        </div>
    </div>

    <!-- Footer strip -->
    {"<div style='background:#040E12;padding:8px 32px;flex-shrink:0'><p style='font-size:7.5pt;color:rgba(255,255,255,0.32);text-align:center;font-weight:600'>" + s["footer"] + "</p></div>" if s.get("footer") else ""}
</div>"""


def render_services_tier(s: dict) -> str:
    """Split: panel visual izquierdo + 3 service cards derecha."""
    from brand import SHIPPING_SERVICES
    services_data = s.get("services", SHIPPING_SERVICES)

    cards_html = "".join(f"""
    <div class="service-card" style="margin-bottom:10px">
        <div class="service-name">{svc["name"]}</div>
        <div class="service-time">{svc["time"]}</div>
        <div class="service-tagline">{svc["tagline"]}</div>
        {"".join(f'<div class="service-bullet">{b}</div>' for b in svc["bullets"])}
    </div>""" for svc in services_data)

    return f"""
<div class="slide slide-light" style="position:relative">
    {green_stripe_top()}
    {green_circle_accent(65)}
    <div class="logo-bar">{logo_svg(20, dark_bg=False)}</div>

    <div class="split-layout" style="height:100%">
        <!-- Panel izquierdo oscuro con decoración -->
        <div class="image-panel panel-green" style="width:34%;flex-shrink:0;position:relative">
            {panel_decoration()}
            <!-- Badge de red -->
            <div style="position:absolute;bottom:18px;left:0;right:0;text-align:center;z-index:3">
                <span style="background:rgba(62,232,154,0.15);border:1px solid rgba(62,232,154,0.3);
                    color:{GREEN};font-size:7pt;font-weight:700;padding:4px 12px;border-radius:20px;
                    letter-spacing:1px">RED GLS · +12.000 PARCEL SHOPS</span>
            </div>
        </div>

        <!-- Service cards derecha -->
        <div style="flex:1;display:flex;flex-direction:column;justify-content:center;
                    padding:36px 28px 28px 28px">
            {"<div class='eyebrow'>" + s["eyebrow"] + "</div>" if s.get("eyebrow") else ""}
            <div class="slide-title" style="font-size:19pt;margin-bottom:4px">{s.get("title","Nuestros servicios de envío")}</div>
            {"<div style='font-size:8.5pt;color:rgba(11,24,41,0.50);margin-bottom:14px'>" + s["subtitle"] + "</div>" if s.get("subtitle") else "<div style='margin-bottom:14px'></div>"}
            {cards_html}
            {"<div style='font-size:7.5pt;color:rgba(11,24,41,0.35);font-style:italic;margin-top:6px'>" + s["footer"] + "</div>" if s.get("footer") else ""}
        </div>
    </div>
</div>"""


def render_contact(s: dict) -> str:
    return f"""
<div class="slide slide-light" style="position:relative">
    {green_stripe_top()}
    {green_circle_accent(65)}
    <div class="split-layout" style="height:100%">
        <!-- Panel oscuro izquierdo -->
        <div class="image-panel panel-navy" style="width:36%;flex-shrink:0;position:relative">
            {panel_decoration()}
            <div style="position:absolute;bottom:24px;left:0;right:0;text-align:center;z-index:3">
                <div style="font-size:9pt;color:rgba(255,255,255,0.40)">{COMPANY["tagline"]}</div>
            </div>
        </div>

        <!-- Datos de contacto — space-between: título arriba, items centro, CTA abajo -->
        <div style="flex:1;padding:38px 36px 28px;display:flex;flex-direction:column;justify-content:space-between">
            <div>
                <div class="slide-title" style="font-size:22pt;margin-bottom:22px">
                    {s.get("title","Contactos")}
                </div>
                <div class="contact-item"><div class="contact-icon">📞</div><div>{COMPANY["phone"]}</div></div>
                <div class="contact-item"><div class="contact-icon">🌐</div><div style="font-weight:700">{COMPANY["website"]}</div></div>
                <div class="contact-item"><div class="contact-icon">✉️</div><div>{COMPANY["email"]}</div></div>
                <div class="contact-item" style="margin-bottom:0"><div class="contact-icon">📍</div><div>{COMPANY["address"]}</div></div>
            </div>
            <!-- CTA inferior — ocupa el espacio vacío con llamada a la acción -->
            <div style="border-top:1px solid rgba(11,24,41,0.08);padding-top:16px">
                <div style="font-size:9pt;color:rgba(11,24,41,0.45);margin-bottom:8px">¿Listo para empezar?</div>
                <a style="display:inline-block;background:{GREEN};color:{NAVY};font-size:9pt;
                    font-weight:800;padding:9px 22px;border-radius:30px;text-decoration:none">
                    {COMPANY["cta_label"]}
                </a>
                <span style="font-size:8pt;color:rgba(11,24,41,0.35);margin-left:12px">{COMPANY["contact_url"].replace("https://","")}</span>
            </div>
        </div>
    </div>
</div>"""


def render_cta(s: dict) -> str:
    return f"""
<div class="slide slide-gradient" style="position:relative">
    {cube_pattern(0.06)}
    {green_circle_accent(90)}

    <div style="position:absolute;top:0;left:0;right:0;height:4px;background:{GREEN};z-index:5"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:{GREEN};z-index:5"></div>

    <div class="logo-bar">{logo_svg(22, dark_bg=True)}</div>

    <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
                text-align:center;padding:40px 72px;position:relative;z-index:2">
        <div style="margin-bottom:16px">{cube_only_svg(48, 0.85)}</div>
        <div class="slide-title-lg" style="font-size:28pt;max-width:270mm;margin-bottom:12px">
            {s.get("headline","Tu logística puede dejar de ser un límite")}
        </div>
        <div style="font-size:10.5pt;color:rgba(255,255,255,0.55);max-width:230mm;line-height:1.65;margin-bottom:4px">
            {s.get("desc","Estamos listos para hablar de tu proyecto y diseñar juntos la solución logística que tu e-commerce necesita para crecer.")}
        </div>
        <a class="cta-button" href="{COMPANY['contact_url']}">{s.get("button", COMPANY["cta_label"])}</a>
        <div style="font-size:8.5pt;color:rgba(255,255,255,0.28);margin-top:4px">{COMPANY["website"]}</div>
        {"<div style='margin-top:14px;font-size:8.5pt;color:rgba(255,255,255,0.42)'>" + s["sign"] + "</div>" if s.get("sign") else ""}
    </div>
</div>"""


# ─────────────────────────────────────────────────────────────
# DISPATCH
# ─────────────────────────────────────────────────────────────

SLIDE_RENDERERS = {
    "cover":            render_cover,
    "tagline":          render_tagline,
    "split_content":    render_split_content,
    "numbered_items":   render_numbered_items,
    "stats_grid":       render_stats_grid,
    "plans":            render_plans,
    "team":             render_team,
    "comparison_table": render_comparison_table,
    "flow":             render_flow,
    "contact":          render_contact,
    "cta":              render_cta,
    "services_tier":    render_services_tier,
}


def render_slide(slide: dict) -> str:
    renderer = SLIDE_RENDERERS.get(slide.get("type", "tagline"), render_tagline)
    return renderer(slide)


# ─────────────────────────────────────────────────────────────
# HTML ASSEMBLER
# ─────────────────────────────────────────────────────────────

def build_html(data: dict) -> str:
    slides_html = "\n".join(render_slide(s) for s in data.get("slides", []))
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{data.get("title","Dadybox")} | Dadybox</title>
    <style>{get_css()}</style>
</head>
<body>
{slides_html}
</body>
</html>"""


# ─────────────────────────────────────────────────────────────
# PDF GENERATOR
# ─────────────────────────────────────────────────────────────

def generate_pdf(data: dict, output_path: str) -> str:
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
            width=SLIDE_W,
            height=SLIDE_H,
            print_background=True,
            margin={"top": "0mm", "right": "0mm", "bottom": "0mm", "left": "0mm"},
        )
        browser.close()

    return output_path
