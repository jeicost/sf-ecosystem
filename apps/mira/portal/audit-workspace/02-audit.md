# Audit — MIRA Portal vs. Target Premium Dark
## Stack actual: Next.js 15, Tailwind, Inter

## Scores iniciales

| Ítem | Score | Diagnóstico |
|------|-------|-------------|
| Layout y proporciones | 7 | Grid 3x2 correcto. Login split ok. Pero densidad del left panel login es baja. |
| Tipografía | 5 | Nombre de equipo en cards = body text. Sin diferenciación h3/h4 real. |
| Color | 5 | Cards #090909 sobre page #060608 → contraste prácticamente cero. "Notion flat". |
| Espaciado | 7 | Padding de cards ok. Stats strip ok. |
| Componentes | 5 | Cards carecen de jerarquía visual. Header M-in-box = cliché Notion. Agent initials = 24px indistinguibles. |
| Estados interactivos | 6 | Hover color-line funciona pero el resto del card no cambia suficiente. |
| Responsive | N/A | Solo desktop esta iteración. |
| Microdetalles | 4 | Borders INVISIBLES en screenshot. Locked cards demasiado oscuras — no crean FOMO. "Activo" badge muy pequeño. Agent floating cards en login TINY e ilegibles. |
| Jerarquía visual | 5 | Marketing/Comercial/etc = mismo peso visual que el tagline. No hay "scanability". |
| Densidad | 6 | Left panel login muy vacío entre logo y stats. Home cards tiene equilibrio. |

## SCORE PROMEDIO INICIAL: 5.5/10

## Problemas críticos (en orden de impacto)

### P1 — Nombre del equipo en cards (jerarquía)
- Actual: `text-sm font-semibold text-white` = 14px. Mismo size que el tagline.
- Target: 18-20px font-semibold tracking-tight. El nombre DOMINA la card.

### P2 — Cards sin contraste con el fondo
- Actual: bg-[#090909] sobre page bg-[#060608] = 3 puntos de diferencia en hex. INVISIBLE.
- Target: Cards con bg #0f0f16 + border rgba(255,255,255,0.08). Contraste claro.

### P3 — Locked cards no crean FOMO
- Actual: todo en oscuro ilegible. El usuario no sabe qué se pierde.
- Target: nombre VISIBLE pero en muted, tagline VISIBLE en muy muted, bullets con líneas grises "censored", badge del plan en color saturado. El usuario ve QUÉ hay pero no puede acceder.

### P4 — Agent floating cards en login = ilegibles
- Actual: 28x28px, texto 9-11px, glow inexistente.
- Target: 40x40px emoji icon, nombre 13px/semibold, rol 10px, glow border visible.

### P5 — Header MIRA logo = Notion clone
- Actual: cuadrado 28x28px purple = idéntico al logo de Notion.
- Target: eliminar el cuadrado coloreado en el header → solo texto MIRA con dot indicator o versión pill. Guardar el cuadrado para la login screen (más impacto ahí).

### P6 — Tipografía section labels ("EQUIPOS ACTIVOS")
- Actual: text-[10px] text-[#2a2a2a] uppercase → invisible, gris plano Notion.
- Target: ligeramente más visible, con dot indicator de color o sin el divider line (Linear style).

### P7 — "Abrir equipo →" CTA
- Actual: text-[10px] text-[#2a2a2a] → invisible. Solo visible en hover.
- Target: visible en base (#444), bien visible en hover (color acento).

### P8 — Stats en login left panel
- Actual: 3 boxes oscuros con borde sutil.
- Target: números más grandes (28px), sin box border — solo número + label sobre fondo limpio, centrados.
