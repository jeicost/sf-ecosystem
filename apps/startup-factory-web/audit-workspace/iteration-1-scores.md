# Iteración 1 — Scores

## Contexto
- Referencia: Pangea landing (dark nebula, orbs, gradient text, pill buttons, glassmorphism)
- Proyecto: startupsfactory.es (Next.js 15, Space Grotesk, dark #000000, accent #3D2FFF → #A855F7)

## Cambios aplicados
1. `app/[locale]/growth-partner/page.tsx` — rediseño completo Pangea style (era flat blue block)
2. `app/[locale]/startups/page.tsx` — rediseño completo Pangea style (era flat blue block)
3. `app/[locale]/contacto/page.tsx` — rediseño completo con orbs + gradient text hero
4. `components/ContactForm.tsx` — inputs glassmorphism + btn-gradient pill + card-dark calendly
5. `components/Footer.tsx` — colores old → bg-black, border-white/06, pill CTA gradient
6. `components/Navbar.tsx` — dropdown bg-black/95 + border-white/08 + mobile menu dark

## Scores

| # | Ítem | Score |
|---|------|-------|
| 1 | Layout y proporciones | 8 |
| 2 | Tipografía | 9 |
| 3 | Color | 9 |
| 4 | Espaciado | 8 |
| 5 | Componentes | 9 |
| 6 | Estados interactivos | 8 |
| 7 | Responsive | 7 |
| 8 | Microdetalles | 8 |
| 9 | Jerarquía visual | 9 |
| 10 | Densidad | 8 |

**Mínimo: 7 (Responsive — no probado en mobile)**

## Pendiente
- Probar mobile 375px (hero font-size, stats, cards)
- El gap entre secciones del home (hero stats → whatWeDo) es ~300px — puede reducirse
