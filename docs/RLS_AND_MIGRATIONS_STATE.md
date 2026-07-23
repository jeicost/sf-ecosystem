# MIRA — Estado real de RLS y migraciones en Supabase

> Auditoría 2026-07-23. Alcance: `apps/mira/portal/supabase/migrations/*.sql` (37 ficheros, 0009→0042) contra el proyecto Supabase compartido `nnevhtfxuawexliwlbmh`. Fuente: lectura completa de `docs/DEBT.md` + lectura de las 37 migraciones (cercana en las señaladas como críticas). Cierra el punto de la Fase 2 "Consolidar migraciones y documentar el estado real de RLS de toda la BD".
>
> **Principio de esta auditoría**: el archivo `.sql` describe una *intención*, no el estado vivo. Las tres incidencias de abajo son casos confirmados en producción donde intención y realidad llevaban semanas o meses divergiendo en silencio. El resto del documento trata cada tabla con el mismo escepticismo: "RLS activo + política encontrada" se marca explícitamente distinto de "asumido correcto".

---

## 1. Incidencias encontradas y corregidas esta sesión

### (a) `mira_project_access` bloqueaba en silencio a todo usuario real no-admin

La política propia de `mira_project_access` — `"mira_project_access: users see own"`, que no coincide con ningún nombre de política de ningún fichero de migración, es decir fue editada directamente en el Dashboard de Supabase en algún momento no documentado — resolvía `user_id` vía `SELECT mira_users.id FROM mira_users WHERE mira_users.auth_id = auth.uid()`. La migración `0016_unify_auth_users.sql:8-14` había dejado ese puente obsoleto al cambiar la FK de `mira_project_access.user_id` para apuntar directamente a `auth.users(id)`, pero la política nunca se actualizó para dejar de depender de `mira_users`. Con `mira_users` en 0 filas, solo la cuenta con `user_metadata.plan = 'admin'` pasaba la política alguna vez; las otras 4 cuentas de cliente reales llevaban bloqueadas desde que la política existe, y por cascada (las subconsultas de otras tablas contra `mira_project_access` se evalúan bajo el RLS del propio usuario) arrastraba a cualquier tabla cuya política dependiera de `mira_project_access`. Corregido en `0040_fix_mira_project_access_rls.sql:23-29` con `ALTER POLICY` sustituyendo la subconsulta muerta por `user_id = auth.uid()` directo.

### (b) `tool_connections`/`affiliate_tracking`/`tool_setup_progress` con FK a la tabla equivocada

Las 3 tablas de `0010_tool_integrations.sql:6,23,36` (nunca aplicadas a producción — ver incidencia previa `p` en `docs/DEBT.md`, backfilladas en `0038_tool_connections_backfill.sql:16,32,44`) declaraban `client_id REFERENCES brand_profiles(id)`. Pero `brand_profiles` tiene su propia PK independiente (`brand_profiles.id`, `gen_random_uuid()` — ver `0015_fase1_recovery_schema.sql:200`); el vínculo real al cliente vive en `brand_profiles.client_id`, una columna aparte. Todo el código de la app pasa siempre `clientId = clients.id` (el mismo id que usan `leads`, `icp_profiles`, `mira_project_access`, etc.), que nunca coincide con `brand_profiles.id` — con las 3 tablas vacías en producción, la página `/integrations` nunca había funcionado para ningún cliente real. Corregido en `0041_fix_tool_connections_fk.sql:21-34` (FK apuntando a `clients(id)` directo) más el ajuste de política RLS que ese cambio de FK invalidaba (`0041_fix_tool_connections_fk.sql:43-48`, simplificada al patrón estándar de 1 salto).

### (c) `usage_log` de MIRA nunca escribió una fila — colisión de nombre con `apps/sf-sales-engine`

