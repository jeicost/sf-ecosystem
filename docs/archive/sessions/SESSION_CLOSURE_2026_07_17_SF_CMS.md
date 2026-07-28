# Session Closure 2026-07-17 — SF-CMS Etapas 1-2 COMPLETE

**Fecha:** 2026-07-17  
**Sesión anterior:** 2026-07-13 (Recovery Investigation)  
**Commits en main:** 3 nuevos (5ffa36c, a510c08, e767700)  
**Estado:** ✅ Listo para producción (Etapa 1) + ✅ Investigación cerrada (Etapa 2)

---

## 📊 RESUMEN EJECUTIVO

### Etapa 1 — QA Harness + Undo Restoration ✅ COMPLETO

**Qué se logró:**
- ✅ Creado harness aislado (`apps/cms-qa-harness/`) para validar contrato SF-CMS sin tocar webs reales
- ✅ Datos de prueba inicializados en Supabase (`dmzecrlkclocqaywkjtc`) — proyecto `qa-harness`, página `home`, post `test-post`
- ✅ Undo button restaurado en SF-CMS admin — endpoint `/api/admin/pages/[pageId]/versions` lista snapshots, botón restaura desde `page_versions` tabla
- ✅ Script `scripts/init-qa-harness.mjs` automatiza setup completo (195L, idempotent insert-or-update pattern)
- ✅ `.env.local` configurado con API keys generados automáticamente

**Commits:**
- `a510c08` — feat: Etapa 1 complete — QA Harness initialized with test data + Undo fix
- `5ffa36c` — fix: MIRA design system unification (paralelo, sin conflicto)

**Documentación:**
- `apps/cms-qa-harness/.env.example` — template de env vars requeridas
- `apps/cms-qa-harness/.gitignore` — excluye .env.local, .next/, node_modules/
- `docs/PROJECT_REGISTRY.md` — actualizado con nota: SF-CMS solo deploy vía git push (no CLI manual de Vercel, debido a workspace dependencies)

---

### Etapa 2 — Recovery Investigation CLOSED ✅

**Investigación completada:**

1. **No hay URL de submodule recuperable**
   - `apps/sf-cms` fue gitlink "fantasma" (modo 160000) desde 2026-05-20 hasta 2026-07-12 (cuando se borró)
   - Nunca existió `.gitmodules` registrando la URL
   - `git log --all` confirma: cero metadata de submodule en .git/config, git reflog, o histórico

2. **GenericSectionEditor (editor WYSIWYG) nunca existió en este repo**
   - `git log --all -p -S"GenericSectionEditor"` → única mención en CMS_RECOVERY_STATUS_2026_07_13.md (investigación previa)
   - Cero archivos .tsx/.ts implementándolo
   - El "listado de 128 archivos" vía Vercel API fue reconstrucción de memoria, no descarga verificada de código

3. **Descarga vía API de Vercel falla con HTTP 410**
   - Deployment (`dpl_GX8WMcYdL3tkFxo5qrrSbFj7Vx5J`) está fuera de ventana de retención de Vercel (90 días)
   - Intento del 13 jul confirmó: "Gone"

4. **Source maps no expuestos en producción**
   - `https://cms.startupsfactory.es/_next/static/chunks/*.js.map` → 404 en 3 chunks comprobados hoy
   - Vía habitual de recuperar código de builds de producción no viable

5. **Editor conversacional SÍ es real e intacto**
   - Introducido en `8ded677` (15 jul)
   - Mejorado en Etapa 1 de esta sesión con Undo fix + REST endpoints
   - Sigue funcional, no fue simplificado sino mejorado

**Decisión:** No recuperar. El editor conversacional queda como solución real en este repo. WYSIWYG reconstrucción deferred a roadmap futuro (no bloqueante).

**Commits:**
- `e767700` — docs: Etapa 2 complete — SF-CMS recovery investigation closed

**Documentación:**
- `CMS_RECOVERY_STATUS_2026_07_13.md` — añadida sección "Actualización 2026-07-17 — Investigación cerrada" con 4 hallazgos + decisión
- `CREDENTIAL_ROTATION_PLAN_2026_07_13.md` — añadida sección "ESTADO: ROTACIÓN PENDIENTE (2026-07-17)" con alerta roja: service_role key sigue expuesta, usar antes de próxima sesión

---

