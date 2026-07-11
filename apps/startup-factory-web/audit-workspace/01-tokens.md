# Design Tokens — Referencia Pangea

## Paleta
| Token | Hex | Uso |
|-------|-----|-----|
| bg-base | #000000 | Fondo principal (negro puro) |
| bg-card | #0A0A0F | Cards y secciones elevadas |
| bg-subtle | #111118 | Secciones alternativas |
| text-primary | #FFFFFF | Titulares y texto principal |
| text-secondary | #888899 | Párrafos, captions |
| accent-primary | #7C3AED | Morado primario del orb |
| accent-secondary | #C026D3 | Magenta del glow |
| accent-gradient | linear-gradient(135deg, #7C3AED, #C026D3) | Botones principales, orb |
| border-subtle | rgba(255,255,255,0.08) | Bordes de cards |
| glow-orb | radial-gradient(circle, rgba(124,58,237,0.4) 0%, rgba(192,38,211,0.15) 40%, transparent 70%) | Orb hero |

## Tipografía
- Familia: Inter / sans-serif (muy limpia, geométrica)
- H1 hero: 80-96px desktop, weight 800-900, line-height 1.0-1.05, letter-spacing -0.03em
- H2 sección: 48-64px, weight 700-800, line-height 1.1, letter-spacing -0.02em
- H3 cards: 20-24px, weight 600-700
- Body: 16-18px, weight 400, line-height 1.6
- Eyebrow: 11-12px, weight 600, letter-spacing 0.12em, uppercase, color accent

## Espaciado
- Section padding: py-28 a py-40 (muy aireado)
- Card padding: p-8 a p-10
- Gap entre cards: gap-6
- Max container: max-w-7xl, mx-auto, px-6

## Layout
- Max width: 1280px container
- Grid: 3 cols para cards, 2 cols para features
- Hero: centrado, full viewport height

## Border-radius
- Cards: 16-24px (rounded-2xl a rounded-3xl)
- Botones: 9999px (pill total)
- Badges/tags: rounded-full

## Efectos visuales (WOW FACTOR)
1. **Orb hero**: Esfera gigante con glow gradiente purple→magenta, blur enorme, flotando en el hero
2. **Fondo espacial**: Círculos oscuros flotantes de distintos tamaños
3. **Glow en botones**: box-shadow con color del acento en hover
4. **Gradiente en texto**: Titulares clave con gradient text (purple→magenta)
5. **Cards glassmorphism ligero**: Fondo muy oscuro con border sutil y backdrop-blur
6. **Floating UI elements**: Mockups de producto flotando en el hero
7. **Partículas/orbs ambientales**: 3-5 círculos difusos en el fondo de secciones clave

## Botones
- Primary: bg gradient purple→magenta, text white, rounded-full, px-6 py-3, font-semibold
- Secondary: border border-white/20, text white, rounded-full, hover:bg-white/10
- Tamaño: text-sm a text-base, nunca enorme

## Sombras
- Cards: box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.4)
- Orb: filter: blur(80px) en el div del glow
- Botón primary hover: box-shadow: 0 0 24px rgba(124,58,237,0.5)
