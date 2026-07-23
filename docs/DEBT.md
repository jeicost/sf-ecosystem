# DEBT.md — Deuda técnica de MIRA

Registro honesto de deuda técnica conocida. Última verificación completa: **2026-07-22** (post fase 2). Todas las rutas son relativas a `apps/mira/portal/` salvo que se indique lo contrario. Cada entrada verificada contra el código con grep en la fecha indicada.

---

## ✅ Resuelto (fase 2 — verificado 2026-07-22)

| Deuda | Resolución verificada |
|---|---|
| Fugas BYO Claude (rutas llamando a Anthropic con la key de la plataforma) | 17/17 rutas de `app/api/` usan `createMessageForClient`/`getClaudeForClient`; grep de `new Anthropic`/`anthropic.messages.create` en `app/api/` devuelve 0 resultados |
| **(d)** Mismatch de `redirect_uri` en OAuth Drive | `app/api/brand-brain/drive/authorize/route.ts:26` usa `process.env.GOOGLE_REDIRECT_URI` (fallback al valor del navegador solo si la env no existe), igual que el callback (`callback/route.ts:116,133`) |
| **(b)** Export a Drive solo por Service Account | `app/api/export/google-drive/route.ts:67-98` intenta primero el Drive del cliente (`getClientDriveAccessToken` + `uploadHtmlToClientDrive`, `destination: 'client_drive'`) con fallback al Service Account (L103). Residual: ver deuda nueva **(k)** |
| **(e)** Light mode dependiente del parche `!important` | ~95 ficheros migrados el 2026-07-21/22 — 116 ficheros usan ya clases semánticas (`text-ink`/`bg-card`/`border-line`), quedan 33 con clases dark hardcodeadas. El parche `!important` de `globals.css` **sigue activo como red de seguridad** — su retirada es deuda nueva **(j)** |
| Toolkit sin grounding (generaciones sin datos reales del sitio) | `lib/grounding/` (`site-snapshot`, `seo-checks`, `web-research`, `grounding-contract`) cableado en `app/api/toolkit/generate/route.ts:10-12`; el resultado lleva `result.grounding` (L332). Residual: ver deuda nueva **(m)** |
| Tarjeta Canva con flujo api-key incorrecto | Ahora OAuth 2.0 + PKCE (S256) real: `lib/integrations/oauth-config.ts:61-68` (`pkce: true`), `app/api/integrations/oauth/[tool]/start/route.ts:55-70` genera `code_verifier`/`code_challenge`, el callback lo envía en el exchange. Residual: ver deuda nueva **(l)** |

---

## a) `visual_jobs`: subsistema fantasma

*(Verificado de nuevo 2026-07-22: sigue igual.)* La migración `supabase/migrations/0028_visual_jobs.sql` crea 4 tablas (`visual_jobs` L6, `visual_assets` L33, `visual_feedback` L59, `visual_approvals` L85) con RLS completo — y **ninguna ruta de la app las usa**. Grep de `visual_jobs`/`visual-provider`/`visual-storage`/`visual-refinement` sobre `app/` y `components/` devuelve 0 resultados.

Ficheros huérfanos en `lib/generation/`: `visual-provider.ts`, `mock-visual-provider.ts`, `visual-storage.ts`, `visual-refinement.ts`, `feature-flags.ts`.

**Qué haría falta:** decidir si el pipeline de jobs visuales asíncronos se retoma o se elimina. Si se elimina: borrar los 5 ficheros + migración de drop de las 4 tablas. Si se retoma: cablear rutas `/api/visual-jobs` que hoy no existen.

---

## c) API keys de clientes en claro

*(Verificado de nuevo 2026-07-22: sigue igual.)* `lib/integrations/getClientApiKey.ts:53-55` lee la key desde `tool_connections.metadata.api_key` / `metadata.apiKey` **en texto plano**; L65 deja el TODO explícito: *"If lib/crypto.ts exists, decrypt the key here"* — `lib/crypto.ts` sigue sin existir.

**Qué haría falta:** cifrado at-rest (AES-GCM con key en env, o Supabase Vault), migración de las filas existentes y descifrado en `getClientApiKey`.

---

## f) `StudioArchetype` con proyectos decorativos mock

