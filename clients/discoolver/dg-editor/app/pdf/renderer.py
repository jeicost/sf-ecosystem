"""
Discoolver Guide PDF Renderer — v7
Calidad editorial fiel a la Revista Discoolver Madrid 2021.

Mejoras sobre v6:
  - Logo ◑ real (PNG RGBA) en lugar de polígonos dibujados
  - Logo wordmark PNG en portada (no texto)
  - Version blanca del isotipo para fondo magenta (preparada con Pillow)
  - Auto-page-break desactivado en cover/TOC (elimina página extra fantasma)
  - PARA 2◑21 con get_x() para spacing correcto
  - Running header correctamente suprimido en páginas 1-2
"""
from __future__ import annotations
from __future__ import annotations
import tempfile
from pathlib import Path
from fpdf import FPDF, XPos, YPos
from PIL import Image

from app.config import settings
from app.models.guide import Guide, Section, Recomendado

# ── Rutas ──────────────────────────────────────────────────────────────────────
FONTS = settings.static_dir / "fonts"
IMGS  = settings.static_dir / "images"

# ── Mapa de imágenes por categoría ────────────────────────────────────────────
CAT_IMGS: dict[str, list[str]] = {
    "restaurant": ["restaurant-1.jpg","restaurant-2.jpg","restaurant-3.jpg",
                   "restaurant-4.jpg","restaurant-5.jpg","restaurant-6.jpg"],
    "bar":        ["bar-1.jpg","bar-2.jpg"],
    "hotel":      ["hotel-1.jpg","restaurant-2.jpg"],
    "activity":   ["activity-1.jpg","activity-2.jpg"],
    "shop":       ["section-opener.jpg","activity-2.jpg"],
    "transport":  ["activity-1.jpg"],
    "tip":        ["restaurant-3.jpg"],
}
SEC_IMGS = ["restaurant-1.jpg","restaurant-3.jpg","activity-1.jpg",
            "cover-bg.jpg","section-opener.jpg","bar-1.jpg"]

CAT_LABELS = {
    "restaurant":"Restaurante","hotel":"Hotel","activity":"Actividad",
    "bar":"Bar","shop":"Tienda","transport":"Transporte","tip":"Consejo",
}

# ── Dimensiones A4 ─────────────────────────────────────────────────────────────
PW, PH   = 210, 297
ML, MR   = 16, 16
MT, MB   = 18, 22
CW       = PW - ML - MR          # 178 mm
GAP3     = 3
COL3     = (CW - 2 * GAP3) / 3   # ≈57.3 mm


def _build_white_icon(size_px: int = 120) -> str:
    """Crea una versión blanca del isotipo magenta para usar sobre fondo oscuro.
    Devuelve la ruta al archivo temporal PNG."""
    src = IMGS / "logo-isotipo.png"
    if not src.exists():
        return ""
    img = Image.open(str(src)).convert("RGBA").resize((size_px, size_px), Image.LANCZOS)
    r, g, b, a = img.split()
    white = Image.new("L", img.size, 255)
    white_img = Image.merge("RGBA", (white, white, white, a))
    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    white_img.save(tmp.name)
    return tmp.name


