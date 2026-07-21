# DEBT.md — Deuda técnica de MIRA

Registro honesto de deuda técnica conocida a **2026-07-21**. Todas las rutas son relativas a `apps/mira/portal/` salvo que se indique lo contrario. Cada entrada verificada contra el código con grep en la fecha indicada.

---

## a) `visual_jobs`: subsistema fantasma

La migración `supabase/migrations/0028_visual_jobs.sql` crea 4 tablas (`visual_jobs` L6, `visual_assets` L33, `visual_feedback` L59, `visual_approvals` L85) con RLS completo — y **ninguna ruta de la app las usa**. Grep de `visual_jobs` sobre `app/`, `lib/` y `components/` solo devuelve la propia migración.

Ficheros huérfanos en `lib/generation/`:

| Fichero | Estado |
|---|---|
| `lib/generation/visual-provider.ts` | Sin imports fuera de la carpeta |
| `lib/generation/mock-visual-provider.ts` | Único consumidor de `visual-provider` (mock de sí mismo) |
| `lib/generation/visual-storage.ts` | Sin imports |
| `lib/generation/visual-refinement.ts` | Sin imports |
| `lib/generation/feature-flags.ts` | Sin imports |

Los únicos módulos de `lib/generation/` que sí se usan desde rutas: `document-prompts`, `openai-image`, `quick-action-prompts`, `toolkit-prompts` (verificado: `app/api/documents/generate/route.ts:6,8`, `app/api/quick-actions/route.ts:4-5`, `app/api/toolkit/generate*/route.ts`).

**Qué haría falta:** decidir si el pipeline de jobs visuales asíncronos se retoma o se elimina. Si se elimina: borrar los 5 ficheros + migración de drop de las 4 tablas. Si se retoma: cablear rutas `/api/visual-jobs` que hoy no existen.

---

## b) Dos integraciones de Google Drive desacopladas

1. **Lectura (Brand Brain)** — OAuth **por cliente**: `app/api/brand-brain/drive/{authorize,callback,folders,ingest}/route.ts`. Tokens del cliente, lee su Drive.
2. **Export** — **Service Account global**: `lib/google-drive.ts:16-46` (`GOOGLE_SERVICE_ACCOUNT_KEY` + `GOOGLE_DRIVE_FOLDER_ID`), usada por `app/api/export/google-drive/route.ts`. El export va a una **carpeta de la plataforma** (`parents: [GOOGLE_DRIVE_FOLDER_ID]`, `lib/google-drive.ts:46`), no al Drive del cliente.

**Qué haría falta:** decisión de producto pendiente — migrar el export para que use el token OAuth del cliente (integración 1) y escriba en su propio Drive, o documentar la carpeta compartida como comportamiento intencional.

---

## c) API keys de clientes en claro

`lib/integrations/getClientApiKey.ts:52-55` lee la key desde `tool_connections.metadata.api_key` / `metadata.apiKey` **en texto plano**; `lib/integrations/getClientApiKey.ts:65` deja el TODO explícito: *"If lib/crypto.ts exists, decrypt the key here"* — `lib/crypto.ts` no existe.

**Qué haría falta:** cifrado at-rest (AES-GCM con key en env, o Supabase Vault), migración de las filas existentes y descifrado en `getClientApiKey`.

---

## d) Mismatch potencial de `redirect_uri` en OAuth de Drive (Brand Brain)

- **Authorize:** el frontend envía el origin del navegador — `app/(dashboard)/integrations/page.tsx:81`: `redirectUrl: \`${window.location.origin}/api/brand-brain/drive/callback\`` — y `app/api/brand-brain/drive/authorize/route.ts:80` lo pasa tal cual como `redirect_uri`.
- **Callback (token exchange):** `app/api/brand-brain/drive/callback/route.ts:116,133` usa `process.env.GOOGLE_REDIRECT_URI`.

Si el usuario entra por un dominio distinto al configurado en la env (preview deploys, `www` vs apex), Google rechaza el exchange con `redirect_uri_mismatch`.

**Qué haría falta:** derivar ambos del mismo sitio — construir `redirect_uri` en servidor en los dos puntos (env o `req.nextUrl.origin` canónico), nunca del navegador.

---

## e) Light mode: dependencia del parche `!important` de globals.css

`app/globals.css` contiene ~45 reglas `[data-theme="light"] ... !important` (a partir de L62) que sobrescriben clases dark hardcodeadas. Los ~40 ficheros prioritarios ya migraron hoy (2026-07-21) a clases semánticas (`text-ink` / `bg-card` / `border-line`; 34 ficheros las usan ya), pero **~100-110 ficheros** de `app/` + `components/` siguen usando `text-white`/`text-gray-*`/`bg-gray-*`/`bg-white` y dependen del parche.

**Qué haría falta:** migración incremental del resto a las clases semánticas y, al terminar, borrar el bloque `!important` de `globals.css`.

---

## f) `StudioArchetype` con proyectos decorativos mock

`components/archetypes/StudioArchetype.tsx:29` define `DEFAULT_PROJECTS` (hardcoded: "May Campaign Social Post", "Product Launch Teaser", "YouTube Thumbnail Draft"…) y `:100` lo usa como default de la prop `projects`. Ningún caller pasa proyectos reales — la UI muestra datos falsos.

**Qué haría falta:** alimentar `projects` desde datos reales (p. ej. `quick_actions_results` visuales o `project_memory`) o vaciar el default y mostrar empty state.

---

## g) Prompts de quick actions sin botón + componente muerto

- `lib/generation/quick-action-prompts.ts:311` (`proyectar_revenue`) y `:403` (`auditar_innovacion`) tienen prompt completo pero **ningún botón** en `components/quick-actions/*.tsx` los dispara.
- `components/DepartmentQuickActions.tsx` no está importado por ningún fichero — código muerto (los 5 componentes por departamento en `components/quick-actions/` lo reemplazaron).

**Qué haría falta:** añadir los 2 botones (Finanzas y Strategy respectivamente) o borrar los prompts; borrar `DepartmentQuickActions.tsx`.

---

## h) Pricing de `gpt-image-1` duplicado (e inconsistente)

| Sitio | Valor |
|---|---|
| `lib/anthropic-client.ts:76-80` (`MODEL_PRICING`) | `'gpt-image-1': { in: 10, out: 40 }` |
| `app/api/usage/summary/route.ts:8-9` (`IMAGE_MODEL_PRICING`) | `'gpt-image-1': { in: 5, out: 40, perImage: 0.04 }` |

Dos fuentes de verdad con precio de input distinto (10 vs 5 $/Mtok): el coste registrado y el mostrado en el summary pueden divergir.

**Qué haría falta:** un único mapa de pricing exportado (p. ej. en `lib/pricing.ts`) consumido por ambos; verificar contra el pricing real de OpenAI cuál es el correcto.