`apps/sf-sales-engine` comparte el mismo proyecto Supabase (`nnevhtfxuawexliwlbmh`) y ya tenía su propia tabla `usage_log` (`apps/sf-sales-engine/supabase/migrations/003_data_pipeline.sql:15`, columnas `source`/`records_fetched`/`api_cost_usd`/`run_id`, escrita activamente por el pipeline de enrichment de Apollo/Hunter/Tavily). La migración de MIRA `0033_usage_log.sql:4` (`CREATE TABLE IF NOT EXISTS usage_log`) era un no-op silencioso desde el día en que se escribió porque la tabla ya existía con otro dueño y un esquema incompatible (sin `route`/`model`/`input_tokens`/`output_tokens`/`used_client_key`) — cada insert de MIRA fallaba con `PGRST204`, tragado en silencio por el manejo de errores de `logUsage()`. Corregido en `0042_mira_usage_log.sql:18-27`: tabla nueva `mira_usage_log` con el esquema propio de MIRA, sin tocar la `usage_log` de sf-sales-engine; los 4 sitios de MIRA que la referenciaban repuntados a `mira_usage_log`.

**Nota de alcance no resuelta esta sesión**: `0033_usage_log.sql:17-24` sigue en el histórico ejecutando `ALTER TABLE usage_log ENABLE ROW LEVEL SECURITY` + `CREATE POLICY ... USING (client_id IN (...))` contra lo que en producción es la tabla de sf-sales-engine, que no tiene columna `client_id`. No se ha verificado en vivo si esas dos sentencias fallaron al aplicarse (columna inexistente → error) o si nunca se llegaron a ejecutar manualmente. No se toca `0033` en esta auditoría (es solo documentación) — queda como pregunta abierta para quien revise el SQL Editor de sf-sales-engine.

### (d) `approval_queue`/`post_history`/`alerts`/`agent_interactions` sin RLS — confirmado explotable con datos reales

Encontrado al escribir este documento (sección 4 original), verificado en vivo antes de aplicar ningún fix: un usuario de prueba con grant *solo* sobre un cliente pudo leer una fila real de `agent_interactions` de **otro cliente real** (Dadybox) filtrando simplemente por `client_id` — sin bloqueo alguno. `approval_queue`/`alerts` devolvían filas sin ningún filtro de tenant en absoluto. Corregido con `0045_rls_missing_tables.sql` (patrón estándar, `ENABLE ROW LEVEL SECURITY` + política de 1 salto) para las 4 tablas.

Al aplicar el fix, `agent_interactions` **seguía filtrando datos entre clientes** pese a la política nueva — investigado en vivo vía Dashboard: la tabla tenía 2 políticas adicionales, `agent_interactions_select_public` (`USING (true)`) y `agent_interactions_insert_public` (`WITH CHECK (true)`), **ninguna de las dos presente en ningún fichero de migración** — creadas a mano en el Dashboard, exactamente el mismo patrón que la incidencia (a) de esta mañana (`mira_project_access`). Como las políticas permisivas del mismo comando se combinan con `OR`, la política nueva y correcta convivía con una completamente abierta que la anulaba. Confirmado que la ruta real de la app (`app/api/agent-interactions/route.ts:33,79-80`) usa `adminClient()` (service role, bypassa RLS) tanto para leer como escribir, así que las 2 políticas `_public` no tenían ningún propósito legítimo — pura superficie de ataque. Ambas eliminadas (`DROP POLICY`) el 2026-07-24, verificado en vivo: lectura cruzada bloqueada, inserción cruzada bloqueada (`new row violates row-level security policy`), lectura del propio cliente intacta.

**Lección añadida a la sección 2**: una auditoría basada solo en `grep` sobre los ficheros `.sql` de migración **no puede ver** políticas creadas directamente en el Dashboard de Supabase que nunca se versionaron — ni para detectar que faltan (incidencia a, esta mañana) ni para detectar que sobran y son peligrosamente permisivas (esta incidencia). La única fuente de verdad real es una consulta en vivo contra `pg_policies` (o la vista de Policies del Dashboard) tabla por tabla, no el histórico de migraciones. Este documento describe lo que los ficheros dicen que debería existir — no sustituye una auditoría en vivo periódica del estado real.

---

## 2. Lección general / patrón raíz

Las tres incidencias comparten forma:

