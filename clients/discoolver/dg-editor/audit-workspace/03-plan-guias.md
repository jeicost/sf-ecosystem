# Plan de implementación — Loop Diseño Guías 2026

## Bloque 1 — Fix crítico binding (01, 02, 04)
Guard en useEffect: `if (new URLSearchParams(location.search).get('guide')) return;`
Afecta: 01-portada, 02-portada-typo, 04-nota-director

## Bloque 2 — Cover sin foto: gradient dinámico por colección
Cuando no hay `cfg.coverPhoto`, mostrar:
- Fondo color = `cfg.coverBgColor` (ya se setea)
- Glow radial central con `cfg.accentColor` al 15-20%
- Gradient bottom más pronunciado
Esto diferencia visualmente Mundo (azul), Foodie (ámbar), Pablo (naranja), Madrid (magenta)

## Bloque 3 — Template 06 restaurantes: card principal sin foto
Cuando item principal no tiene foto, mostrar pattern geométrico con accent color
en lugar del gris plano

## Bloque 4 — Ajustes tipográficos menores
- coverTagline en portada 01: se muestra justo debajo del wordmark, alineación con headline
- Badge size: aumentar padding de badges en templates secundarios

## Bloque 5 — Re-export + verificación visual

## Archivos a modificar
- design/01-portada.html
- design/02-portada-typo.html  
- design/04-nota-director.html
- design/06-restaurantes.html (menor)

## Riesgos
- El guard en useEffect no afecta al modo editor (sin ?guide=) — seguro
- Los cambios en portada son estéticos, no structurales
