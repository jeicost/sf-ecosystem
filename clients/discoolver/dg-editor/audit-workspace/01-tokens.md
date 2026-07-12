# Design Tokens — cms.discoolver.com (referencia)

## Paleta de color

| Token | Valor | Uso |
|-------|-------|-----|
| sidebar-bg | `#0D0D16` | Fondo sidebar |
| main-bg | `#111120` | Fondo página principal |
| card-bg | `#18182A` | Cards, modales |
| card-bg-2 | `#1E1E30` | Input bg dentro de cards |
| border | `rgba(255,255,255,0.08)` | Bordes generales |
| border-2 | `rgba(255,255,255,0.12)` | Inputs focus, separadores |
| text-primary | `#F0F0F8` | Texto principal |
| text-muted | `#7070888` | Texto secundario |
| accent | `#FF00C8` | Magenta principal (más vivido que el actual) |
| accent-hover | `#CC00A0` | Botón primary hover |
| success | `#22C55E` | Disponible, éxito |
| error | `#EF4444` | Error |
| warning | `#F59E0B` | A revisar |
| login-left-bg | `#FFFFFF` | Panel izquierdo login |
| login-right-bg | `#111120` | Panel derecho login (con foto) |
| badge-admin | `rgba(255,0,200,0.2)` + border magenta | ROLE_ADMIN |
| badge-professional | `rgba(139,92,246,0.2)` + border purple | ROLE_PROFESSIONAL |
| badge-producer | `rgba(59,130,246,0.2)` + border blue | ROLE_PRODUCER |

## Tipografía

- Familia: Inter (mismo que el actual)
- Base: 14px
- Nav items: 14px, weight 400/500, sin emojis
- Page heading: 22-28px, weight 700
- Card labels: 11-12px, muted
- Breadcrumb: 12px, muted
- Badge text: 11px, weight 700

## Espaciado

- Sidebar width: 220px
- Page padding: 24-32px
- Card padding: 16-20px
- Nav item padding: 9px 14px
- Table row height: ~44px

## Border radius

- Cards: 8px
- Inputs: 6px
- Badges: 4px (rectangulares, no pills)
- Botones: 6px

## Componentes identificados

- **Sidebar**: dark bg, isotipo D, nav sin emojis, user footer con nombre+email, icono logout
- **Login**: split 50/50 — izquierda blanca con form, derecha oscura con foto ciudad
- **Cards (dashboard)**: dark bg + título en caps + datos en blanco
- **Table**: filas con hover sutil, headers sortables con flechas
- **Filters bar**: dropdowns + "Buscar" button magenta, alineados horizontalmente
- **Tabs (edit)**: barra horizontal, solo texto, active = texto blanco + underline magenta
- **Status badges**: texto "N - ESTADO" con badge gris/colored
- **Modal**: overlay oscuro + card centrada con shadow
- **Schedule cards**: borde verde cuando Disponible=true
- **Botones**: primary=magenta filled, secondary=outlined dark

## Wow factor

El cambio más impactante: pasar de tema claro (#F4F4F6) a oscuro (#111120).
Segundo: magenta más vivo #FF00C8 vs actual #C8006B.
Tercero: nav sin emojis — más profesional/admin.