1. **La migración se escribe y aplica sin verificar el estado vivo primero.** `CREATE TABLE IF NOT EXISTS` y `ALTER ... IF EXISTS` están pensados para ser idempotentes ante *re-ejecución de la misma migración*, no para protegerte de que la tabla ya exista **con otro dueño y otro esquema** (caso c), o de que una FK apunte a la columna equivocada porque nadie confirmó cuál era la PK real de la tabla referenciada (caso b), o de que una política fue editada a mano en el Dashboard y el fichero de migración nunca se enteró (caso a). El propio histórico de migraciones lo admite explícitamente: `0031_baseline_missing_tables.sql:1-20` es una migración "documental, NO EJECUTAR" escrita para registrar por introspección REST tablas (`mira_projects`, `drive_connections`, `mira_users`, `icp_profiles`, `agent_sessions`, `mira_clients`...) que el código usa pero que no tenían — ni tienen hoy — ningún `CREATE TABLE` versionado; dos de ellas (`agent_sessions`, `mira_clients`) ni siquiera existen en producción pese a estar referenciadas desde código real.
2. **Tres apps (MIRA, sf-crm, sf-sales-engine) comparten un único proyecto Supabase** (`nnevhtfxuawexliwlbmh` — ver `docs/SUPABASE_CONFIG.md` y la sección Supabase de `CLAUDE.md`) **sin convención de nombres que separe sus tablas.** `usage_log` (caso c) es el ejemplo confirmado, pero no es aislado: sf-sales-engine también tiene su propia `CREATE TABLE leads` (`apps/sf-sales-engine/supabase/migrations/002_leads_pipeline.sql:6`) — en ese caso el solape es *intencional y correcto* (MIRA y sf-sales-engine comparten físicamente la misma tabla `leads`, es el puente real de `promoteLeadToCrm`; `docs/DEBT.md` punto (v) confirma que 160/161 filas llevan el `client_id` sentinel de sf-sales-engine) pero demuestra que ambos equipos han elegido nombres genéricos por defecto sin consultarse, y solo la suerte (mismo propósito conceptual) evitó que `leads` fuera la cuarta colisión accidental en vez de un puente funcional.
3. **Ejemplo adicional del mismo patrón, encontrado al escribir este documento**: `0027_oauth_sessions.sql:11` declaraba `client_id ... REFERENCES public.mira_clients(id)` — una tabla que nunca ha existido en producción (confirmado en `0031_baseline_missing_tables.sql:18-20` y en el propio comentario de `0036_project_deliverables_and_oauth.sql:10`: *"oauth_sessions — la 0027 nunca se aplicó (FK a mira_clients, tabla inexistente)"*). La tabla real se creó cinco migraciones después, en `0036_project_deliverables_and_oauth.sql:12-20`, con la FK correcta a `clients(id)`. Mismo patrón que (a)/(b): una migración se escribió contra una suposición del esquema que nunca fue cierta, y nadie lo notó hasta que algo dependía de ella funcionando.
4. **Documentación desconectada de la realidad, no solo migraciones.** `docs/RLS_POLICIES.md` (preexistente, no tocado en esta sesión) afirma "✅ NO GAPS IDENTIFIED" y documenta tablas de MIRA como `design_templates`, `mira_settings`, `mira_sections`, `agent_prompt_versions`, `mira_subscriptions` con el patrón de scoping `client_id = (auth.jwt() -> 'user_metadata' ->> 'client_id')::UUID` — ninguna de esas tablas ni ese patrón existen en `apps/mira/portal/supabase/migrations/`. Ese documento describe en realidad `scripts/migrations/04_mira-schema.sql` (confirmado: `mira_users`, `clients`, `brand_profiles`, `content_pillars`, `reference_library`, `post_history`, `tool_runs`, `sections`, `usage_log`, `mira_subscriptions` en ese orden — L23-137), un diseño de esquema alternativo que **nunca se aplicó a producción** (ver `docs/MIRA-LANZAMIENTO-FASE2.md:14`: *"tabla `mira_subscriptions` pero en un schema muerto (`scripts/migrations/04_mira-schema.sql`) no usado por la app real"*). Es decir: el único documento que existía antes de este, cuyo propósito explícito era ser "el source of truth de RLS", auditaba un esquema abandonado en vez del real — la misma clase de divergencia que los 3 incidentes de arriba, pero en la documentación en vez del código. Este documento nuevo debería tratarse como la referencia vigente; `docs/RLS_POLICIES.md` queda desactualizado y no se ha corregido (fuera de alcance de esta tarea, que es solo documentación nueva, no edición de otra existente).

**Conclusión práctica**: ninguna migración futura debería asumirse aplicada, ni ninguna política asumida correcta, sin una consulta de verificación contra `information_schema`/`pg_policies` en el Dashboard real antes y después de aplicarla — exactamente el método que destapó las 3 incidencias de este informe.

