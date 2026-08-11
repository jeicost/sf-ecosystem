# Mensaje a Diego — cierre de integración del producto completo
*(preparado 2026-08-11; enviado por Carlos)*

## La cadena completa, y dónde está cada eslabón

**Curador → CMS Diego → app.discoolver.com → editor de guías → tienda/360.**
El curador cosecha redes y Maps y produce sitios verificados; el CMS los publica
(estado 4 → `_all`); la plataforma los sirve al viajero; el editor los convierte
en guías por ciudad; la tienda las vende el 1-sept. **La landing ya está
conectada en vivo a la plataforma** — números reales por API con refresco
diario (11-ago: Madrid 1.099 · Barcelona 218 · Málaga 132 · Ibiza 51) y cada
sección enlaza a su parte del portal. Lo que se abre o publica aparece solo.

## Bloque 1 — BBDD y taxonomía (entregado el 7-ago, hoja ORDEN del Excel)

0. **Usuario de BBDD propio** (único bloqueante real; con `doadmin` no escribimos).
1. **`ES_PRINCIPAL = 1` en las 113 ANTES de limpiar** — las 83 reutilizadas
   salen hoy de rebote por la rama del `OR`; limpiar antes las apaga sin error.
2. Las **4.781 «categorías» que son etiquetas** → `ES_TAG` (mecanismo ya
   construido: 31 familias de filtro traducidas; 6 de nuestras 9 encajan 1:1).
3. **`CALL oejecutar_para_todos()`** — 31 fichas en estado 4 invisibles; solo
   1.744 de 6.920 vivas están en `_all`. Confirmar si el Java borra antes del
   INSERT (republicar da «Duplicate entry»).
4. Deduplicar `RAW_ID` de Ronda (luz verde dada) + los 3 con guion bajo final.
5. 30.386 traducciones en estado 3 · 91 coordenadas invertidas · fichas
   `"undefined"` en `_ia`.

## Bloque 2 — Contenido para el 1-sept 🔴

- **Abrir** Ronda (165 listas), Aranjuez (64), Punta Cana (128), Sto Domingo (75).
- **Cola de revisión**: ~3.900 en estado 3 (94% IA, 6% foto). Madrid 858→1.099 ✓.
- Limpiar "Filipinas" (50 fichas) y **ocultar las ciudades de prueba** del
  buscador público (SHANGAI, TOKIO, Londres, San Francisco, Sao Paulo, París).

## Bloque 3 — Plataforma (front)

- **Deep links** (probado: hoy ignora `?city=`): `?city=` en /search /map
  /calendar /plan-my-trip · `?category=` en /search · ruta pública `/place/:id`
  (el endpoint `/business/{a}/detail/{b}` ya existe). Spec completa:
  `spec-deep-links-plataforma.md`.
- Quitar los `console.debug("[Auth] Token adjuntado…")` de producción.

## Bloque 4 — Editor de guías

- Las **5 guías draft** (Madrid, Barcelona ×2, Bangkok ×2): cerrar en 3 semanas
  y pasarlas **una a una según firme cada creador** (su nombre sustituye a la
  portada de ejemplo automáticamente vía CMS).
- **`lat`/`lng` en fichas** → mapas ilustrados reales del PDF sin tocar código.
- `wellness` y `naturaleza` en secciones canónicas **con plantillas** ·
  `taxonomy.yml` 82→113.
- **Fotos para papel**: A4 a sangre pide ~2.500px; las fichas traen 800-1.400.

## Bloque 5 — Curador: primera entrega sin tocar producción

Pasar las **305 fichas de `_ia` por Maps** y devolverlas completas (hoy: 31%
coordenadas, 38% categoría, 0% foto, 0% web). Cuando el curador esté vivo, la
ingesta Apify del editor se retira — una cosecha, no dos.

## Bloque 6 — Demo B2B y analítica

- Cuadro de mando de **Ronda presentable para demos** (sus datos no se
  publican; se enseñan en vivo — decisión CEO).
- Píxel de Meta canónico + acceso a `GTM-TT97GKS`.

## Lado Carlos (para no frenar)

Tokens Apify/Anthropic del curador · repo remoto `discoolver-group/
discoolver-curator` · firmas de creadores (3 semanas) · decisiones web en
revisión (creators-landing, estreno de 360, corte de discoolver.com).

**Orden**: bloque 1 es cimiento, bloque 2 decide el 1-sept, el resto en paralelo.