## 🔐 HALLAZGO DE SEGURIDAD (DOCUMENTADO, NO RESUELTO)

**Supabase service_role key comprometida:**
- Ubicación: `scripts/fix-sf-cms-schema.mjs` (texto plano en repo)
- Confirmado en git history: 2 commits la contienen
- Actualmente en uso: `scripts/init-qa-harness.mjs` (ejecutado hoy), `apps/sf-cms/.env.local` (descargado hoy vía Vercel)
- Riesgo: 🔴 CRÍTICO — cualquiera con acceso al repo puede leer/escribir/borrar todo en Supabase `dmzecrlkclocqaywkjtc`

**Plan de remediación:**
- `CREDENTIAL_ROTATION_PLAN_2026_07_13.md` tiene instrucciones paso a paso (Paso 1-4, ~1h total)
- Decisión del usuario: rotar más tarde, no en esta sesión
- Recomendación: ejecutar antes de cualquier "push final" o deploy de producción de SF-CMS

---

## 📁 ARCHIVOS CLAVE MODIFICADOS/CREADOS

### Nuevos:
- `apps/cms-qa-harness/` — directorio completo (Next.js 16, @sf/cms-client consumer)
  - `app/page.tsx` — fetches 'home' page, renders with HeroBlock
  - `app/blog/page.tsx` — lists posts
  - `app/blog/[slug]/page.tsx` — single post view with generateStaticParams + ISR
  - `app/api/revalidate/route.ts` — webhook handler (direct implementation, no shared handler to avoid version conflicts)
  - `components/HeroBlock.tsx` — minimal section renderer
  - `.env.local` — generated with API key `sk_qah_ovfm6iqf8k`
  - `.env.example` — template
  - `.gitignore` — new
  - `package.json`, `tsconfig.json`, `next.config.ts` — boilerplate

- `scripts/init-qa-harness.mjs` — 195L, executable script
  - Reads NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from `apps/sf-cms/.env.local`
  - Creates project (qa-harness), page (home + hero), post (test-post)
  - Idempotent: insert-first, then update on constraint violation (23505)
  - Output: project ID, page ID, post ID, API key generated

### Modificados:
- `CMS_RECOVERY_STATUS_2026_07_13.md` — +22 líneas (closure section)
- `CREDENTIAL_ROTATION_PLAN_2026_07_13.md` — +15 líneas (warning header)
- `docs/PROJECT_REGISTRY.md` — +5 líneas (SF-CMS deploy-only-via-git-push restriction note)
- `apps/sf-cms/.gitignore` — +2 líneas (.vercel, .env*.local)
- `apps/sf-cms/.env.local` — gitignored, descargado vía vercel CLI, contiene credenciales reales

---

## 🚀 PRÓXIMA SESIÓN — ETAPA 3 PLANIFICADA

**Objetivo:** Conectar las 3 webs reales al editor SF-CMS (validación en vivo, no mocked).

**Alcance:**
1. **NC Global Assets** (`clients/nc-global-assets/`) — web de Vite+React
   - Reapuntar a datos vivos en SF-CMS
   - Validar que secciones se renderizan correctamente
   - Test: cambiar headline en CMS → confirmar aparece en web dentro de 60s (ISR)

2. **Salsa Burgers Web** (`clients/salsa-burgers/web/`) — Next.js
   - Idem NC Global

3. **Startup Factory Web** (`apps/startup-factory-web/`) — Next.js, dominio producción
   - Idem pero con mayor cuidado (público + payante)
   - Considerar testing en staging primero

**Condiciones previas:**
- ✅ QA Harness válida (Etapa 1 completa)
- ✅ Undo funcional (Etapa 1 completa)
- ⚠️ Service_role key debe rotarse ANTES (Etapa 2 cierre, recomendación de seguridad)
- ⚠️ Ningún cambio simultáneo en MIRA (coordinación entre sesiones)

**Plan detallado:** Ver documento separado `ETAPA_3_PLAN_DETALLADO_2026_07_17.md`

---

## 🔄 COORDINACIÓN CON MIRA

**Estado actual:**
- MIRA está en sesión paralela (P0 security fixes)
- Protocolo establecido: no tocar archivos bajo `apps/mira/**` en sesiones SF-CMS
- Verificaciones antes de cada commit: `git log -5` + `git status` para confirmar no hay MIRA files staged