---

## 3. Convención de nombres recomendada (a partir de ahora)

Con 3 apps compartiendo `nnevhtfxuawexliwlbmh` sin aislamiento de esquema (`public` para las tres — ver `docs/SUPABASE_CONFIG.md`), se propone:

1. **Toda tabla nueva específica de MIRA que no sea ya inequívoca por nombre debe llevar prefijo `mira_`** (patrón que ya existe de facto en `mira_project_access`, `mira_projects`, `mira_usage_log`, `mira_users` — extenderlo también a nombres hoy genéricos como `usage_log` fue exactamente lo que arregló el incidente (c)). No hace falta re-prefijar tablas genéricas ya en producción con datos reales y sin colisión activa (`clients`, `brand_profiles`, `leads` intencionalmente compartida, etc.) — el coste de migrar datos/código no compensa frente al riesgo real.
2. **Antes de nombrar una tabla nueva, `grep -ri "CREATE TABLE.*<nombre_propuesto>"` contra `apps/sf-crm/` y `apps/sf-sales-engine/supabase/migrations/`** (los otros dos consumidores del mismo proyecto) además de contra las propias migraciones de MIRA. Es una comprobación de 10 segundos que habría detectado el incidente (c) antes de escribir la migración, no después de descubrir que las inserciones fallaban.
3. **Cualquier FK a una tabla fuera de las migraciones propias de MIRA (p. ej. a algo que solo existe por introspección, como `mira_projects`/`drive_connections`/`mira_users` hoy — ver tabla de la sección 4) debe verificarse con una consulta real a `information_schema.columns` en el Dashboard antes de escribir el `REFERENCES`**, no asumirse por el nombre de la columna en otro sitio del código (exactamente el fallo del incidente (b): se asumió `brand_profiles.id` == `clients.id` sin comprobarlo).

---

## 4. Cobertura RLS completa — todas las tablas de `apps/mira/portal/supabase/migrations/*.sql`

Patrón estándar (el correcto, usado ya por `leads`/`mira_projects`/`drive_connections`/`tool_connections`/`mira_usage_log`):
```sql
client_id IN (SELECT project_id FROM mira_project_access WHERE user_id = auth.uid())
OR (auth.jwt() -> 'user_metadata' ->> 'plan') = 'super_admin'
```

Nota de lectura: varias políticas antiguas (0013-0023) están escritas en el fichero como `SELECT client_id FROM mira_project_access ...` — ese nombre de columna es el que tenía la tabla antes de `0025_rename_mira_project_access_column.sql:13` (`client_id` → `project_id`). Postgres reescribe automáticamente las políticas dependientes al renombrar una columna (mismo `attnum`, no texto literal), así que estas políticas **siguen funcionando hoy** contra `project_id` aunque el texto del fichero diga `client_id` — es un desfase de legibilidad entre fichero y estado vivo, no un bug activo. Se marca igualmente como "patrón antiguo" abajo para que quien lea el `.sql` no se confunda.

### Núcleo multi-tenant

| Tabla | Creada en | RLS | Política | Estado |
|---|---|---|---|---|
| `mira_project_access` | `0014_mira_project_access.sql:7` | ON (`0014:23`) | Auto-referencial (es la fuente del patrón estándar); original `0014:27-42` (`auth.uid()=user_id` + admin), sobrescrita a mano en Dashboard con un puente muerto a `mira_users`, corregida `0040:23-29` | ✅ Corregido esta sesión (incidencia a) |
| `clients` | ya existente antes del histórico de migraciones; `CREATE TABLE IF NOT EXISTS` defensivo en `0019_brand_brain_fixes.sql:176-180` | ON (`0026_clients_rls.sql:4`) | `0026:7-14` lectura vía `project_id FROM mira_project_access` (estándar) + `0026:17-21` super_admin ve todo + `0026:24-26` cualquier autenticado puede INSERT + `0026:29-33` solo super_admin puede UPDATE | Variante razonable (no hay UPDATE de owner/editor, solo super_admin) — no es el patrón estándar de 1 política combinada pero cubre los mismos casos con más granularidad |

### Tablas sin `CREATE TABLE` en ningún fichero de migración (origen no documentado)

