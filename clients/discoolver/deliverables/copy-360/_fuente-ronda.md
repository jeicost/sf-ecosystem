## EVIDENCIA DOCUMENTADA — Ronda y Costa del Sol/Málaga como clientes B2B

Base: `/Users/carlosjacoste/Developer/Claude/clients/discoolver/`

---

### 1. RONDA — despliegue B2B

| Dato escrito | Fichero:línea | Citable |
|---|---|---|
| "**Ronda** es el caso: 200+ negocios integrados, tótems interactivos, señalética QR, **ocho puntos de venta**, cliente de pago" | `deliverables/BRAND_BRAIN_DISCOOLVER_2026-08.md:167-168` | **Sí** — el propio doc (línea 213) lista "los datos verificables de Ronda" entre las cifras publicables |
| "Usarlos siempre como *despliegue de plataforma*, nunca como 'guía de Ronda' — no existe tal guía" | `…BRAND_BRAIN…md:169-170` | Regla interna de comunicación (obligatoria al citar) |
| "Ronda y Málaga/Costa del Sol — despliegue B2B real: 200+ negocios integrados, tótems, señalética QR, cliente de pago, oficina de turismo. **Cero fichas curadas**" | `deliverables/PLAN_LANZAMIENTO_2026-09-01.xlsx` → hoja **Resumen**, fila 38 | Sí el hecho del despliegue; el juicio interno ("la mentira más fácil de desmontar") NO |
| "es el destino donde discoolver ya está desplegado (tótems, POS)… encaja mejor como pieza de venta B2B que como producto B2C" | `…xlsx` → **Estado por ciudad**, fila 5 (y fuente `deliverables/rehacer_ciudades.py:50-53`) | Valoración interna → **NO citable** |
| "2022 — Proyecto Ronda: 200+ negocios locales integrados + totems interactivos" | `investor-brain.json:74` · `deliverables/investor-deck-site/index.html:442` | Sí (hito histórico) |
| "200+ negocios y propuestas locales integradas. Totems interactivos. **Venta cruzada con hoteles**" | `brand-brain.json:15` | Sí |
| "Proyectos validados en Ronda (200+ negocios) y Costa del Sol" | `briefing/index.html:280` | Sí |
| Datos de BBDD producción: **247 fichas vivas, 188 recomendadas (STATE=4), 166 con foto principal, 165 tarjetas listas, 38 en cola** | `…xlsx` → **Estado por ciudad**, fila 5 (fuente declarada: "export de la BBDD de producción (Diego, 6-ago-2026)", fila 1) | **NO** — dato operativo interno |
| CSV crudo: **333 filas** con `city=Ronda` (incluye borradas) | `_snapshot/bbdd/produccion_recomendaciones_2026-08-06.csv` (columna 4) | **NO** — export de producción |
| "Importar los 200+ negocios de Ronda… es el único catálogo propio que existe" (tarea PROD-14, P2, Curador, 13→20 ago 2026) | `…xlsx` → **Plan**, fila 104 | **NO** — plan interno |
| Ficha de ciudad B2C en la web antigua: `{"id":74,"rawId":"ronda","name":"Ronda"…}` | `_snapshot/discoolver-com/home-es.html` (JSON embebido) | Público (ya estaba en producción) |

---

### 2. COSTA DEL SOL / MÁLAGA

