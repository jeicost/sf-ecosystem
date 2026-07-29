# PRÓXIMOS PASOS — SF Ecosystem (actualizado 2026-07-29 tarde)

Estado de referencia: Quick Actions 2.0 + Plan Maestro B1-B5 completos y en producción (bitácora completa en `docs/DEBT.md`, entradas (ii)(jj)(kk)(nn)). Migraciones 0048/0049/0050/0051 aplicadas. Este fichero lista SOLO lo que queda.

## Acciones del CEO (no técnicas)

1. **Reconexión Drive de 4 clientes** (Startup Factory, Dadybox, Discoolver, NC Global) — ✅ Salsa ya reconectado con scope de escritura completo (verificado 2026-07-29). Un clic por cliente en MIRA → Integraciones → Conectar Google Drive.
2. **Adrian Grooves**: entregarle la password temporal (`Mira-9Ud41Adr!7`, reseteada 2026-07-27) por canal seguro; que la cambie al entrar. Configurarle Drive con el protocolo.
3. **Dadybox**: revocar el acceso de MIRA en su cuenta Google y reconectar (fuga de token en terminal, DEBT ff) — pendiente desde el 24/07.
4. **Revisar Drive de Dadybox/Discoolver antes de dar por bueno su onboarding visual**: en Salsa se encontró y limpió documentación técnica interna de MIRA (schemas JSON de otro proyecto) mezclada por error en su carpeta de conocimiento (DEBT nn) — comprobar que no pasa lo mismo en las otras.

## MIRA — Business Reports (DEBT ll/nn) — ✅ CERRADO

Brand Book y Monthly Content System verificados con generaciones reales completas contra Salsa (200 OK, contenido real, sin truncar). Migración 0051 aplicada. Bug de timeout del monthly (fix `a9a04a8`) confirmado resuelto en producción. Sin pendientes de esta ronda salvo lo listado abajo.

## Visual Production Foundation — esperando respuesta externa (DEBT nn)

- Nota de estado ya redactada para reenviar al equipo/persona del handoff — resume: seguimos esperando (a) contrato de marca congelado Salsa/Dadybox/Discoolver, (b) su decisión sobre 0028 reuse-vs-namespace, (c) aprobación de "one small backend foundation task".
- Mientras tanto, ejecutado ya (Track A, sin tocar nada gated): Studio (designer/spark) con piezas reales aprobadas en vez de mock; `generate_image` con grounding visual real vía Claude vision. Ver detalle en DEBT (nn).
- Pendiente real (Track B, NO empezar sin luz verde externa): aplicar `vp_brand_visual_modules`/`vp_visual_references`, descargar e indexar de verdad las fotos de "Post References" de Drive, cross-link con el JSON de 12 casos de `README (1).md` de Salsa.

## MIRA — técnico pendiente (por prioridad)

1. **i18n ronda 2** (DEBT hh): árbol Toolkit restante (~8 sub-tools + landing/overview/report/[id]), interiores de Comercial (ya tokenizados pero con literales), `agent-workspace.tsx`, `document-uploader.tsx`, props de AgentWorkspace en Strategy/Finanzas, Community. Mecánico; mantener SIEMPRE simetría es/en de lib/i18n.ts (hoy 1100/1100).
2. **Modo claro**: auditoría exhaustiva del resto de páginas no-Comercial (B5 solo cubrió Comercial + barrido de clases hex; quedan estilos inline y overrides frágiles de globals.css).
3. **Bucket brand-assets → privado + signed URLs**: hoy es público y recibe adjuntos de negocio (P&L, hilos de email) de quick actions y logos.
4. **Coste del chat guiado**: vigilar `mira_usage_log` ruta `quick-actions-guided` (Opus por turno de entrevista); decidir si el entrevistador baja a Sonnet manteniendo Opus en la generación.
5. **ENFORCE_PLAN_LIMITS**: sin bloqueantes desde el 24/07, activación pendiente de decisión CEO.
6. **Stripe**: elegido como pasarela (24/07), build-out pendiente (facturación real de clientes; los ficheros mock de Operations→Billing esperan esto).
7. **Canva**: OAuth completo en código; faltan registro de app + review + envs `NEXT_PUBLIC_CANVA_CLIENT_ID`/`CANVA_CLIENT_SECRET` (DEBT l).
8. **Imágenes — mejoras reales** (`images.edit` de OpenAI con referencia real en vez de solo texto, carousel multi-imagen, tamaños 4:5/9:16): ligado a Track B de Visual Production Foundation — no elegir modelo/endpoint final hasta que se resuelva (ver sección arriba).
9. **Drive — mejoras**: watch/push de cambios (hoy sync diario), toggle de auto_sync por carpeta en el panel (columna ya existe). Además: la tarjeta genérica de Google Drive en `/integrations` puede disparar un disconnect que no hace nada (tabla equivocada) — confuso, no roto (DEBT nn); decidir si se quita de esa tarjeta o se le da su propio handler.
10. **Bug real, no arreglado**: `column agent_activity.created_at does not exist` — 400 en las pestañas Activity/Performance de `/agent/[role]` (DEBT nn, encontrado de rebote, sin investigar la causa).
11. **Limpieza menor**: prompts huérfanos en quick-action-prompts (patrón entrada g), tabla `toolkit_results` legacy, tablas `visual_jobs` (0028) sin rutas — decisión ligada a Visual Production Foundation, no una ronda de higiene aparte.
12. **Publicación en redes**: FUERA del producto por decisión CEO (2026-07-28). Si algún día se retoma: puente n8n contra los webhooks dormidos (`/api/webhook/queue-post|alert|agent-activity`, protegidos por `WEBHOOK_SECRET`) — no reconstruir desde cero.

## Resto del ecosistema

- **SF-CMS**: plan de cierre por bloques pendiente (memoria `sf-cms-estado-y-plan`); dominio apex decidido.
- **sf-reports**: sigue siendo el hub MANUAL de entregables; candidato a alimentarse desde el export editorial de MIRA en el futuro.
- **Reglas de oro vigentes** (no olvidar): verificar columnas reales en BD antes de confiar en ficheros de migración (5 casos de deriva encontrados); nunca `select('*')` en tablas con tokens; deletes de producción solo por IDs exactos verificados; `node scripts/verify-project-links.mjs` antes de cualquier `vercel --prod`.