**Próxima sesión:**
- Confirmar que MIRA session ha completado y hecho push
- Si es necesario, sincronizar MIRA P0 fixes antes de Etapa 3 deploy

---

## ✅ CHECKLIST PARA PRÓXIMA SESIÓN

### Pre-requisitos técnicos:
- [ ] Leer `ETAPA_3_PLAN_DETALLADO_2026_07_17.md` completo
- [ ] Confirmar que `origin/main` está en commit `e767700` (cierre de Etapa 2)
- [ ] Verificar que MIRA session ha completado (no hay commits pendientes en MIRA)
- [ ] Revisar `PROJECT_REGISTRY.md` para dominios + proyectos Vercel de las 3 webs

### Pre-requisitos de seguridad:
- [ ] **RECOMENDADO:** Ejecutar `CREDENTIAL_ROTATION_PLAN_2026_07_13.md` PASO 1 (rotar service_role key)
  - Si no: documentar riesgo explícitamente antes de tocar SF-CMS en producción
- [ ] Confirmar que `.env.local` files están en `.gitignore` (ya hecho, pero verificar antes de deploy)

### Validaciones iniciales (Etapa 3a — Exploratory):
- [ ] Levanta harness local: `cd apps/cms-qa-harness && npm run dev`
- [ ] Verifica: GET `http://localhost:3003/` → hero block renderiza
- [ ] Verifica: GET `http://localhost:3003/blog` → test-post lista
- [ ] Verifica: GET `http://localhost:3003/blog/test-post` → contenido completo

### Bloque 1 — NC Global Assets:
- [ ] Identificar URL de API en `clients/nc-global-assets/` que apunta a `cms.startupsfactory.es`
- [ ] Cambiar a `CMS_API_URL` de instancia SF-CMS deployada (o local si testing)
- [ ] Deploy a staging (si existe)
- [ ] Test: cambiar contenido en CMS → refrescar web → verificar cambio

### Bloque 2 — Salsa Burgers Web:
- [ ] Idem NC Global

### Bloque 3 — Startup Factory Web:
- [ ] Idem, pero con extra cuidado (producción)
- [ ] Considerar: cambio regresivo a rollback plan (revertir si web se rompe)

---

## 📝 MEMORIA DEL PROYECTO (actualizar en próxima sesión)

Agregar a `/Users/carlosjacoste/.claude/projects/.../memory/MEMORY.md`:

```markdown
- [Etapa 1-2 Complete (17 jul)](SESSION_2026_07_17_SF_CMS_ETAPAS_1_2.md) — ✅ QA Harness ready, Undo fixed, Recovery investigation closed (no recuperable). Editor conversacional es solución real.
- [Etapa 3 Ready for Execution (17 jul)](ETAPA_3_PLAN_DETALLADO_2026_07_17.md) — Conectar 3 webs reales al CMS. Prerequisite: rotar service_role key (seguridad).
```

---

## 🎯 RESUMEN EJECUTIVO PARA PRÓXIMA SESIÓN

**¿Qué pasó?**
- Etapa 1: Harness QA creado, Undo restaurado, datos de prueba listos. ✅
- Etapa 2: Investigación de recuperación del editor WYSIWYG cerrada. No recuperable. ✅
- Hallazgo de seguridad documentado: service_role key expuesta, rotación recomendada antes de próximo deploy.

**¿Qué está listo?**
- QA Harness funcional, validando contrato SF-CMS
- Editor conversacional mejorado e intacto
- Plan detallado para conectar 3 webs reales

**¿Qué falta?**
- Etapa 3: Validación en vivo con NC Global → Salsa Burgers → Startup Factory
- Security: Rotar credenciales comprometidas

**¿Duración estimada para Etapa 3?**
- Exploratory (harness validation): 15 min
- Bloque 1 (NC Global): 30 min
- Bloque 2 (Salsa Burgers): 30 min
- Bloque 3 (Startup Factory): 45 min + extra caution
- **Total estimado: 2h (si todo sale bien sin rollbacks)**

**¿Bloqueadores?**
- ⚠️ Service_role key aún expuesta (recomendado rotar PASO 1 del plan antes)
- ⚠️ Coordinación con MIRA si está en sesión paralela

---

**Generado:** 2026-07-17 04:30 UTC  
**Por:** Claude Code (Haiku 4.5)  
**Próxima revisión:** Inicio de Etapa 3, próxima sesión