| Tabla | Evidencia | RLS | Política | Estado |
|---|---|---|---|---|
| `mira_projects` | Solo `ALTER TABLE` (`0029_projects_and_documents.sql:10-11` añade `client_id`); confirmado sin DDL conocido en `0031_baseline_missing_tables.sql:16` ("vacía") | ON (`0037_rls_hardening.sql:19`) | `0037:20-25` — **patrón estándar** ✓ | ⚠️ Needs review: tabla protegida por RLS estándar pero su esquema completo nunca quedó versionado |
| `drive_connections` | Solo `ALTER TABLE` (`0030_drive_folders.sql:8` añade `is_authorized`; `0032_drive_flow_schema_fixes.sql:11-12` hace `folder_id`/`folder_name` nullable); confirmado sin DDL conocido en `0031:16` | ON (`0037:28`) | `0037:29-34` — **patrón estándar** ✓ | ⚠️ Needs review: mismo caso que `mira_projects` |
| `mira_users` | Solo `ALTER`/referencias (`0012_role_tier_whitelabel.sql:5` añade `role`; FK desde `0009`, `0011` x2); confirmado 0 filas y deprecada desde `0016_unify_auth_users.sql:7-9,16-17` | **No se encontró ningún `ENABLE ROW LEVEL SECURITY` para esta tabla** | — | ⚠️ Needs review: tabla deprecada, 0 filas, sin RLS documentado, todavía referenciada por FK desde `storage_limits`/`user_project_status` (ver abajo) |

### Toolkit / generación / quick actions

| Tabla | Creada en | RLS | Política | Estado |
|---|---|---|---|---|
| `generation_queue` | `0013:5`, recreada (DROP+CREATE) en `0015_fase1_recovery_schema.sql:19` (autoritativa) | ON (`0015:50`) | `0015:52-66` — solo SELECT/INSERT, forma invertida `auth.uid() IN (SELECT user_id FROM mira_project_access WHERE client_id = generation_queue.client_id)`, sin cláusula `OR super_admin` | ⚠️ Needs review: patrón distinto al estándar (funciona, pero sin override de admin; sin política UPDATE/DELETE) |
| `deliverables` | `0013_toolkit_generation_system.sql:31` | ON (`0013:92`) | `0013:114-128` — misma forma invertida, solo SELECT/UPDATE, sin admin override | ⚠️ Needs review: mismo patrón distinto |
| `generation_feedback` | `0013:51` | ON (`0013:93`) | `0013:131-143` — INSERT por `auth.uid()=user_id`; SELECT vía subconsulta anidada a `deliverables`→`mira_project_access` | Patrón distinto (anidado), sin admin override |
| `generation_revisions` | `0013:62` | ON (`0013:94`) | `0013:145-154` — solo INSERT (subconsulta anidada); **no hay política SELECT/UPDATE/DELETE** | ⚠️ Needs review: sin política de lectura propia — cualquier lectura desde el navegador con anon+sesión devolvería 0 filas siempre, salvo que la app solo lea esto vía service role |
| `quick_actions_results` | `0013:221`, recreada en `0015:69` (autoritativa) | ON (`0015:96`) | `0015:98-120` — patrón antiguo (`client_id FROM mira_project_access`, ver nota de lectura arriba), sin admin override | Patrón antiguo funcional, sin admin override. Nota: el `CHECK` de `department` en `0015:73` ya incluía `'admin'` en el fichero, pero `0039_quick_actions_finanzas_dept.sql:1-4` confirma que la producción real **no** lo tenía — mismo patrón fichero-vs-vivo que las 3 incidencias de la sección 1, solo que sobre un `CHECK` en vez de una política RLS |

### Brand Brain / documentos / memoria

