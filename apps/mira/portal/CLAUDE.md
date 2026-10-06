# MIRA Portal — contexto para Claude Code

## Gate de calidad de informes (Pilar 1.4 del plan de excelencia)

**Ningún cambio a los prompts de `lib/generation/` sale a producción sin pasar
la rúbrica.** No es opcional: en agosto-2026 se midió que los informes «se
generaban bien» y puntuaban 49% de media sin que nadie lo supiera.

```bash
npm run eval:reports                      # línea base sobre todos los informes guardados
npm run eval:report -- --id <queue-uuid>  # un informe concreto
npm run eval:report -- --id <uuid> --judge  # + juez LLM (el cliente escéptico)
```

La rúbrica (`evals/reports/rubric.ts`) puntúa informes YA guardados en
`generation_queue` — mide antes/después sin regenerar, casi todo determinista y
gratis. Tras cambiar un prompt: regenera UN informe de esa herramienta, pásale
`--id` y compara con su nota previa. Referencias de nota: las 7 herramientas
trabajadas en ago-2026 están en 91-100%; por debajo de 80% es regresión.

## Arquitectura de informes (leer antes de tocar prompts)

- `lib/generation/toolkit-prompts.ts` — prompts por herramienta. La palanca de
  calidad medida es el bloque METHOD (no los contratos ni el pipeline): 27-56%
  → 91-100% al añadirlo.
- `lib/grounding/*-contract.ts` — grounding (no inventar) / judgment (no
  esquivar: «unknown» en un campo de juicio = informe fallido) / voice.
- `lib/generation/report-pipeline.ts` — REDACTOR→CRÍTICO→REVISOR. Nunca puede
  empeorar: degrada al borrador. El crítico necesita max_tokens proporcional
  al entregable (8k; con 4k se truncaba criticando 16 captions).
- `lib/generation/monthly-generate.ts` — monthly en 3 fases + crítica de la
  fase 2 + checkpoint por fase en `result_data._checkpoint` (Vercel puede
  matar la función en maxDuration=800; el reintento reanuda, no repaga).
- Patrón anti-esquive de cifras: el modelo CLASIFICA pieza a pieza
  (`is_promo`), TS computa el agregado (`promo_ratio.computed`). Nunca pedirle
  a una fase que cuente el output de otra que no ve.

## Deploy

Desde la RAÍZ del monorepo (Root Directory de Vercel = `apps/mira/portal`;
desde este directorio falla duplicando la ruta):

```bash
VERCEL_ORG_ID=team_7QGpRqqi1FjrJugGLL0sDehf VERCEL_PROJECT_ID=prj_75UXcFgDkNPjJWKtPMu9o2XijCjL vercel --prod
```

Alias real: https://mira.startupsfactory.es

## Scratch

`evals/_scratch/` está en .gitignore — scripts de un solo uso y volcados de
sesión. No committear; no asumir que sobrevive.

## ⚠️ Créditos: Claude Code sí, Claude Platform solo para el producto

**Modelo de trabajo (Carlos, 01-sep-2026, para todos los proyectos):**
trabajando desde Claude Code **no se gastan créditos de Claude Platform**
(la clave de API del proyecto). Es pagar dos veces por el mismo razonamiento.

- ¿Probar si un prompt produce buen resultado, comparar tonos, evaluar
  calidad, diagnosticar? **Lo escribe y lo juzga Claude Code**, leyendo el
  prompt real del repo. Solo cuando convence, se corre una vez en Platform.
- ¿Prueba de integración del producto en su interfaz, o proceso masivo de
  producción (extraer miles de posts, escribir cientos de fichas)? Ahí sí
  Platform — con Batches API cuando aplique (50%).
- Regla de bolsillo: si el resultado lo va a leer un humano para DECIDIR, lo
  produce Claude Code; si lo consume el producto o el cliente, va por Platform.

El saldo de Platform se agotó dos veces (30-ago y 01-sep) bloqueando trabajo
real de producción. Esto lo evita.

## Modelos, freno de gasto y Word de Licitaciones (6-oct-2026)

- Modelos en `lib/ai/models.ts`, con variable de entorno por delante:
  `TENDER_MODEL` (claude-opus-5-5), `TENDER_EFFORT` (medium), `CHEAP_MODEL`
  (claude-sonnet-5-5), `EMAIL_OPS_MODEL` (claude-sonnet-5-5). Los 5.x piensan
  siempre y rechazan `tool_choice` forzado: Email Ops usa salida estructurada
  (`output_config.format`) y `createMessageForClient` hace streaming por dentro
  para que el techo de salida (`techoSalida`) no dispare timeouts. Si un modelo
  falla en prod, se cambia la variable en Vercel, sin desplegar.
- Freno de gasto diario en `lib/ai/budget.ts` (`MIRA_DAILY_BUDGET_USD`, 30 $
  por defecto): suma `mira_usage_log` de hoy (Madrid) con la clave de
  plataforma; corta las rutas normales al 80 % (reserva de Email Ops) y Email
  Ops al 100 %; al 80 % deja una huella `ai-budget` en `mira_activity`. Se
  activa pasando `route` a `getClaudeForClient` (todo `createMessageForClient`
  lo lleva). El panel Super Admin enseña el gasto de hoy.
- Word de Licitaciones (`lib/tenders/word.ts`): si la marca subió su HOJA
  oficial (.docx) en «Word template», la cabecera y el pie se trasplantan tal
  cual (`lib/tenders/membrete.ts`), con sus márgenes y su fuente. Las PÁGINAS
  CON DISEÑO PROPIO (`lib/tenders/disenadas.ts`, tabla
  `tender_brand_sections`) se marcan en el texto como `[[DISEÑO:id]]`; el
  modelo marca, TS valida, el Word inserta (página a sangre en sección propia
  sin membrete, o figura). El texto se maqueta (`parseBloques`: subtítulos,
  listas, tablas con barras, `[FALTA: …]` resaltado). Sin LibreOffice ni Word
  en la máquina: comprobar con `evals/_scratch/word-hoja.ts` (XML estricto +
  mammoth) y, para paginación, un render con LibreOffice portable.