| Dato escrito | Fichero:línea | Citable |
|---|---|---|
| "**Costa del Sol / Málaga** es el segundo despliegue" | `deliverables/BRAND_BRAIN_DISCOOLVER_2026-08.md:168` | **Sí** |
| "2023 — Proyecto Costa del Sol Tourism Hub: señalética QR + marketplace" | `investor-brain.json:75` · `deliverables/investor-deck-site/index.html:443` | Sí |
| "Proyecto Costa del Sol Tourism Hub: Señalética QR en puntos clave del destino. Integración marketplace." | `brand-brain.json:16` | Sí |
| **Costa del Sol Tourism Hub** figura en la lista de *partners* (junto a SEGITTUR, ICEX, ITH, Tetuan Valley, Clorian, FareHarbor…) | `brand-brain.json:18` · chip en `deliverables/investor-deck-site/index.html:455` | Sí (ya publicado en deck) |
| "Cerró deals con SEGITTUR, ICEX, ITH y Costa del Sol Tourism Hub" (bio Carlos Jacoste) | `investor-brain.json:104` · `deliverables/investor-deck-site/index.html:619` | Sí |
| "Aquí sí hay evidencia real (Ronda 200+ negocios y tótems, **Costa del Sol con QR**), pero no en las 7 plazas del lanzamiento" | `…xlsx` → **Promesas web**, fila 70 | Hecho sí; auditoría interna NO |
| Málaga en BBDD: **213 vivas, 119 recomendadas, 107 con foto, 107 listas, 9 en cola** + "85 fichas en STATE=1 sin revisar. Sin creador asignado" | `…xlsx` → **Estado por ciudad**, fila 6 | **NO** — interno |
| CSV crudo: **226 filas** con `city=Málaga` | `_snapshot/bbdd/produccion_recomendaciones_2026-08-06.csv` | **NO** |
| "Ronda y Málaga/Costa del Sol —las dos plazas con despliegue real, tótems, QR y cliente de pago— **no aparecen en ninguna de las webs nuevas**" | `…xlsx` → **Promesas web**, fila 81 | **NO** — hallazgo de auditoría interna |
| "Preparar 20 prospects B2B de Costa del Sol y Ronda (patronato, DMO, hoteles) y cerrar 3 reuniones usando el case study de Ronda" (COMR-09, P2, CEO) | `…xlsx` → **Plan**, fila 105; réplica en **Playbook ciudad**, fila 42 | **NO** — plan comercial |

---

### 3. IMPORTES DE CONTRATO

| Dato escrito | Fichero:línea | Citable |
|---|---|---|
| **"Ronda está en 1.300 €/mes"**, citado como ejemplo de "clientes con **condiciones negociadas por debajo de tarifa**" | `deliverables/BRAND_BRAIN_DISCOOLVER_2026-08.md:134` | ⚠️ **NO — requiere permiso del cliente.** Es precio negociado individual, no tarifa. El doc lo enmarca como aviso interno ("para no meter la pata al citarlos"), en contraste explícito con los precios de módulo que sí marca como públicos |
| "El **stack completo suma 1.845 €/mes**, que es el contrato medio de referencia" | `…BRAND_BRAIN…md:132` | **Sí** — es suma de tarifa pública, no dato de cliente |
| Tarifas por módulo: Marketplace 750 €/mes · **POS 495 €/mes + 50 € por punto** · Plan My Trip 150 · Calendario 100 · Asistente de Voz 250 · **Señalética y tótems 100 €/mes** · BI incluido | `…BRAND_BRAIN…md:117-125` | **Sí, explícito**: "Estos precios son públicos… Se pueden decir en una propuesta, en la web y en una llamada" (línea 127) |
| "comisión del **10-15% sobre las ventas** del marketplace" | `…BRAND_BRAIN…md:136` · `briefing/index.html:440` | Sí |
| `"avg_contract_month": "€1.845/mes (cliente con 3 módulos activos)"` | `investor-brain.json:57` | Sí (pero **contradice** al Brand Brain, que llama a 1.845 € el stack de 7 módulos) |
| `"mrr": "€5.500 [ESTIMATE]"`, `"arr": "€66.000 [ESTIMATE]"`, `"clients": 3`, `"ltv": "€66.420 [ESTIMATE]"`, `"retention": "100% (sin churn conocido)"` | `investor-brain.json:57-66` | **NO** — marcados `[ESTIMATE]` en el propio fichero |

**No aparece en ningún fichero**: importe del contrato de Costa del Sol/Málaga, duración de contratos, fechas de firma, ni nombre del organismo firmante en ninguno de los dos casos.

---

### 4. TÓTEMS / SEÑALÉTICA / POS — módulo de producto

