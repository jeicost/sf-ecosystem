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
- Frenos de gasto en `lib/ai/budget.ts`, sumando `mira_usage_log` con la clave
  de plataforma: MENSUAL POR MARCA (`MIRA_CLIENT_MONTHLY_BUDGET_USD` 30 $,
  `clients.ai_budget_usd` lo sustituye; GLS 60) que avisa al 80 % y corta todo
  al 100 % (Email Ops encola hasta el día 1), y DIARIO GLOBAL de seguridad
  (`MIRA_DAILY_BUDGET_USD` 100 $). Se activan pasando `route` a
  `getClaudeForClient` (todo `createMessageForClient` lo lleva). El dashboard
  del cliente enseña «consumo / tope» con barra; el Super Admin ve y edita el
  tope por marca. `createMessageForClient` aplica `prepararParams` (techo ×2 y
  esfuerzo en los 5.x) y los modelos salen de `lib/ai/models.ts`
  (`DEFAULT_MODEL`, `CHEAP_MODEL`, `FAST_MODEL`): nunca literales. Con
  pensamiento, `content[0]` no es el texto: `primerTexto`/`textoDe`.
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

## Microsoft 365 (8-oct-2026)

- Conector en `lib/microsoft/` (graph.ts HTTP puro · connections.ts tokens
  cifrados y refresco ROTADO · sync.ts carpetas → `agent_documents` por
  tandas con cola `microsoft_items` e inventario · mail.ts/mail-poll.ts
  buzones por Graph para Email Ops, `source='microsoft'`). Rutas en
  `app/api/integrations/microsoft/*`; cron `/api/cron/microsoft-sync` cada 30
  min. Variables: `MS_OAUTH_CLIENT_ID`, `MS_OAUTH_CLIENT_SECRET`,
  `MS_REDIRECT_URI` (sin ellas, 503 y aviso en la interfaz). Registro de la app
  y texto para el administrador del cliente: `docs/microsoft-365.md`.
- Lector único de ficheros (buffer → texto) en `lib/extract-text.ts`; lo usan
  Drive y Microsoft. Pruebas puras: `npx tsx evals/microsoft/pure.ts`.
- Email Ops: cada buzón vive en SU marca (el de GTD en GTD, el de Albasanz en
  Albasanz). El botón Responder abre mailto y, en el desplegable, Outlook web,
  Gmail y copiar (en GLS el mailto abría un «nuevo Outlook» que no arrancaba).

## Consumo: medir antes de tocar, caché de 1 h, modelo barato donde está probado (8-oct-2026)

- Perfil real por ruta y modelo desde `mira_usage_log` (gratis):
  `npx tsx --env-file=.env.local evals/_scratch/perfil-consumo.ts 30` y la secuencia de una ruta
  (`perfil-secuencia.ts tender/chat 45`) para ver escrituras (cw) frente a lecturas (cr) de caché.
  El 8-oct: 50 $/30 días; el 55 % era tender/chat + email-ops-extract, y en los dos la caché de
  5 min se tiraba (pausas humanas > 5 min; cron cada 10 min).
- Regla: todo prefijo que reutiliza una persona a ritmo humano o un cron de ≥ 5 min va con
  `CACHE_1H` (`lib/ai/models.ts`); `CACHE_5M` solo para bucles de herramientas dentro de un
  mismo mensaje con un system que cambia por turno (brain/chat, documents-guided).
- Modelo por paso, con variable de entorno por delante para volver atrás sin desplegar:
  `TENDER_EXTRACT_MODEL` (Sonnet 5.5, probado contra Opus en 2 pliegos reales); generar,
  reescribir y el chat siguen en Opus 5.5 porque ahí está la calidad que juzga Usoa.
- Cualquier cambio que toque el modelo: UNA pasada real (`evals/email-ops/run.ts` con
  `EVAL_CLIENT_ID` de GTD y de Albasanz, o un script de comparación) y el resto lo juzga
  Claude Code. Los casos GLS de Email Ops están etiquetados con la marca GTD, donde vive el buzón.

## Email Ops: responder desde el buzón del parte (8-oct-2026)

- `lib/email-ops/send.ts`: la respuesta sale por el buzón que recibió el correo
  (SMTP con las credenciales IMAP cifradas, `imap.x` → `smtp.x` 465, copia en
  Enviados por IMAP APPEND; en Microsoft 365 por Graph `createReply`, que exige
  `Mail.Send` y `MS_MAIL_SEND=1` para pedirlo). Fila `direction='outbound'`,
  `status='sent'` en `email_messages`: el pipeline no la toca. Sin modelo.
- MODO PRUEBA por marca: `email_ops_settings.reply_test_to`. Mientras tenga
  dirección, TODO va ahí con asunto «[PRUEBA]» y nota del destino real. Hoy
  apunta a carlos@startupsfactory.es en GTD y Albasanz; se apaga vaciándolo
  en Email Ops → Settings → «Respuestas desde MIRA». Nunca enviar nada real sin
  que Carlos lo decida.

## Memoria comercial: fichas de condiciones por lotes (fase 1 de propuestas, 8-oct-2026)

- `lib/comercial/fichas.ts`: de cada documento de una carpeta Microsoft con
  propósito «commercial» (y de lo que se encole a mano) salen fichas
  estructuradas (cliente, servicio, condiciones con importe/unidad, recargos,
  compromisos, vigencia, resultado) con confianza y cita por campo; lo
  deducido (< 0,95 o sin cita) se marca «revisar». Esquema SIN uniones ni
  anulables (lección del 7-oct); importes como texto → `num()` entiende
  «1.290,50». Modelo `COMERCIAL_FICHAS_MODEL` (Sonnet 5.5) con salida
  estructurada y system cacheado 1 h.
- Va por LOTES (Message Batches API): cola `commercial_extraction_jobs` →
  `submitBatch` (≤ 100 docs, pasa por el freno mensual) → cron
  `/api/cron/comercial-fichas` (:15 y :45) recoge con `collectBatch`; el uso se
  registra con ruta `comercial/fichas:batch` y `sumarGasto` lo cuenta a mitad.
  `extractFichasNow` es la vía directa para pruebas y para «extraer ahora».
- `lib/comercial/comparables.ts`: memoria de precios (mín/mediana/máx/última
  cifra por concepto+unidad) calculada en TS sobre las fichas. Pantalla
  `/comercial/fichas` (herramienta `commercial-memory`, habilitada en las 3
  marcas de Aldea). Pruebas: `npx tsx evals/comercial/pure.ts` (28) y una
  pasada real sobre fixtures INVENTADOS: `evals/comercial/run.ts` (~0,05 $).