*(Verificado de nuevo 2026-07-22: sigue igual.)* `components/archetypes/StudioArchetype.tsx:29` define `DEFAULT_PROJECTS` (hardcoded) y `:100` lo usa como default de la prop `projects`. Único caller: `components/archetypes/AgentArchetypeWrapper.tsx:56` — no alimenta proyectos reales.

**Qué haría falta:** alimentar `projects` desde datos reales (p. ej. `quick_actions_results` visuales o `project_memory`) o vaciar el default y mostrar empty state.

---

## g) Prompts de quick actions sin botón + componente muerto

*(Verificado de nuevo 2026-07-22: sigue igual.)*

- `lib/generation/quick-action-prompts.ts:311` (`proyectar_revenue`) y `:403` (`auditar_innovacion`) tienen prompt completo pero **ningún botón** en `components/` ni `app/` los dispara.
- `components/DepartmentQuickActions.tsx` sigue sin importarse desde ningún fichero — código muerto.

**Qué haría falta:** añadir los 2 botones (Finanzas y Strategy respectivamente) o borrar los prompts; borrar `DepartmentQuickActions.tsx`.

---

## h) Pricing de `gpt-image-1` duplicado (ya consistente)

*(Re-verificado 2026-07-22: la **inconsistencia** se corrigió — ambos sitios dicen ahora `in: 5` — pero la **duplicación** sigue.)*

| Sitio | Valor |
|---|---|
| `lib/anthropic-client.ts:80` (`MODEL_PRICING`) | `'gpt-image-1': { in: 5, out: 40 }` |
| `app/api/usage/summary/route.ts:9` (`IMAGE_MODEL_PRICING`) | `'gpt-image-1': { in: 5, out: 40, perImage: 0.04 }` |

Dos fuentes de verdad: cualquier cambio futuro de precio puede volver a divergir.

**Qué haría falta:** un único mapa de pricing exportado (p. ej. `lib/pricing.ts`) consumido por ambos.

---

## j) Retirada del parche `!important` de light mode (nueva 2026-07-22)

`app/globals.css` mantiene ~45 reglas `[data-theme="light"] ... !important` (a partir de L60) como red de seguridad tras la migración masiva a clases semánticas. Quedan **33 ficheros** en `app/`+`components/` con `text-white`/`text-gray-*`/`bg-gray-*` que aún dependen del parche.

**Qué haría falta:** migrar los 33 ficheros restantes, hacer verificación visual completa de todas las pantallas en light mode y, solo entonces, borrar el bloque `!important` de `globals.css`.

---

## k) Conexiones Drive antiguas requieren re-autorización (nueva 2026-07-22)

El authorize de Brand Brain pide ahora `drive.readonly` + `drive.file` (`app/api/brand-brain/drive/authorize/route.ts:82-84`), pero las conexiones creadas **antes** del cambio solo tienen `drive.readonly`: para esos clientes el export al Drive del cliente falla y `app/api/export/google-drive/route.ts:103` cae al fallback de Service Account (carpeta de la plataforma).

**Qué haría falta:** forzar/solicitar re-autorización de las conexiones Drive existentes (o detectar el scope insuficiente y mostrar CTA de reconexión en la UI de integraciones).

---

## l) App de Canva sin registrar para usuarios externos (nueva 2026-07-22)

El flujo OAuth+PKCE está implementado, pero requiere una app registrada en **Canva Developers** y pasar su **review** para que funcione con usuarios externos. Envs necesarias: `NEXT_PUBLIC_CANVA_CLIENT_ID` y `CANVA_CLIENT_SECRET` (`lib/integrations/oauth-config.ts:61-62`; `app/api/export/canva/route.ts:44` falla con mensaje si faltan). El redirect registrado en Canva debe ser **exactamente** `<APP_URL>/api/integrations/oauth/callback`.

**Qué haría falta:** registrar la app en Canva Developers, configurar el redirect exacto, superar la review y poblar las envs en Vercel.

---

## m) Generaciones históricas del toolkit sin grounding (nueva 2026-07-22)

Las generaciones del toolkit anteriores al cableado de `lib/grounding/` siguen en `project_memory` **sin marcar**: no hay forma de distinguirlas de las nuevas salvo por la ausencia de `result_data.grounding` (las nuevas lo llevan siempre — `app/api/toolkit/generate/route.ts:332`).

