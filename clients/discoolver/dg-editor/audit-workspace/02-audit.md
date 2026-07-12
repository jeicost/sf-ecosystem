# Auditoría de diseño — Guías Discoolver
Fecha: 2026-05-08 | Método: code review + comparación con PDFs de referencia (Mundo, Madrid, Barcelona)

## Stack actual
- Templates: 21 HTML estáticos + 1 CSS compartido (disco-base.css)
- CSS: Vanilla CSS por template + disco-base.css como base
- Fuentes: Bebas Neue, Inter, DM Sans, Playfair Display (Google Fonts)
- Datos: disco-loader.js carga desde /api/v2/guides/{id}/export/config

---

## BUGS CRÍTICOS (rompen la guía)

### BUG-1: Renderers de cards duplicados en 06-restaurantes.html
- `_cardHtml()` local SOBREESCRIBE `window.renderCard` de disco-loader
- Las badges tienen padding diferente: local usa `2px 5px`, loader usa `2px 6px`
- Si se cambia disco-loader.js las fichas de restaurantes no se actualizan

### BUG-2: disco-loader.js NO incluido en 14-influencers.html
- La sección de influencers no puede cargar datos dinámicos
- Cuando se abre con ?guide=<id>, los datos del director y chips no aparecen

### BUG-3: Números de página hardcodeados — nunca se actualizan
- 06-restaurantes: hardcoded "11" en header Y footer
- 14-influencers: hardcoded "44" — imposible si la guía cambia el orden de secciones
- disco-loader.js no inyecta pageNumber en ningún template

---

## INCONSISTENCIAS DE DISEÑO (alta severidad)

| Elemento | Debería ser | 04-nota | 06-rest | 14-infl | disco-base |
|----------|-------------|---------|---------|---------|------------|
| Footer bottom | 26px (base) | 28px ❌ | 28px ❌ | 22px ❌ | 26px ✅ |
| Footer left/right | 56px (base) | 60px ❌ | 60px ❌ | 56px ✅ | 56px ✅ |
| Footer text color | var(--muted) | var(--muted) ✅ | var(--muted) ✅ | #aaa / #bbb ❌❌ | var(--muted) ✅ |
| Card photo height | 96px (base) | — | 100px (~ok) | 148px (infl, ok) | 96px |

### Footer de influencers casi invisible
- Color #aaa (#aaaaaa) = contraste 2.32:1 contra blanco — falla WCAG AA
- Color #bbb = aún peor
- En impresión sería prácticamente invisible

---

## PROBLEMAS DE ESCALA / LEGIBILIDAD

| Elemento | Tamaño actual | Issue |
|----------|--------------|-------|
| `card-desc` | 8.5px | Muy pequeño para impresión A4 |
| `card-name` | 15px Bebas | OK |
| `card-tag` | 9px italic magenta | Borderline — en impresión puede perderse |
| Badge text | 7px | Casi ilegible en impresión |
| `card-web` | 8px | OK para referencia, difícil leer |
| `infl-stat-num` | 14px Bebas | OK |
| `infl-stat-lbl` | 7px uppercase | Muy pequeño |

---

## PROBLEMAS DE CONTENIDO OVERFLOW

- `card-desc` con `flex: 1` + `text-align: justify`: si el texto es muy largo,
  puede salir del área visible al renderizar en Playwright para PDF
- `directors_letter` larga puede desbordar `.director-layout` (grid 1fr 1fr, altura fija implícita)
- `split-intro` en 06-restaurantes usa drop-cap con float — puede causar reflow extraño
  si el texto es muy largo y la foto de la derecha tiene height 178px

---

## FOTO PLACEHOLDER (problema de UX en editor)

- Portada: muestra emoji 📷 + texto en placeholder — degradado visual en screenshots de testing
- Todas las secciones: `photo-ph` gris con emoji 📷 — razonable para edición
- Sin photo, el badge position:absolute sobre photo-ph queda flotando sobre gris → correcto pero feo

---

## COMPARATIVA CON REFERENCIA (covers)

| Aspecto | Referencia PDF | Template actual | Delta |
|---------|---------------|-----------------|-------|
| Wordmark "discoolver" | DM Sans 500, ~90px, blanco | DM Sans 500 92px, blanco ✅ | ~0 |
| Letter-spacing wordmark | Muy ajustado | -3px ✅ | ~0 |
| Tagline bajo wordmark | Italic pequeño, alineado derecha | Inter italic 14px right ✅ | ~0 |
| Headline central | Bebas line1 + Playfair italic line2 | Bebas 82px + Playfair italic 54px ✅ | ~0 |
| Año bottom "2●21" | Bebas 96px con isotipo D | Bebas 96px con SVG custom ✅ | ~0 |
| Ciudad bottom | Bebas ~60px, tabulado | Bebas 62px ✅ | ~0 |
| Fondo | Foto full-bleed + color bg | Sin foto = gris 1a1a1a + placeholder | ⚠️ sin foto |

**Conclusión portada:** La estructura y tipografía son correctas. El único problema es la calidad sin foto.

---

## TABLA SCORES INICIAL (sin screenshots — análisis de código)

| # | Ítem | Score | Notas |
|---|------|-------|-------|
| 1 | Layout y proporciones | 7 | Estructura A4 correcta. Footers inconsistentes rompen el ritmo |
| 2 | Tipografía | 8 | Fuentes y escala correctas. Badge 7px y infl-stat-lbl 7px muy pequeños |
| 3 | Color | 7 | Paleta navy+magenta correcta. Footer influencers #aaa es error grave |
| 4 | Espaciado | 7 | Base sólida. Gaps entre templates inconsistentes |
| 5 | Componentes | 6 | Duplicate renderers en restaurantes. Loader faltante en influencers |
| 6 | Estados interactivos | 8 | Nav hover OK. QR decorativo funcional |
| 7 | Responsive | 7 | A4 fixed width 794px — correcto para PDF, no para web |
| 8 | Microdetalles | 6 | Footer inconsistente, badge minúsculo, ph-number color #444 |
| 9 | Jerarquía visual | 7 | Portada excelente. Interiores pierden jerarquía con fichas muy densas |
| 10 | Densidad | 7 | Restaurantes muy apretado con 5 fichas. Influencers bien distribuidos |
| **MÍNIMO** | | **6** | |