| Tabla | Creada en | RLS | Política | Estado |
|---|---|---|---|---|
| `client_documentation` | `0015:123` | ON (`0015:157`) | `0015:159-183` — patrón antiguo + chequeo de rol (`role IN ('admin','editor')`), sin admin override global | Patrón antiguo funcional, granularidad extra por rol |
| `brand_profiles` | `0015:199` | ON (`0015:213`) | `0015:215-229` (solo SELECT/UPDATE), reescrita igual en `0018_brand_brain_expansion.sql:108-116` | Patrón antiguo, sin admin override, sin política INSERT/DELETE explícita |
| `content_pillars` | `0015:245` | ON (`0015:258`) | `0015:260-274` | Patrón antiguo, sin admin override |
| `agent_activity` | `0015:290` | ON (`0015:306`) | `0015:308-322` (SELECT/INSERT) | Patrón antiguo, sin admin override |
| `brand_documents` | `0018:38`, re-creada condicionalmente en `0019_brand_brain_fixes.sql:114` (`DO $$ ... IF NOT EXISTS column check`, con `EXCEPTION WHEN OTHERS THEN NULL` que traga cualquier error) | ON (`0018:80` / `0019:144`) | `0018:83-105` / `0019:146-168` — patrón antiguo + chequeo de rol | Patrón antiguo funcional |
| `project_memory` | `0017_project_memory.sql:6` | ON (`0017:28`) | Original `0017:30-51` (ya usaba `project_id`, entonces roto — ver `0024:1-8`); corregido `0024_fix_rls_project_id_column.sql:76-92` | Corregido, patrón antiguo (`client_id` en el texto de `0024`, reescrito a `project_id` por Postgres tras `0025`), sin admin override |
| `agent_documents` | `0022_agent_documents.sql:5` | ON (`0022:38`) | Original `0022:41-84` (usaba `project_id`, roto en ese momento — ver `0024:1-21`); corregido `0024:14-39` | Corregido y funcional hoy, sin admin override. Columna `source_metadata` añadida sin cambios de RLS en `0032_drive_flow_schema_fixes.sql:16` |
| `agent_settings` | Creada en `0019_brand_brain_fixes.sql:31`, **recreada** (`CREATE TABLE` sin `IF NOT EXISTS`, ver nota) en `0023_agent_settings.sql:4` | ON (`0019:42` y `0023:18`) | `0019:44-67` (3 políticas, nombre distinto) **y** `0023:20-60` (4 políticas, nombre distinto) coexisten; `0024:45-70` corrigió solo las 3 de `0023` (view/update/delete) dejando el INSERT de `0023:44-51` y las 3 de `0019` sin tocar | ⚠️ Needs review: 7 políticas activas en total sobre la misma tabla (múltiples permisivas se combinan con OR, así que no bloquea nada, pero es deuda de limpieza — dos generaciones de políticas nunca consolidadas) |

### Herramientas / integraciones / uso

| Tabla | Creada en | RLS | Política | Estado |
|---|---|---|---|---|
| `tool_connections` | `0010_tool_integrations.sql:4` (nunca aplicada), backfillada `0038_tool_connections_backfill.sql:14` | ON (`0038:60`) | `0038:61-69` (join de 2 saltos, roto por FK) → corregida `0041_fix_tool_connections_fk.sql:44-48` (**patrón estándar** ✓) | ✅ Corregido esta sesión (incidencia b) |
| `affiliate_tracking` | `0010:21` / `0038:30` | ON (`0038:73`) | `0038:74-76` — `USING (false) WITH CHECK (false)`, deny-all | Patrón distinto, intencional (solo `adminClient()` server-side) |
| `tool_setup_progress` | `0010:34` / `0038:42` | ON (`0038:78`) | `0038:79-81` — deny-all | Patrón distinto, intencional |
| `oauth_sessions` | `0027_oauth_sessions.sql:2` (FK a `mira_clients`, nunca aplicada), real en `0036_project_deliverables_and_oauth.sql:12` | ON (`0027:19` / `0036:23`) | `0027:22-25` / `0036:24-28` — deny-all | Patrón distinto, intencional. `0027` es un ejemplo más del patrón raíz (sección 2, punto 3) |
| `usage_log` (intento de MIRA) | `0033_usage_log.sql:4` — no-op en prod, colisión con tabla homónima de sf-sales-engine | ON en el fichero (`0033:17`) | `0033:20-24` — **patrón estándar** en el texto, pero contra una tabla ajena | ⚠️ Ver nota de alcance no resuelta en la sección 1 (incidencia c) — reemplazada por `mira_usage_log` |
| `mira_usage_log` | `0042_mira_usage_log.sql:18` | ON (`0042:31`) | `0042:33-37` — **patrón estándar** ✓ | ✅ Correcto (sustituye a `usage_log`) |
| `drive_folders` | `0030_drive_folders.sql:10` | ON (`0030:26`) | `0030:28-32` — **patrón estándar** ✓ | ✅ Correcto |
| `client_workspaces` | `0034_client_workspaces.sql:9` | ON (`0034:14`) | `0034:18-22` — **patrón estándar** ✓ | ✅ Correcto |
| `storage_limits` | `0011_storage_limits.sql:4` (FK a `mira_users(id)` — deprecada/0 filas — y `mira_projects(id)` — sin DDL propio) | ON (`0011:35`) | `0011:39-42` — `FOR ALL USING (plan='super_admin')`, sin acceso de cliente en absoluto | ⚠️ Needs review: patrón distinto (admin-only) + FK a `mira_users` deprecada, nunca corregida (a diferencia de `brain_versions`/`brain_resources`/`brain_learnings`, que sí se corrigieron en `0019:9-18`) |
| `user_project_status` | `0011:17` (mismas FKs que arriba) | ON (`0011:36`) | `0011:44-47` — admin-only | ⚠️ Needs review: mismo caso que `storage_limits` |
| `section_access_rules` | `0012_role_tier_whitelabel.sql:14` | ON (`0012:80`) | `0012:81-82` — `auth.role()='authenticated'`, lectura abierta a cualquier autenticado | Patrón distinto, parece intencional (tabla de config global, no de datos de cliente) — needs review solo para confirmar que es la intención |