**Qué haría falta:** decidir si se marcan retroactivamente (backfill con flag `pre_grounding`), se regeneran o simplemente se documenta que ausencia de `result_data.grounding` = generación legacy sin datos reales.

---

## n) ✅ Resuelto — Batch de cambios de prompts aplicado (fase 3, commit `6cc3232`, 2026-07-22)

*(Corregido 2026-07-23: este punto quedó desactualizado — el batch de `docs/PROMPTS_AUDIT_2026_07.md` sección 4 (quick wins Q1-Q5 + medios M1-M5) se aprobó y aplicó en la fase 3. Ver `lib/generation/quick-action-prompts.ts` y `lib/agent-prompts-i18n.ts` en ese commit.)*

Pendiente real: los cambios **grandes** del informe (G4 — i18n completo de los 39 prompts de quick actions/toolkit/documents, G5 — migrar a structured outputs/tool use) siguen sin decisión ni ejecutar.

---

## o) Enforcement de plan roto en dos capas (nueva 2026-07-23)

Verificado durante la auditoría de lanzamiento SaaS: el gating por plan (`lib/plans.ts`) es **cosmético en el frontend Y código muerto en el middleware**.
- `components/section-switcher.tsx` solo pinta un candado visual — ninguna página de `app/(dashboard)/comercial|finanzas|strategy|operations/*` comprueba el plan del usuario; accesibles por URL directa.
- `proxy.ts` SÍ intenta enforcement server-side con un regex (`/^\/(marketing|comercial|estrategia|innovacion|finanzas)(\/|$)/`), pero usa slugs **en español que no existen como rutas reales** — la app usa `strategy`/`operations` en inglés (ver `lib/sections.ts`), y Marketing no tiene un prefijo de ruta común (vive en `/roster`, `/command`, `/approvals`, `/performance`, `/brief`). El regex nunca matchea nada — es enforcement fantasma.

**Qué haría falta:** corregir el regex a los slugs reales (o mejor, un `guardSection(pathname, plan)` compartido usado tanto en `proxy.ts` como en cada `page.tsx` de departamento) — ver Fase 2 del roadmap de lanzamiento (`docs/MIRA-LANZAMIENTO-FASE2.md`), sección "Enforcement real de plan".

---

## p) ✅ Resuelto — `tool_connections`/`affiliate_tracking`/`tool_setup_progress` no existían en producción (descubierto y arreglado 2026-07-23)

Al aplicar la migración `0037_rls_hardening.sql` (RLS de `tool_connections`), Supabase devolvió `relation "tool_connections" does not exist`. Verificado con `information_schema.tables`: las 3 tablas de `supabase/migrations/0010_tool_integrations.sql` **nunca se aplicaron a producción**, pese a estar en el repo desde hace tiempo y ser usadas por código activo (`lib/integrations/getClientApiKey.ts`, `app/api/integrations/tools/route.ts`, `app/api/integrations/affiliate/route.ts`, `lib/integrations/canva.ts`, `app/api/integrations/oauth/callback/route.ts`).

**Impacto real durante todo ese tiempo:** `getClientApiKey.ts:35-46` trata cualquier error de la query (incluido "tabla no existe") igual que "sin clave conectada" — nunca lanza el error, solo `console.error` (invisible sin Sentry) y devuelve `defaultKey`. Resultado: **todas las generaciones con Claude/OpenAI han usado siempre la key de plataforma**, nunca la BYO del cliente, sin ningún error visible. Intentar *conectar* una key desde `/integrations` sí debía fallar de forma visible (el `INSERT` a una tabla inexistente no puede tener éxito silencioso).

**Resuelto:** `supabase/migrations/0038_tool_connections_backfill.sql` (idempotente, `CREATE TABLE/INDEX IF NOT EXISTS`) crea las 3 tablas + activa RLS. Aplicada en prod el 2026-07-23. Verificado con REST que las 3 tablas responden 200.

**Qué haría falta ahora:** probar en vivo que conectar una key BYO (Claude, OpenAI o Canva) desde `/integrations` funciona de principio a fin — nunca se ha podido verificar porque la tabla no existía.
