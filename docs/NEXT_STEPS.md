# PRÓXIMOS PASOS — SF Ecosystem (actualizado 2026-07-29)

Estado de referencia: Quick Actions 2.0 + Plan Maestro B1-B5 completos y en producción (bitácora completa en `docs/DEBT.md`, entradas (ii)(jj)(kk)). Migraciones 0048/0049/0050 aplicadas. Este fichero lista SOLO lo que queda.

## Acciones del CEO (no técnicas)

0. **⚡ APLICAR MIGRACIÓN 0051** (2 min, desbloquea los 2 reports nuevos): pegar `apps/mira/portal/supabase/migrations/0051_business_reports_slugs.sql` en https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql — añade brand-book y monthly-content-system al CHECK de generation_queue. Sin esto, generar cualquiera de los dos falla con "violates check constraint".

1. **Reconexión Drive de los 5 clientes** (Salsa, Startup Factory, Dadybox, Discoolver, NC Global): sus conexiones son seed caducado. Un clic por cliente en MIRA → Integraciones → Conectar Google Drive (el banner ámbar ya lo pide). Con eso arranca el auto-sync diario (07:00 CET) y el export a su Drive.
2. **Montar la carpeta de conocimiento del primer cliente real** con el protocolo nuevo (ver DEBT kk / memoria): UNA carpeta en su Drive (subcarpetas libres, docs de texto, ≤3 niveles) → pegar enlace en MIRA. "MIRA — Entregables" nace sola en su raíz; pueden arrastrarla dentro.
3. **Adrian Grooves**: entregarle la password temporal (`Mira-9Ud41Adr!7`, reseteada 2026-07-27) por canal seguro; que la cambie al entrar. Configurarle Drive con el protocolo.
4. **Dadybox**: revocar el acceso de MIRA en su cuenta Google y reconectar (fuga de token en terminal, DEBT ff) — pendiente desde el 24/07.
5. **VERCEL_TOKEN del GitHub Action** caducado: regenerar el secret o quitar el step del workflow (no bloquea — el deploy real va por integración nativa).

## MIRA — Business Reports (sesión 2026-07-28/29, DEBT ll)

- **Verificación real de brand-book y monthly** (bloqueada solo por la migración 0051): build completo con Salsa (fixture QA listo), Voice Guide A4 → Slides, deck mensual → verify-deck → Slides editable en Drive → materializar captions a la Cola. Los scripts de verificación están en el scratchpad de la sesión.
- **Primer build real con cliente**: Dadybox (brand book) y Salsa (monthly) como casos de referencia; sembrar approval_queue del mes previo para ver previous_month_learnings en acción.
- **v2 del monthly**: modos pillars_only / brief_greenlights / guardrail_check (del diseño original, pospuestos).
- **Riesgo vigilado**: monthly = 2 llamadas opus secuenciales con maxDuration 300s — si aparece timeout en prod, ampliar o partir.
- **Limpieza QA pendiente al cierre**: borrar filas de `br_cleanup.txt` (generaciones de prueba en Salsa, incluida 1 en PROD), restaurar brand_data de Salsa desde el backup del scratchpad, borrar grant QA `5fcf1db7`, matar dev server.

## MIRA — técnico pendiente (por prioridad)

1. **i18n ronda 2** (DEBT hh): árbol Toolkit restante (~8 sub-tools + landing/overview/report/[id]), interiores de Comercial (ya tokenizados pero con literales), `agent-workspace.tsx`, `document-uploader.tsx`, props de AgentWorkspace en Strategy/Finanzas, Community. Mecánico; mantener SIEMPRE simetría es/en de lib/i18n.ts (hoy 1100/1100).
2. **Modo claro**: auditoría exhaustiva del resto de páginas no-Comercial (B5 solo cubrió Comercial + barrido de clases hex; quedan estilos inline y overrides frágiles de globals.css).
3. **Bucket brand-assets → privado + signed URLs**: hoy es público y recibe adjuntos de negocio (P&L, hilos de email) de quick actions y logos.
4. **Coste del chat guiado**: vigilar `mira_usage_log` ruta `quick-actions-guided` (Opus por turno de entrevista); decidir si el entrevistador baja a Sonnet manteniendo Opus en la generación.
5. **ENFORCE_PLAN_LIMITS**: sin bloqueantes desde el 24/07, activación pendiente de decisión CEO.
6. **Stripe**: elegido como pasarela (24/07), build-out pendiente (facturación real de clientes; los ficheros mock de Operations→Billing esperan esto).
7. **Canva**: OAuth completo en código; faltan registro de app + review + envs `NEXT_PUBLIC_CANVA_CLIENT_ID`/`CANVA_CLIENT_SECRET` (DEBT l).
8. **Imágenes — mejoras**: edición real pixel-perfect (`images.edit` de OpenAI en vez de regenerar), carousel multi-imagen (hoy solo cover), tamaños 4:5/9:16 para stories/reels.
9. **Drive — mejoras**: watch/push de cambios (hoy sync diario), toggle de auto_sync por carpeta en el panel (columna ya existe).
10. **Limpieza menor**: prompts huérfanos en quick-action-prompts (patrón entrada g), tabla `toolkit_results` legacy, tablas `visual_jobs` (0028) sin rutas — decidir borrado en una ronda de higiene de BD.
11. **Publicación en redes**: FUERA del producto por decisión CEO (2026-07-28). Si algún día se retoma: puente n8n contra los webhooks dormidos (`/api/webhook/queue-post|alert|agent-activity`, protegidos por `WEBHOOK_SECRET`) — no reconstruir desde cero.

## Resto del ecosistema

- **SF-CMS**: plan de cierre por bloques pendiente (memoria `sf-cms-estado-y-plan`); dominio apex decidido.
- **sf-reports**: sigue siendo el hub MANUAL de entregables; candidato a alimentarse desde el export editorial de MIRA en el futuro.
- **Reglas de oro vigentes** (no olvidar): verificar columnas reales en BD antes de confiar en ficheros de migración (5 casos de deriva encontrados); nunca `select('*')` en tablas con tokens; deletes de producción solo por IDs exactos verificados; `node scripts/verify-project-links.mjs` antes de cualquier `vercel --prod`.