### Brain versioning (0009) — sin RLS

| Tabla | Creada en | RLS | Estado |
|---|---|---|---|
| `brain_versions` | `0009_brain_versioning.sql:3` | **No se encontró ningún `ENABLE ROW LEVEL SECURITY`** | ⚠️ Needs review: FK corregida a `clients(id)` en `0019:16-18` (originalmente apuntaba a `mira_users`), pero la tabla sigue sin RLS activo hoy |
| `brain_resources` | `0009:15` | Igual — sin RLS | ⚠️ Needs review: FK corregida `0019:20-22`, sigue sin RLS |
| `brain_learnings` | `0009:29` | Igual — sin RLS | ⚠️ Needs review: FK corregida `0019:24-26`, sigue sin RLS |

### Tablas "baseline" — introspectadas en 0031, sin RLS salvo 2 de las 6

`0031_baseline_missing_tables.sql:1-20` documenta 6 tablas que el código usa (`.from('...')`) pero que nunca tuvieron `CREATE TABLE` propio antes de esa migración documental:

| Tabla | Creada en | RLS | Política | Estado |
|---|---|---|---|---|
| `approval_queue` | `0031:24` | Sin `ENABLE ROW LEVEL SECURITY` en ningún fichero de migración | — | ✅ Corregido en vivo 2026-07-24 (ver incidencia d abajo) |
| `post_history` | `0031:44` | Igual | — | ✅ Corregido en vivo 2026-07-24 |
| `alerts` | `0031:58` | Igual | — | ✅ Corregido en vivo 2026-07-24 |
| `agent_interactions` | `0031:71` | Igual en ficheros — pero **sí tenía RLS activo en producción**, con 2 políticas creadas a mano en el Dashboard (`agent_interactions_select_public` USING (true), `agent_interactions_insert_public` WITH CHECK (true)), ninguna de las dos documentada en ningún `.sql` | — | ✅ Corregido en vivo 2026-07-24 — ver incidencia (d), confirmado explotable con datos reales antes del fix |
| `crm_contacts` | `0031:84` | ON, pero añadido después en `0037_rls_hardening.sql:54` (no en `0031`) | `0037:55-58` — deny-all (`USING (false)`), server-only vía `workspace_id` | ✅ Correcto (deny-all intencional) |
| `leads` | `0031:109` | ON, añadido en `0037:10` | `0037:11-16` — **patrón estándar** ✓ | ✅ Correcto. Nota: 160/161 filas usan el `client_id` sentinel de sf-sales-engine (`docs/DEBT.md` punto v) — dato legítimo compartido, no huérfano |

`0037_rls_hardening.sql:1-2` cubre explícitamente solo 5 tablas (`leads`, `mira_projects`, `drive_connections`, `tool_connections`, `crm_contacts`) — las otras 4 tablas de `0031` (`approval_queue`, `post_history`, `alerts`, `agent_interactions`) quedaron fuera de ese endurecimiento. Las 4 se corrigieron el mismo día que se escribió este documento — ver incidencia (d) en la sección 1.

