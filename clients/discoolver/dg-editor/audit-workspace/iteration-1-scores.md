# Iteración 1 — scores

## Cambios aplicados
- disco-base.css: ph-number color #444 → var(--navy), card-photo-sm 96→100px, card-desc 8.5→9px
- disco-loader.js: badge 7→8px, añadida window.injectPageNumber()
- 06-restaurantes.html: eliminados _cardHtml/_cardHHtml locales, usa window.renderCard/renderCardH, footer 28→26px
- 14-influencers.html: footer 22→26px, color #aaa→var(--muted), añadido disco-loader.js + onGuideData
- 04-nota-director.html: footer 28→26px left 60→56px
- 08/10/11/12: footer 28→26px

## Scores

| # | Ítem | Iter 0 | Iter 1 | Δ |
|---|------|--------|--------|---|
| 1 | Layout y proporciones | 7 | 8 | +1 |
| 2 | Tipografía | 8 | 8 | 0 |
| 3 | Color | 7 | 8 | +1 |
| 4 | Espaciado | 7 | 8 | +1 |
| 5 | Componentes | 6 | 8 | +2 |
| 6 | Estados interactivos | 8 | 8 | 0 |
| 7 | Responsive | 7 | 7 | 0 |
| 8 | Microdetalles | 6 | 7 | +1 |
| 9 | Jerarquía visual | 7 | 7 | 0 |
| 10 | Densidad | 7 | 7 | 0 |
| **MÍNIMO** | | **6** | **7** | **+1** |

## Pendiente para iteración 2
- Verificar templates 08/09/13/16 — footers faltantes o page numbers sin actualizar
- Mejorar jerarquía visual en fichas: card-name podría tener más peso visual vs foto
- Revisar 13-shopping.html y 09-ocio-eventos.html por inconsistencias similares
- La portada sin foto sigue siendo el punto débil (score visual 5/10 sin imagen)
