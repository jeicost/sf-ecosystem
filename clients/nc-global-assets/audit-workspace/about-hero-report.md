# About Hero Redesign — Final Report

**Fecha:** 2026-05-06
**Iteraciones:** 3
**Score final:** 8.8/10 (mínimo 8.5/10)

## Scores finales

| Ítem | Score |
|------|-------|
| Layout y proporciones | 9 |
| Tipografía | 8.5 |
| Color | 9 |
| Espaciado | 9 |
| Componentes | 8.5 |
| Interactivos | 8.5 |
| Responsive | 8.5 |
| Microdetalles | 8.5 |
| Jerarquía visual | 9 |
| Densidad | 8.5 |

## Diseño implementado

Reemplazo completo del `.page-hero` de AboutPage por una sección `.about-hero` nueva:
- **Split 2 columnas** (1.3fr / 0.7fr en desktop)
- **Izquierda:** eyebrow + H1 grande + body + CTAs (Book a Call / Chat) + credential strip (BKK / 15+ / 3 / SEA)
- **Derecha:** dos portraits staggered de Carlos + Nirada con portrait-tag overlay
- **Background:** `var(--bg-deep)` + radial gold glow top-right (rgba 0.10) + segundo glow bottom-left (rgba 0.04)
- **Hover en portraits:** translateY(-5px) + border gold

## Cambios CSS añadidos

- `.about-hero` — sección, glows ::before y ::after
- `.about-hero__inner` — grid 2 col desktop, columna en mobile
- `.about-hero__headline` — clamp(38px, 5.2vw, 70px), weight 700, ls -0.035em
- `.about-hero__body` — 16px, line-height 1.75, ink-soft
- `.about-hero__creds` — flex row con border-top, credential values en gold
- `.about-hero__portraits` — grid 2 col con stagger --a margin-bottom 36px, --b margin-top 36px
- `.about-hero__portrait` — hover translateY + gold border transition
- `.about-hero__portrait-tag` — gradient overlay con font-mono

## Diferenciación respecto al home hero

- Home: imagen Bangkok fullbleed + texto encima
- About: fondo near-black puro + retratos humanos de los founders + credential strip
- Mismo design system (Space Grotesk, gold, spacing tokens)
