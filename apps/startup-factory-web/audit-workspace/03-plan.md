# Plan de implementación — Pangea style para SF

## Orden de cambios

### Bloque 1 — Globals CSS + tokens
- Cambiar bg a #000000 en globals.css / layout body
- Texto a #FFFFFF
- Añadir clases de gradiente y glow a globals.css (reutilizables)

### Bloque 2 — Efectos de fondo (WOW factor principal)
- Orb hero: div absoluto con radial-gradient purple/magenta y blur enorme
- Orbs ambientales en secciones: 2-3 círculos difusos por sección key
- Círculos flotantes decorativos (dark, semi-transparentes)

### Bloque 3 — Botones (cambio más impactante, menor riesgo)
- rounded-lg → rounded-full en todos los botones
- Primary: gradient bg desde #3D2FFF → #A855F7 (purple más vivo, brand-aligned)
- Hover glow: box-shadow con el color del acento
- Secondary/outline: border white/20, hover bg white/10

### Bloque 4 — Hero section
- H1 más grande con letter-spacing negativo
- Gradient text en el accent span
- Orb grande detrás del texto
- Más padding vertical (pt-36 md:pt-44)
- Stats más aireados

### Bloque 5 — Cards y secciones
- Border más sutil (white/8)
- Border-radius aumentado (rounded-2xl)
- Section padding: py-24 → py-32
- Gradiente en H2 de secciones clave

### Bloque 6 — Efectos globales
- Gradiente text en titulares principales de sección
- Letter-spacing más negativo en headings grandes

## Archivos a modificar
1. `app/globals.css` — variables base, clases de utilidad
2. `app/[locale]/layout.tsx` — body bg color
3. `app/[locale]/page.tsx` — todo el contenido
4. `components/Navbar.tsx` — botones pill
5. Posiblemente `components/Footer.tsx`

## Decisiones tomadas (sin consultar)
- Mantener #3D2FFF como color base, gradarlo hacia #A855F7 (purple más Pangea) — sin cambiar identidad
- No usar fuente diferente — Space Grotesk ya es buena match
- Mantener todas las imágenes sf-hero.jpg, sf-interior.jpg, sf-aerial.jpg