- `deliverables/BRAND_BRAIN_DISCOOLVER_2026-08.md:124` — "**Señalética y tótems** | 100 €/mes | Tótems interactivos y sistema de QR por la ciudad" → **CITABLE**
- `deliverables/BRAND_BRAIN_DISCOOLVER_2026-08.md:120` — "**POS / Software de caja** | 495 €/mes + 50 € por punto | Venta en oficinas de turismo, monumentos y puntos físicos" → **CITABLE**
- `investor-brain.json:53` — "Señalética & Totems… Hardware + €100/mes mantenimiento" (menciona **hardware**, que el Brand Brain nuevo omite) → citable con reserva (versión antigua)
- `investor-brain.json:49` · `brand-brain.json:42` · `deliverables/investor-deck-site/index.html:410,477` — mismas tarifas POS
- Copy original de la web antigua: "Soluciones de señalética digital para destinos / Totems y dispositivos digitales / Sistemas de QR" y "Sistema de ventas Oficina y Monumentos (POS)" → `_snapshot/discoolver-com/COPY_B2B_ORIGINAL.md:32, 51-53` → **público** (estuvo en producción)
- "Desplegar 20 puntos QR físicos… **existe el precedente de Ronda y Costa del Sol**" → `…xlsx` → **Playbook ciudad**, fila 38 → interno

---

### 5. NO ENCONTRADO — cero evidencia en ningún fichero

- **Simpleview** — 0 coincidencias en todo el árbol (búsqueda sin filtro de extensión, incluidos `.docx`/`.xlsx`/`.pdf` descomprimidos). No hay ninguna mención, ni como competidor, ni como partner, ni como integración.
- **"Racks"** — 0 coincidencias reales. Todos los hits eran falsos positivos de CSS/JSX (`track`, `tracks`, `track-card`) en `web/`, `app-landing/` y `creators-landing/`.
- **Número exacto de puntos de venta en Costa del Sol/Málaga** — no aparece. Los "ocho puntos de venta" están escritos **solo para Ronda** (`…BRAND_BRAIN…md:167-168`) y en ningún otro fichero.
- **Nombre del interlocutor/firmante** en Ronda o Costa del Sol — no aparece. Las citas de "Director de Turismo de Ronda" en `briefing/index.html:560, 640` son **plantillas con `[Nombre]` sin rellenar**, no testimonios reales.

---

### 6. AVISOS PARA QUIEN USE ESTO

1. **Jerarquía documental**: `deliverables/BRAND_BRAIN_DISCOOLVER_2026-08.md:3` declara "Sustituye a cualquier versión anterior en caso de conflicto". `brand-brain.json`, `investor-brain.json`, `briefing/index.html` y `deliverables/investor-deck-site/index.html` son de julio 2025 y quedan subordinados.
2. **Falso positivo importante**: en `deliverables/investor-deck-site/index.html` líneas 254, 262, 266, 272, 445, 664-671, 731, "Ronda" = **ronda de inversión**, no la ciudad. No confundir.
3. **Testimonios**: `…BRAND_BRAIN…md:228-234` prohíbe publicar testimonios sin persona real y permiso, y sin foto de stock. Todo testimonio de Ronda que hoy figura en `briefing/index.html` es placeholder → **NO publicable**.
4. **Riesgo regulatorio registrado**: `…xlsx` → **Riesgos**, fila 15 marca la prueba social inventada como "el único bloque con riesgo regulatorio real (reseñas y valoraciones inventadas)". Afecta a cualquier reutilización de `briefing/index.html`.
5. **Dato no verificado**: la fila 15 de **Riesgos** afirma "la web antigua en inglés que sirve discoolver.com (**266 menciones de Ronda**)". Contando sobre el snapshot local (`_snapshot/discoolver-com/*.html`, 8 páginas) salen **97**. La cifra de 266 está escrita pero no se puede reproducir con los ficheros disponibles.
6. **Cifras prohibidas** (`…BRAND_BRAIN…md:205-213, 236-241`): nunca publicar usuarios semanales, lista de espera, "500 plazas por ciudad", "120.000 usuarios", "8.742 en lista", "12 ciudades activas". Sí se pueden usar "los datos verificables de Ronda".