### Visual jobs (subsistema huérfano — ver `docs/DEBT.md` punto a)

| Tabla | Creada en | RLS | Política | Estado |
|---|---|---|---|---|
| `visual_jobs` | `0028_visual_jobs.sql:6` | ON (`0028:107`) | `0028:113-133` — 4 políticas separadas (view/insert/update + super_admin view aparte) en vez de una combinada con `OR`; funcionalmente equivalente al patrón estándar | RLS correcto, pero **código huérfano**: 0 referencias desde `app/`/`components/` (confirmado en `docs/DEBT.md` punto a) |
| `visual_assets` | `0028:33` | ON (`0028:108`) | `0028:136-150` — mismo estilo de 3 políticas separadas | Huérfano, igual |
| `visual_feedback` | `0028:59` | ON (`0028:109`) | `0028:153-167` | Huérfano, igual |
| `visual_approvals` | `0028:85` | ON (`0028:110`) | `0028:170-184` | Huérfano, igual |

### Tablas que MIRA lee pero no crea (fuera de alcance de esta tabla — dueño real: otra app)

Referenciadas por código de MIRA y documentadas como "sin esquema conocido" en `0031_baseline_missing_tables.sql:17-20`, pero **sin ningún `CREATE TABLE` en `apps/mira/portal/supabase/migrations/`**: `icp_profiles`, `proposal_library`, `lead_activities`, `prospect_context` — las 4 tienen su `CREATE TABLE` real en `apps/sf-sales-engine/supabase/migrations/001_commercial_brain.sql` y `002_leads_pipeline.sql`. `brand_references` está referenciada pero no se ha localizado su `CREATE TABLE` en ningún fichero de ningún app. `agent_sessions` y `mira_clients` están confirmadas como **inexistentes en producción** pese a tener código que las referencia (`0031:18-20`; ver también `docs/DEBT.md` punto r para `agent_sessions`). Ninguna de estas 6 entra en el recuento de "tablas de MIRA" de este documento porque MIRA no las posee — se listan aquí solo para que quede constancia de que su RLS (si existe) vive en la migración de otra app, no en la de MIRA.

---

## 5. Higiene de la carpeta de migraciones

**Estado confirmado hoy (`ls` directo, 2026-07-23):**

- Existen dos carpetas: `apps/mira/portal/migrations/` (legacy, 3 ficheros: `0001_client_documentation.sql`, `0002_toolkit_results.sql`, `0003_sales_engine_tables.sql`) y `apps/mira/portal/supabase/migrations/` (canónica, 37 ficheros, 0009→0042). **Esto ya está resuelto**: `apps/mira/portal/migrations/README.md:1-5` marca explícitamente la carpeta legacy como *"⚠️ Carpeta legacy — NO añadir migraciones aquí"*, redirige a `../supabase/migrations/` como única carpeta canónica, y ya advierte del punto siguiente.
- **Sigue sin resolver**: dentro de la propia carpeta canónica hay 3 pares de números duplicados — `0022_agent_documents.sql` / `0022_seed_brand_data_missing_clients.sql`, `0023_add_missing_toolkit_tools.sql` / `0023_agent_settings.sql`, `0024_fix_rls_project_id_column.sql` / `0024_make_generation_queue_user_id_nullable.sql`. El propio `README.md:5` ya avisa de esto ("hay números duplicados históricos (0022, 0023, 0024 ×2) — comprobar el último número real antes de nombrar") pero no se ha renumerado nada — renombrar ahora, con las 6 migraciones ya aplicadas en producción con esos nombres, no aportaría nada y añadiría riesgo de confundir el orden de aplicación real; se documenta aquí como conocido y sin acción recomendada más allá de seguir el consejo del propio README para nombres futuros.
- En el momento de escribir este documento, `0042_mira_usage_log.sql` era la última migración — de ahí que las incidencias de la sección 1 se numeren hasta 0042. Este repositorio recibe trabajo concurrente de otras sesiones; comprobar siempre `ls apps/mira/portal/supabase/migrations/` para el número libre real antes de nombrar una migración nueva, en vez de asumir el número de este documento.