# ══════════════════════════════════════════════════════════════════════════════
class GuidesPDF(FPDF):

    def __init__(self, guide: Guide):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.guide = guide
        self.set_auto_page_break(True, margin=MB)
        self.set_margins(ML, MT, MR)
        self.P = guide.assets.color_palette
        self._img_counters: dict[str, int] = {}
        self._white_icon = _build_white_icon()   # PNG temporal blanco para portada
        self._load_fonts()

    def _load_fonts(self):
        self.add_font("B", "",  str(FONTS / "BebasNeue-Regular.otf"))
        self.add_font("Z", "",  str(FONTS / "Zooja.ttf"))
        self.add_font("A", "",  str(FONTS / "Arial-Regular.ttf"))
        self.add_font("A", "B", str(FONTS / "Arial-Bold.ttf"))
        self.add_font("A", "I", str(FONTS / "Arial-Italic.ttf"))

    # ── Colores ────────────────────────────────────────────────────────────
    def _rgb(self, h: str):
        h = h.lstrip("#")
        return int(h[0:2],16), int(h[2:4],16), int(h[4:6],16)
    def fc(self, h): self.set_fill_color(*self._rgb(h))
    def tc(self, h): self.set_text_color(*self._rgb(h))
    def dc(self, h): self.set_draw_color(*self._rgb(h))

    # ── Inserción segura de imagen ─────────────────────────────────────────
    def _img(self, path, x, y, w, h):
        p = Path(path)
        if p.exists():
            try:
                self.image(str(p), x=x, y=y, w=w, h=h)
                return
            except Exception:
                pass
        self.set_fill_color(210, 207, 203)
        self.rect(x, y, w, h, "F")

    # ── Logo ◑ con PNG real ────────────────────────────────────────────────
    def _logo(self, x: float, y: float, size: float, white: bool = False):
        """Inserta el isotipo ◑ como imagen PNG real."""
        if white and self._white_icon:
            src = self._white_icon
        else:
            src = str(IMGS / "logo-isotipo.png")
        p = Path(src)
        if p.exists():
            try:
                self.image(src, x=x, y=y, w=size, h=size)
                return
            except Exception:
                pass
        # Fallback mínimo si la imagen falla
        self.fc(self.P.primary if not white else "#ffffff")
        self.ellipse(x, y, size, size, "F")

    def _cat_img(self, cat: str) -> Path:
        imgs = CAT_IMGS.get(cat, CAT_IMGS["restaurant"])
        idx  = self._img_counters.get(cat, 0)
        self._img_counters[cat] = (idx + 1) % len(imgs)
        return IMGS / imgs[idx % len(imgs)]

    def _sec_img(self, n: int) -> Path:
        return IMGS / SEC_IMGS[(n - 1) % len(SEC_IMGS)]

    # ── Running header (páginas de sección, ≥3) ────────────────────────────
    def header(self):
        if self.page_no() <= 2:
            return
        self.tc(self.P.primary)
        self.set_font("A", "B", 7)
        self.set_xy(ML, MT - 9)
        self.cell(CW / 2, 4, self.guide.metadata.title.upper())
        self.set_xy(ML + CW / 2, MT - 9)
        self.set_font("A", "", 7)
        self.cell(CW / 2, 4, "discoolver guide", align="R")
        self.dc(self.P.primary); self.set_line_width(0.25)
        self.line(ML, MT - 4, PW - MR, MT - 4)

    def footer(self):
        if self.page_no() <= 2:
            return
        self.set_y(-14)
        self.tc(self.P.primary)
        self.set_font("A", "B", 9)
        self.cell(CW, 5, str(self.page_no() - 2), align="R")

    # ══════════════════════════════════════════════════════════════════════
    # PORTADA — fondo magenta, wordmark PNG, Bebas Neue gigante
    # ══════════════════════════════════════════════════════════════════════
    def cover_page(self):
        self.set_auto_page_break(False)   # evitar página extra fantasma
        self.add_page()

        # Fondo magenta completo
        self.fc(self.P.primary)
        self.rect(0, 0, PW, PH, "F")

        # Strip oscuro izquierdo
        self.set_fill_color(140, 0, 75)
        self.rect(0, 0, 3, PH, "F")

        # Zona oscura inferior para el texto de edición
        self.set_fill_color(130, 0, 68)
        self.rect(0, PH - 58, PW, 58, "F")

        # ── Wordmark PNG "◑ discoolver" (blanco sobre magenta) ────────
        wm = IMGS / "logo-wordmark.png"
        if wm.exists():
            try:
                # Convertir a blanco con Pillow on-the-fly
                img = Image.open(str(wm)).convert("RGBA")
                r2, g2, b2, a2 = img.split()
                white = Image.new("L", img.size, 255)
                white_wm = Image.merge("RGBA", (white, white, white, a2))
                tmp_wm = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
                white_wm.save(tmp_wm.name)
                # Dimensiones: wordmark es 180×120px → 90mm ancho → 60mm alto
                self.image(tmp_wm.name, x=8, y=10, w=68)
            except Exception:
                self.set_text_color(255,255,255)
                self.set_font("Z","",46)
                self.set_xy(8,10); self.cell(0,18,"discoolver")

        # ── "Descubre los lugares + cool de la ciudad" ────────────────
        self.set_text_color(255, 200, 228)
        self.set_font("A","",8.5)
        self.set_xy(8, 30)
        self.cell(0, 5, "Descubre los lugares + cool de la ciudad")

        # Separador fino blanco
        self.set_draw_color(255, 255, 255)
        self.set_line_width(0.3)
        self.line(8, 38, PW - 8, 38)

        # ── Tipo de guía ───────────────────────────────────────────────
        self.set_text_color(255, 210, 235)
        self.set_font("B","",20)
        self.set_xy(8, 42)
        guide_type = self.guide.metadata.type.value.upper()
        self.cell(0, 9, f"+ {guide_type}")

        # ── Destino GIGANTE (Bebas Neue) ───────────────────────────────
        dest_up = self.guide.metadata.destination.upper()
        self.set_text_color(255, 255, 255)
        font_size = 80
        self.set_font("B","",font_size)
        if self.get_string_width(dest_up) > CW + 10:
            font_size = 58
            self.set_font("B","",font_size)
        self.set_xy(8, 51)
        self.cell(PW - 16, font_size * 0.38, dest_up)

        # ── Tagline italic ─────────────────────────────────────────────
        self.set_text_color(255, 200, 228)
        self.set_font("A","I",12)
        ty = 51 + font_size * 0.38 + 2
        self.set_xy(8, ty)
        self.cell(0, 6, "que cualquier local de la ciudad")

        # ── Zona inferior: "Guía discoolver / 2◑21 / DESTINO" ─────────
        # "Guía discoolver"
        self.set_text_color(255, 190, 225)
        self.set_font("A","B",8)
        self.set_xy(8, PH - 55)
        self.cell(0, 5, "Guía discoolver")

        # "2◑21" con isotipo blanco inline
        self.set_text_color(255, 255, 255)
        self.set_font("B","",44)
        self.set_xy(8, PH - 50)
        self.cell(self.get_string_width("2")+1, 16, "2")
        ix = self.get_x()
        self._logo(ix, PH - 49, 12, white=True)
        self.set_xy(ix + 14, PH - 50)
        self.cell(0, 16, "21")

        # Destino abajo en blanco
        self.set_font("B","",34)
        self.set_xy(8, PH - 30)
        self.cell(0, 12, dest_up)

        # URL derecha
        self.set_text_color(255, 180, 220)
        self.set_font("A","",7)
        self.set_xy(PW - 75, PH - 10)
        self.cell(63, 5, "discoolver.com", align="R")

        self.set_auto_page_break(True, margin=MB)

    # ══════════════════════════════════════════════════════════════════════
    # ÍNDICE
    # ══════════════════════════════════════════════════════════════════════
    def toc_page(self, sections: list[Section], section_links: list | None = None):
        self.set_auto_page_break(False)
        self.add_page()

        # "◑ | ÍNDICE"
        self._logo(ML, 1.5, 8)
        self.dc("#aaaaaa"); self.set_line_width(0.4)
        self.line(ML + 10, 3, ML + 10, 12)
        self.set_font("B","",30)
        self.tc(self.P.secondary)
        self.set_xy(ML + 13, 0)
        self.cell(0, 14, "ÍNDICE")

        # Regla magenta
        self.dc(self.P.primary); self.set_line_width(0.6)
        self.line(ML, 16, PW - MR, 16)
        self.set_y(20)

        # Grid 4 columnas
        col_w   = CW / 4
        per_col = max(1, -(-len(sections) // 4))
        start_y = self.get_y()

        for i, s in enumerate(sections):
            c = i // per_col
            r = i % per_col
            x = ML + c * col_w
            y = start_y + r * 14

            lnk = section_links[i] if section_links and i < len(section_links) else None

            self.tc(self.P.primary)
            self.set_font("A","B",8)
            self.set_xy(x, y)
            self.cell(col_w - 2, 5, f"P. {i + 3}", link=lnk or "")

            self.tc(self.P.secondary)
            self.set_font("A","",9)
            self.set_xy(x, y + 5)
            self.cell(col_w - 2, 4.5, s.name, link=lnk or "")

        self.set_y(start_y + per_col * 14 + 8)

        # Foto ciudad + destino gigante superpuesto
        photo_y   = self.get_y() + 2
        avail_h   = PH - MT - photo_y - 4    # sin margin inferior
        if avail_h > 32:
            self._img(IMGS / "activity-1.jpg", ML, photo_y, CW, avail_h)
            # Overlay oscuro en la mitad inferior
            ov_h = min(24, avail_h * 0.45)
            self.set_fill_color(26, 26, 46)
            self.rect(ML, photo_y + avail_h - ov_h, CW, ov_h, "F")
            # Destino en Bebas blanco
            dest_up = self.guide.metadata.destination.upper()
            self.set_text_color(255, 255, 255)
            self.set_font("B","",52)
            self.set_xy(ML + 3, photo_y + avail_h - ov_h + 2)
            self.cell(CW, ov_h - 4, dest_up, align="L")

        self.set_auto_page_break(True, margin=MB)

    # ══════════════════════════════════════════════════════════════════════
    # PÁGINA DE SECCIÓN
    # ══════════════════════════════════════════════════════════════════════
    def section_page(self, section: Section, recs: list[Recomendado], n: int):
        self.add_page()

        # ── 1. Header: NUM | ◑ TÍTULO ──────────────────────────────────
        y0 = self.get_y()
        self.tc(self.P.secondary)
        self.set_font("B","",46)
        nw = self.get_string_width(str(n)) + 2
        self.set_xy(ML, y0)
        self.cell(nw, 14, str(n))

        # Barra gris vertical
        self.dc("#aaaaaa"); self.set_line_width(0.4)
        bx = ML + nw + 2
        self.line(bx, y0 + 2, bx, y0 + 12)

        # Logo ◑ real
        ix = bx + 3
        self._logo(ix, y0 + 3, 6.5)

        # Título en Bebas
        self.set_font("B","",18)
        self.tc(self.P.secondary)
        tx = ix + 8
        self.set_xy(tx, y0 + 2)
        self.cell(PW - MR - tx, 11, section.name.upper())

        # Separador fino
        self.dc("#dddddd"); self.set_line_width(0.25)
        self.line(ML, y0 + 14.5, PW - MR, y0 + 14.5)
        self.set_y(y0 + 17)

        # ── 2. Slogan full-width ───────────────────────────────────────
        dest_up = self.guide.metadata.destination.upper()
        self.tc(self.P.secondary)
        self.set_font("A","B",8.5)
        self.set_x(ML)
        self.cell(CW, 5.5, "ESTAS SON LAS SELECCIONES MÁS COOL DE",
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Destino gigante
        self.set_font("B","",52)
        self.set_x(ML)
        self.cell(CW, 17, dest_up, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

        # ── 3. "PARA 2◑21" con get_x() ────────────────────────────────
        self._draw_para_badge()
        self.ln(5)

        # ── 4. Split: caja categoría (izq) | foto sección (der) ────────
        SPLIT_L = CW * 0.46
        SPLIT_G = 5
        SPLIT_R = CW - SPLIT_L - SPLIT_G
        PHOTO_H = 72
        split_y = self.get_y()

        photo_x = ML + SPLIT_L + SPLIT_G
        self._img(self._sec_img(n), photo_x, split_y, SPLIT_R, PHOTO_H)

        # Caja categoría izquierda
        if section.subsections:
            sub0 = next((s for s in section.subsections if s.active), None)
            if sub0:
                self._cat_box(sub0.name, sub0.content, SPLIT_L)
        else:
            self._cat_box("Exclusivo",
                          f"Las mejores propuestas de {self.guide.metadata.destination}",
                          SPLIT_L)

        # Intro text debajo de la caja (en la columna izquierda)
        if section.content:
            after_box_y = self.get_y()
            avail_h = split_y + PHOTO_H - after_box_y - 3
            if avail_h > 8:
                self.tc(self.P.text)
                self.set_font("A","",8.5)
                self.set_xy(ML, after_box_y)
                cpl = max(1, int(SPLIT_L / 1.5))
                chars = int(avail_h / 3.8) * cpl
                snippet = (section.content[:chars]+"…") if len(section.content)>chars else section.content
                self.multi_cell(SPLIT_L, 3.8, snippet,
                                new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        self.set_y(split_y + PHOTO_H + 5)

        # Texto restante (full-width)
        if section.content and len(section.content) > 80:
            self.tc(self.P.text)
            self.set_font("A","",8.5)
            self.set_x(ML)
            self.multi_cell(CW, 4.5, section.content,
                            new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.ln(3)

        # ── 5. Subsecciones adicionales ────────────────────────────────
        for sub in section.subsections[1:]:
            if sub.active:
                self._cat_box(sub.name, sub.content, CW * 0.50)
                self.ln(2)

        # ── 6. Grid de recomendados ────────────────────────────────────
        if recs:
            self._rec_grid(recs)

    # ── "PARA 2◑21" — espaciado correcto con get_x() ──────────────────
    def _draw_para_badge(self):
        y = self.get_y()
        self.tc(self.P.secondary)

        # "PARA "
        self.set_font("B","",16)
        self.set_xy(ML, y)
        self.cell(0, 9, "PARA ", ln=0)
        cx = self.get_x()

        # "2"
        self.set_font("B","",24)
        self.set_xy(cx, y - 1.5)
        self.cell(0, 11, "2", ln=0)
        cx = self.get_x()

        # Isotipo inline (reemplaza el "0")
        icon_sz = 7.5
        self._logo(cx + 0.5, y, icon_sz)
        cx += icon_sz + 2

        # "21"
        self.set_font("B","",24)
        self.set_xy(cx, y - 1.5)
        self.cell(0, 11, "21", ln=0)
        self.set_y(y + 9)

    # ── Caja de categoría (parcial, primera letra grande) ─────────────
    def _cat_box(self, name: str, subtitle: str = "", width: float = None):
        if width is None: width = CW * 0.50
        if self.get_y() > PH - MB - 30: self.add_page()
        BH = 17 if subtitle else 11
        bx, by = ML, self.get_y()
        self.fc(self.P.primary)
        self.rect(bx, by, width, BH, "F")
        first, rest = name[0], name[1:].upper()
        self.set_text_color(255, 255, 255)
        self.set_xy(bx + 4, by + 1)
        self.set_font("B","",16); fw = self.get_string_width(first)+0.5
        self.cell(fw, 8, first)
        self.set_font("A","B",10); self.cell(0, 8, rest)
        if subtitle:
            max_c = int(width / 1.75)
            st = (subtitle[:max_c]+"…") if len(subtitle)>max_c else subtitle
            self.set_xy(bx+4, by+10)
            self.set_text_color(255,220,238)
            self.set_font("A","I",7.5)
            self.cell(width-8, 5.5, st)
        self.set_y(by + BH + 4)

    # ── Grid 3 columnas ────────────────────────────────────────────────
    def _rec_grid(self, recs: list[Recomendado]):
        CARD_H = 96
        col = 0; row_y = self.get_y()
        for rec in recs:
            if row_y + CARD_H > PH - MB - 2:
                self.add_page(); row_y = self.get_y(); col = 0
            self._rec_card(ML + col*(COL3+GAP3), row_y, COL3, CARD_H, rec)
            col += 1
            if col == 3:
                col = 0; row_y += CARD_H + GAP3; self.set_y(row_y)
        if col > 0:
            self.set_y(row_y + CARD_H + GAP3)

    # ── Card individual: Bebas nombre, italic tagline, foto ────────────
    def _rec_card(self, x, y, w, h, rec: Recomendado):
        PHOTO_H = 32
        TEXT_H  = h - PHOTO_H - 2

        # Nombre en Bebas CAPS
        self.tc(self.P.secondary)
        self.set_font("B","",13)
        self.set_xy(x, y)
        nm = (rec.name[:38]+"…") if len(rec.name)>38 else rec.name
        self.multi_cell(w, 6, nm.upper(), new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Tagline italic (primera frase)
        dot = rec.description.find(".")
        if 0 < dot < 90:
            tagline   = rec.description[:dot+1]
            rest_desc = rec.description[dot+1:].strip()
        else:
            tagline   = CAT_LABELS.get(rec.category.value,"")+"."
            rest_desc = rec.description

        self.tc(self.P.text)
        self.set_font("A","I",8)
        self.set_x(x)
        self.cell(w, 4.5, tagline, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1.5)

        # Descripción
        desc_y    = self.get_y()
        photo_top = y + TEXT_H
        avail     = max(0, photo_top - desc_y - 11)
        max_lines = max(1, int(avail/3.8))
        cpl       = max(1, int(w/1.52))
        max_ch    = max_lines * cpl
        desc_out  = (rest_desc[:max_ch]+"…") if len(rest_desc)>max_ch else rest_desc
        self.tc(self.P.text)
        self.set_font("A","",7.5)
        self.set_x(x)
        self.multi_cell(w, 3.8, desc_out, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Web italic magenta
        web_y = y + TEXT_H - 9.5
        if rec.website:
            self.set_xy(x, web_y)
            self.tc(self.P.primary)
            self.set_font("A","I",7)
            ws = "Web: " + rec.website
            self.cell(w, 4.5, (ws[:55]+"…") if len(ws)>55 else ws)

        # Dirección italic gris
        if rec.address:
            self.set_xy(x, web_y+5)
            self.set_text_color(118,115,112)
            self.set_font("A","I",7)
            addr = "Dirección: "+rec.address
            self.cell(w, 4.5, (addr[:57]+"…") if len(addr)>57 else addr)

        # Foto real
        ph_y = y + TEXT_H
        self._img(self._cat_img(rec.category.value), x, ph_y, w, PHOTO_H-1)

        # SCAN ME
        sq = 8.5; sqx = x+w-sq-1; sqy = ph_y+PHOTO_H-sq-2.5
        self.set_fill_color(255,255,255)
        self.dc("#999999"); self.set_line_width(0.2)
        self.rect(sqx, sqy, sq, sq, "FD")
        for qx, qy in [(sqx+1,sqy+1),(sqx+4,sqy+1),(sqx+1,sqy+4),
                       (sqx+3,sqy+3),(sqx+5,sqy+5),(sqx+6,sqy+2)]:
            self.set_fill_color(50,48,60)
            self.rect(qx, qy, 1.1, 1.1, "F")
        self.set_text_color(150,148,145)
        self.set_font("A","B",4)
        self.set_xy(sqx, sqy+sq+0.5)
        self.cell(sq, 3, "SCAN ME", align="C")


# ── API pública ────────────────────────────────────────────────────────────────

def render_guide_pdf(guide: Guide, profile: str | None = None) -> bytes:
    pdf = GuidesPDF(guide)
    active = guide.active_sections()

    # Pre-crear links con páginas estimadas (portada=1, toc=2, sec_i=2+i)
    # fpdf2 requiere página asignada antes de usar el link en cell()
    section_links = []
    for i in range(len(active)):
        lnk = pdf.add_link()
        pdf.set_link(lnk, page=i + 3)   # estimado: 1 pág/sección
        section_links.append(lnk)

    pdf.cover_page()
    pdf.start_section("Portada", level=0)

    pdf.toc_page(active, section_links)
    pdf.start_section("Índice", level=0)

    for i, sec in enumerate(active, start=1):
        recs = guide.recomendados_for_section(sec.id)
        pdf.section_page(sec, recs, i)
        pdf.start_section(sec.name, level=0)

    return bytes(pdf.output())


def save_pdf(guide: Guide, profile: str | None = None) -> Path:
    settings.exports_dir.mkdir(parents=True, exist_ok=True)
    suffix = f"-{profile}" if profile else ""
    fn  = f"{guide.metadata.slug}-v{guide.metadata.version}{suffix}.pdf"
    out = settings.exports_dir / fn
    out.write_bytes(render_guide_pdf(guide, profile))
    return out
