# Auditoría — 4 Guías Discoolver 2026
Fecha: 2026-05-09

## Bugs críticos (bloquean la fidelidad visual)

### BUG-1: React useEffect sobreescribe el fetch vanilla en PDF export
- **Plantillas:** 01-portada, 02-portada-typo, 04-nota-director
- **Causa:** Babel JSX compilation (~1000ms) > fetch local (~100ms).
  El useEffect corre DESPUÉS del fetch y resetea con TWEAK_DEFAULTS.
- **Síntoma:** Mundo/Foodie muestran "INSPIRING / the World" en portada 01.
  Pablo sí funciona porque `cover_headline1="MEJORES"` es más simple y
  el template influencer tiene otro patrón.
- **Fix:** En useEffect de cada template, saltar DOM updates cuando `?guide=` está presente.

### BUG-2: year default "21" en portada 01
- `TWEAK_DEFAULTS.year = "21"` — debería ser año dinámico.
- Afecta preview en browser sin `?guide=`, no el PDF export.

## Tabla de issues visuales por template

| Template | Issue | Impacto |
|----------|-------|---------|
| 01-portada | Bug binding (headline1/2/tagline no carga) | CRÍTICO |
| 01-portada | Placeholder foto: fondo negro plano, área vacía grande | Alto |
| 01-portada | Cover sin foto = falta identidad visual diferenciada por guía | Alto |
| 02-portada-typo | Bug binding (tagline/headline override) | Medio |
| 02-portada-typo | Fondo negro plano, no usa coverBgColor | Alto |
| 04-nota-director | Bug binding (carta/pull-quote puede no cargar) | CRÍTICO |
| 06-restaurantes | Items sin foto = placeholder gris grande en card principal | Alto |
| 06-restaurantes | Badge de texto muy pequeño en cards secundarias | Medio |
| todos | Diferenciación de color por colección no visible | Medio |

## Estado visual por guía (scorecard actual)

| Guía | Portada | Director | Restaurantes | Media |
|------|---------|----------|--------------|-------|
| Mundo | 5 (bug binding) | 7 | 7.5 | 6.5 |
| Madrid | 8 (city/year OK) | 7.5 | 8 | 7.8 |
| Foodie | 5 (bug binding) | 7.5 | 8 | 6.8 |
| Pablo | 8.5 (headline OK) | 8 | 8.5 | 8.3 |

## Diferenciación por colección (estado actual vs deseado)
- Mundo (nomadas-digitales, #6366F1): Cover negro plano → debería tener tinte índigo
- Madrid (estandar, #C8006B): Color correcto en badges, OK
- Foodie (foodie-selection, #B45309): Cover negro → debería tener tinte ámbar
- Pablo (foodie-hoodie, #D97706): Cover negro → debería tener glow naranja

