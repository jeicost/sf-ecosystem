# Plan de implementación — Iteración 1

## Orden de cambios

### Bloque A — Bugs críticos (no tocar más hasta resolver)
1. Eliminar `_cardHtml` y `_cardHHtml` locales en 06-restaurantes.html → usar window.renderCard
2. Añadir `<script src="shared/disco-loader.js">` a 14-influencers.html
3. Hacer page numbers dinámicos vía GUIDE_CONFIG.pageNumber en disco-loader.js

### Bloque B — Inconsistencias footer (todos los templates)
4. Unificar footer: bottom:26px, left:56px, right:56px en TODOS
5. Fijar color footer influencers: #aaa → var(--muted) #6b7280

### Bloque C — Escala / legibilidad  
6. Badge: 7px → 8px (más legible en impresión)
7. `infl-stat-lbl`: 7px → 7.5px
8. `card-desc`: 8.5px → 9px
9. `ph-number`: color #444 → color var(--navy) (más consistente con la marca)

### Bloque D — Microdetalles
10. `card-photo-sm` height: restaurantes la sobreescribe a 100px → unificar a 100px en disco-base
11. `card-tag` en restaurantes debería tener margin-bottom más consistente

## Archivos a modificar
- `design/shared/disco-base.css` — escala tipográfica, card photo, ph-number color
- `design/shared/disco-loader.js` — page number injection  
- `design/06-restaurantes.html` — eliminar renderers locales
- `design/14-influencers.html` — añadir disco-loader, fix footer colors

## Riesgos
- Cambiar card renderers en 06-restaurantes puede cambiar el layout si window.renderCard
  produce HTML estructuralmente diferente al local — VERIFICAR antes
- Badge size up podría hacer overflow en títulos cortos — mínimo impacto
