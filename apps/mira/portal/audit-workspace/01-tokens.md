# Design Tokens — MIRA Premium Dark SaaS
# Referencia auto-definida. Estilo objetivo: Linear/Vercel/Resend dark — no Notion.

## Paleta
- Page bg: #050507 (casi negro con tinte azul oscuro, NO negro puro)
- Surface 1: #09090f (cards, elevado del bg)
- Surface 2: #0d0d14 (hover state de cards)
- Border subtle: rgba(255,255,255,0.06)  — muy sutil, casi invisible
- Border default: rgba(255,255,255,0.08)
- Border hover: rgba(255,255,255,0.12)
- Text primary: #f8f8fc (blanco ligeramente frío, no puro #fff)
- Text secondary: #4a4a6a (muted con tinte violeta)
- Text tertiary: #2a2a42 (para labels muy pequeños)
- Brand violet: #6366f1 (indigo-500, NO purple)
- Brand glow: rgba(99,102,241,0.15)
- Accent active: section-specific colors, muted (~0.7 alpha para bordes, pleno para texto)
- Success green: #22c55e
- Error red: #ef4444

## Tipografía
- Familia: Inter (actual — MANTENER, es premium)
- H1 login: 28px / weight 600 / ls -0.02em / color #f8f8fc
- H1 home: 36px / weight 600 / ls -0.03em
- Body: 14px / weight 400 / ls 0 / lh 1.6
- Label small: 11px / weight 500 / ls 0.04em / uppercase / color text-tertiary
- Tagline card: 11px / weight 400 / lh 1.5 / color text-secondary
- Bullet text: 10px / weight 400 / color rgba(255,255,255,0.25)

## Espaciado (escala 4px)
- Section padding: 40px vertical / 32px horizontal
- Card padding: 20px (current: 20px — ok)
- Card gap: 16px (current: 16px — ok)
- Header height: 56px
- Element gap interno card: 16px
- Micro gap: 8px

## Border-radius
- Cards principales: 16px (current: rounded-2xl = 16px ✅)
- Badges/pills: 999px para pills cortos, 8px para badges rectangulares
- Input: 12px
- Botón primario: 12px
- Avatar: 50%

## Sombras — MINIMAL
- Cards activas en hover: 0 0 0 1px rgba(section-color, 0.15) + 0 8px 32px rgba(section-color, 0.06)
- Glow logo: 0 0 40px rgba(99,102,241,0.3)
- NO box-shadow grandes — crea aspecto Notion/Notion-like

## Componentes clave — estado objetivo

### Login (split-screen)
- Panel izquierdo (~60%): fondo #050507 con radial glow sutil. 
  Agentes flotantes: más espaciados, typografía más grande, glow visible.
  Logo central: 80px, cuadrado suavizado, glow pronunciado.
  Tagline + 3 stats centrales debajo.
- Panel derecho (~40%): fondo #070710, separado con borde de 1px muy sutil.
  Form: inputs con focus ring indigo, botón con gradiente + glow.
  Demo credentials: pills clickables claras.

### Home cards activas
- Fondo #090910 → hover #0d0d16
- Border visible pero sutil (0.06 → 0.10 on hover)
- Color accent line top más pronunciada en hover
- Agent name initials con color más saturado
- "Abrir equipo →" con transición de color al accent color en hover

### Home cards locked
- CONTRASTE claro: visualmente distintas de las activas
- Fondo más oscuro que el activo: #060608
- Todo el contenido con filter blur(0) — VISIBLE pero desaturado (no completamente invisible)
- Los bullet texts: líneas con width random + bg sutil para "censored" effect
- Plan badge: más prominente, con color del plan requerido
- "Desbloquear" button con gradiente indigo sutil, visible — crear FOMO

## Lo que crea "Notion feel" (a eliminar)
1. Cards con bg muy similar al page bg — sin contraste suficiente
2. Borders demasiado similares a Notion (#242424 = gris plano)
3. Stats con texto muted sin peso tipográfico
4. Badges sin color suficiente
5. CTAs sin glow/sombra
6. Locked state demasiado invisible — no crea FOMO

## Wow factors a añadir
1. Noise texture sutil en fondos (SVG filter o css background-image)
2. Glow effect en logo más pronunciado
3. Agentes flotantes en login: más grandes, más separados, con glow
4. Cards activas: highlight de nombre de agentes con color de sección
5. Counter animado en stats del home (opcional si el tiempo lo permite)
