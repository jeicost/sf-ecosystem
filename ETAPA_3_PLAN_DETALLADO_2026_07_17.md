# Etapa 3 — Plan Detallado: Conectar 3 Webs Reales al SF-CMS

**Objetivo:** Validar que el editor SF-CMS funciona con las 3 webs reales del ecosistema (NC Global, Salsa Burgers, Startup Factory), sin hacer cambios permanentes hasta que todo esté validado.

**Duración estimada:** 2-3 horas (15 min exploratory + 30 min NC Global + 30 min Salsa Burgers + 45+ min Startup Factory)

**Fecha de ejecución:** Próxima sesión (2026-07-18 o adelante)

---

## 📋 FASE 0 — PRE-REQUISITOS (5 min, before starting)

### Verificaciones de seguridad:
```bash
# 1. Verificar que estamos en commit e767700 (Etapa 2 closure)
git log --oneline -1
# Esperado: e767700 docs: Etapa 2 complete...

# 2. Verificar que no hay cambios pendientes de MIRA
git status | grep -E "apps/mira/|components/" 
# Esperado: (sin output = limpio)

# 3. Limpiar ramas locales si las hay
git branch -a | grep -v main | head -5
# Si hay ramas viejas, considerar: git branch -d <rama>
```

### Verificaciones técnicas:
```bash
# 1. Confirmar que .env.local está gitignored en SF-CMS
grep ".env.local" apps/sf-cms/.gitignore
# Esperado: .env.local está listado

# 2. Verificar que harness está listo
ls -la apps/cms-qa-harness/.env.local
# Esperado: archivo existe con credentials

# 3. Verificar que script init es ejecutable
ls -la scripts/init-qa-harness.mjs | grep +x
# Esperado: -rwxr-xr-x (executable)
```

### Pre-requisito de seguridad (⚠️ RECOMENDADO):
**ANTES de tocar producción (Bloque 3 — Startup Factory), ejecutar:**
```bash
# Rotar Supabase service_role key (PASO 1 de CREDENTIAL_ROTATION_PLAN_2026_07_13.md)
# Esto requiere:
# 1. Acceso a Supabase dashboard
# 2. ~15 minutos
# 3. No es bloqueante para Bloques 1-2 (staging), pero recomendado antes de Bloque 3

# Para esta sesión: Si no se ejecuta PASO 1, documentar riesgo explícitamente
# Comando: grep -r "service_role\|eyJ" apps/sf-cms/ scripts/ --include="*.mjs" --include="*.ts"
# Si devuelve resultados: la key está expuesta, recomendación: rotar antes de Bloque 3
```

---

## 🔍 FASE 1 — VALIDACIÓN EXPLORATORY (15 min)

### 1.1 — Harness local de prueba

```bash
# Levanta el harness en puerto 3003
cd apps/cms-qa-harness
npm run dev

# En otra terminal:
# Test 1: Homepage renders
curl -s http://localhost:3003/ | grep -q "hero" && echo "✓ Hero section found"

# Test 2: Blog list renders
curl -s http://localhost:3003/blog | grep -q "test-post" && echo "✓ Blog list found"

# Test 3: Blog post renders
curl -s http://localhost:3003/blog/test-post | grep -q "Welcome to the QA" && echo "✓ Blog post found"

# Test 4: ISR revalidate endpoint responds
curl -X POST http://localhost:3003/api/revalidate \
  -H "x-revalidate-secret: dummy-local-secret" \
  -H "Content-Type: application/json" \
  -d '{"paths":["/blog"]}' \
  -w "\nStatus: %{http_code}\n"
# Esperado: 200
```

**Esperado resultado:**
- ✓ Hero section found
- ✓ Blog list found
- ✓ Blog post found
- 200 OK en revalidate

**Si algo falla:**
- ❌ Hero section: revisar `apps/cms-qa-harness/app/page.tsx` — verificar que fetchPage retorna page.sections
- ❌ Blog list: revisar `apps/cms-qa-harness/app/blog/page.tsx` — verificar que fetchPosts funciona
- ❌ Blog post: revisar `apps/cms-qa-harness/app/blog/[slug]/page.tsx` — verificar ISR config
- ❌ Revalidate: revisar `apps/cms-qa-harness/app/api/revalidate/route.ts` — verificar secret matching

**Acción si todo OK:**
→ Pasar a Bloque 1

---

## 🟦 BLOQUE 1 — NC GLOBAL ASSETS (30 min)

**Ubicación:** `clients/nc-global-assets/`  
**Stack:** Vite + React (SPA)  
**Ambiente:** Dev local + staging si disponible  
**Riesgo:** BAJO (interno, no público)

### 1.1 — Inspeccionar configuración actual

```bash
cd clients/nc-global-assets

# Buscar referencias a CMS / API
grep -r "CMS\|cms\|api.startupsfactory" . --include="*.tsx" --include="*.ts" --include="*.env*" | head -20

# Buscar .env files
ls -la .env* 2>/dev/null || echo "(no .env files found)"

# Buscar package.json
grep "@sf/cms" package.json || echo "(no @sf/cms-client dependency)"
```

**Esperado:**
- Si usa `@sf/cms-client`: está dentro del workspace, lista para testing con harness data
- Si usa hardcoded URLs: probablemente apunta a `https://cms.startupsfactory.es/api/public` (external account)
- Si no tiene CMS integration: skip este bloque, no hay qué conectar

### 1.2a — Si usa `@sf/cms-client` (workspace dependency)

```bash
# Verificar que @sf/cms-client existe y está actualizado
ls packages/cms-client/ || echo "Not found"

# Crear/actualizar .env.local para testing
cat > .env.local << 'EOF'
VITE_CMS_API_URL=http://localhost:3003
VITE_CMS_API_KEY=sk_qah_ovfm6iqf8k
VITE_CMS_PROJECT_SLUG=qa-harness
EOF

# Instalar + correr dev
npm install
npm run dev &

# Test: GET http://localhost:5173/ (o port asignado)
# Verificar que no hay errores 500 de fetch
# Verificar que algún componente menciona "Welcome to CMS" u similar
```

**Esperado:**
- Dev server inicia sin errores
- No hay 500 errors en network tab
- Algún contenido del harness está visible

**Si falla:**
- ❌ Fetch error 404/500: revisar que .env.local tiene URLs correctas
- ❌ CORS error: harness local no tiene headers CORS (¿Next.js configuguración?)
  - Fix: Actualizar `apps/cms-qa-harness/app/api/` para agregar CORS headers
- ❌ Tipo de datos mismatch: revisar que `@sf/cms-client` fetchPage esperado vs actual de harness
  - Fix: Revisar `apps/cms-qa-harness/scripts/init-qa-harness.mjs` — actualizar estructura de datos

### 1.2b — Si apunta a `cms.startupsfactory.es` (external)

```bash
# Crear backup de .env actual
cp .env.local .env.local.backup 2>/dev/null || true

# Apuntar al harness local (TEST MODE)
export VITE_CMS_API_URL=http://localhost:3003
export VITE_CMS_API_KEY=sk_qah_ovfm6iqf8k
export VITE_CMS_PROJECT_SLUG=qa-harness

npm run dev

# Test: Verificar que contenido cambia (debería mostrar harness data, no production)
```

**Si funciona en local con harness data:**
- ✓ El contrato API es correcto
- ✓ Podemos apuntar a SF-CMS cuando sea necesario

**Si falla:**
- Documentar error y skip a Bloque 2

### 1.3 — Test en staging (si disponible)

```bash
# Si hay un staging deployment de NC Global Assets:
# 1. Obtener URL de staging (ej: nc-global-assets-staging.vercel.app)
# 2. Actualizar env vars de Vercel staging para apuntar a SF-CMS
#    (O usar vercel CLI: vercel env add ... --environment=preview)
# 3. Deploy: vercel --prod (si staging está en GitHub/Git integration)
# 4. Test: GET https://nc-global-assets-staging.vercel.app
# 5. Cambiar contenido en CMS → refrescar web → verificar cambio en <3s (ISR)
```

**Resultado esperado:**
- Staging web conectada al CMS
- Cambios en CMS se reflejan en < 3 segundos

---

## 🟨 BLOQUE 2 — SALSA BURGERS WEB (30 min)

**Ubicación:** `clients/salsa-burgers/web/`  
**Stack:** Next.js  
**Ambiente:** Dev local + staging  
**Riesgo:** BAJO (cliente, pero privado)

### 2.1 — Inspeccionar configuración

```bash
cd clients/salsa-burgers/web

# Buscar referencias a CMS
grep -r "CMS\|cms\|api.startupsfactory" . --include="*.tsx" --include="*.ts" --include=".env*" | head -20

# Verificar package.json
grep "@sf/cms" package.json || echo "(no @sf/cms-client)"

# Buscar .env config
ls -la .env* 2>/dev/null
```

### 2.2 — Conectar a harness (local test)

```bash
# Similar a Bloque 1:
cat > .env.local << 'EOF'
NEXT_PUBLIC_CMS_API_URL=http://localhost:3003
NEXT_PUBLIC_CMS_API_KEY=sk_qah_ovfm6iqf8k
NEXT_PUBLIC_CMS_PROJECT_SLUG=qa-harness
NEXT_PUBLIC_REVALIDATE_SECRET=dummy-local-secret
EOF

npm install
npm run dev

# Test: GET http://localhost:3000/ (o port asignado)
# Verificar contenido del harness
```

### 2.3 — Test en staging

```bash
# Idem Bloque 1.3 pero para salsa-burgers
# URL staging: salsa-burgers-web-staging.vercel.app (o similar)
```

**Resultado esperado:**
- ✓ Web conectada, contenido renderiza
- ✓ ISR revalidate funciona

---

## 🟥 BLOQUE 3 — STARTUP FACTORY WEB (45+ min, EXTRA CAUTION)

**Ubicación:** `apps/startup-factory-web/`  
**Stack:** Next.js  
**Ambiente:** Dev local + staging + PRODUCCIÓN  
**Riesgo:** 🔴 ALTO (público, payante, SEO-crítico)  
**Dominios:** startupsfactory.es (con www redirect)

### ⚠️ PRE-REQUISITO: Service_role key DEBE estar rotada

```bash
# Verificar que la rotación se completó:
grep -r "service_role" scripts/ apps/sf-cms/ --include="*.mjs" --include="*.ts"

# Si devuelve algo: la key vieja aún está expuesta, NO continuar a Bloque 3
# Action: Ejecutar PASO 1 de CREDENTIAL_ROTATION_PLAN_2026_07_13.md
```

### 3.1 — Plan de rollback

**Antes de cualquier cambio a producción, crear plan de rollback:**

```bash
# 1. Snapshot de .env.production actual
vercel env pull .env.production --environment=production > /tmp/startup-factory-web-env-backup.txt

# 2. Snapshot de current deploy ID
vercel deployments list | head -1

# 3. Documentar rollback steps:
cat > /tmp/ROLLBACK_PLAN.txt << 'EOF'
ROLLBACK PROCEDURE for Startup Factory Web (if CMS integration breaks)

1. Revert env vars in Vercel:
   - vercel env rm <env_var_name> --environments production
   - Repeat para: NEXT_PUBLIC_CMS_API_URL, NEXT_PUBLIC_CMS_API_KEY, NEXT_PUBLIC_CMS_PROJECT_SLUG
   
2. Redeploy from previous working commit:
   - git log --oneline --all | grep "startup-factory-web"
   - git revert <commit-hash> (if needed)
   - vercel --prod

3. Test:
   - GET https://www.startupsfactory.es/blog
   - Verify blog posts still load from OLD source

4. Verify ISR didn't break:
   - Change a post in old CMS
   - Refresh web within 3 seconds
   - Post should update

Timeline: ~15 minutes total
EOF
```

### 3.2 — Local testing first

```bash
cd apps/startup-factory-web

# Update .env.local (NOT production)
cat > .env.local << 'EOF'
NEXT_PUBLIC_CMS_API_URL=http://localhost:3003
NEXT_PUBLIC_CMS_API_KEY=sk_qah_ovfm6iqf8k
NEXT_PUBLIC_CMS_PROJECT_SLUG=qa-harness
NEXT_PUBLIC_REVALIDATE_SECRET=dummy-local-secret
EOF

npm install
npm run dev

# Test 1: Homepage
curl -s http://localhost:3000/ | grep -q "Welcome\|Startup" && echo "✓ Homepage renders"

# Test 2: Blog
curl -s http://localhost:3000/blog | grep -q "test-post\|articles\|posts" && echo "✓ Blog section renders"

# Test 3: Single post
curl -s http://localhost:3000/blog/test-post && echo "✓ Blog post page works"

# Manual test (open browser):
# http://localhost:3000/ → should see harness content
# http://localhost:3000/blog → should see test-post
```

**If local test fails:**
- Stop. Document error in Bloque 3 section of this plan
- Do NOT proceed to staging/production until fixed

### 3.3 — Staging deployment (optional but recommended)

```bash
# If Startup Factory Web has a staging environment in Vercel:

# 1. Update env vars for staging
vercel env add NEXT_PUBLIC_CMS_API_URL --environments preview
# Input: <SF-CMS production URL, not local harness>

# 2. Link staging repo (if separate)
# Or use Vercel's preview deployments

# 3. Deploy to staging
vercel --prod --scope=<vercel-team> --project=startup-factory-web-staging

# 4. Test staging
# GET https://<staging-url>/blog
# Verify blog posts load
# Verify ISR: Change content in CMS, refresh within 3 seconds

# 5. Validate SEO (critical for this domain)
# - Homepage title tag is correct
# - Meta descriptions present
# - Canonical tags correct
# - OG tags for social sharing
# Tool: Lighthouse audit, SEMrush, or similar
```

### 3.4 — Production deployment (final step, APPROVAL required)

**Before executing, get explicit approval from user:**

"Proceeding with production deployment of Startup Factory Web connected to SF-CMS. Rollback plan documented. Proceed? Y/N"

```bash
# Assuming approval given:

# 1. Pull current production env
vercel env pull .env.production --environment=production

# 2. Backup current values
cp .env.production .env.production.backup

# 3. Update with SF-CMS credentials
cat > .env.production.update << 'EOF'
NEXT_PUBLIC_CMS_API_URL=https://cms.startupsfactory.es/api/public  # OR staged SF-CMS URL
NEXT_PUBLIC_CMS_API_KEY=<generated-key-from-SF-CMS-for-startup-factory>
NEXT_PUBLIC_CMS_PROJECT_SLUG=startup-factory
NEXT_PUBLIC_REVALIDATE_SECRET=<rotated-secret-from-CREDENTIAL_ROTATION_PLAN>
EOF

# 4. Apply changes to Vercel
for line in $(cat .env.production.update); do
  key=$(echo $line | cut -d= -f1)
  value=$(echo $line | cut -d= -f2-)
  vercel env add $key --environments production <<< "$value"
done

# 4b. Clean up local files with real secrets (now covered by .gitignore too, but
#     don't leave plaintext secrets on disk any longer than needed)
rm -f .env.production .env.production.backup .env.production.update

# 5. Deploy
vercel --prod

# 6. Immediate validation (CRITICAL)
# - GET https://www.startupsfactory.es/blog → posts load? ✓
# - GET https://www.startupsfactory.es/ → homepage? ✓
# - Lighthouse score > 85 (mobile)? ✓
# - No 500 errors? ✓

# 7. ISR validation
# - Change post title in CMS
# - Refresh web < 3 seconds
# - New title appears? ✓

# 8. Monitor for 24h
# - Set up Sentry or similar
# - Check error logs
# - Monitor API response times
```

**If production deployment breaks:**
- Execute rollback plan (documented in 3.1)
- Document error and timeline in `ETAPA_3_INCIDENT_2026_07_17.md`
- Do NOT proceed until root cause identified

---

## 📊 RESULTA ESPERADOS (Summary)

| Bloque | Status | Criterio |
|--------|--------|----------|
| 0 — Pre-requisitos | ✓ | Commit e767700 verificado, harness local funciona |
| 1 — NC Global | ✓ | Dev local funciona, staging conectada (si existe) |
| 2 — Salsa Burgers | ✓ | Dev local funciona, staging conectada (si existe) |
| 3 — Startup Factory | ✓ | Dev + staging OK, producción deployada, ISR validated |

**Si todo ✓:**
- Etapa 3 Completa
- Tres webs reales conectadas al SF-CMS conversacional
- ISR pipeline funcional end-to-end
- Documentación de producción actualizada

**If any ✗:**
- Documentar error específico
- No pasar al siguiente bloque hasta que esté resuelto
- Plan de remediación en commit message

---

## 🎯 APUNTES IMPORTANTES

### Coordinación con MIRA
- Antes de Etapa 3: confirmar que sesión MIRA ha completado push
- Si hay cambios simultáneos: resolver merge conflicts con cuidado
- Bloque 3 (producción) requiere: mínimo 2 horas sin cambios simultáneos en repo

### Seguridad
- ⚠️ Service_role key debe estar rotada antes de Bloque 3
- ⚠️ Todos los .env.local files deben estar en .gitignore (verificado, pero confirmar)
- ⚠️ REVALIDATE_SECRET debe ser generado desde `CREDENTIAL_ROTATION_PLAN_2026_07_13.md` PASO 2

### Rollback
- Cada bloque tiene procedimiento de rollback documentado
- Rollback más crítico: Bloque 3 (producción)
  - Estimado: 15-30 minutos
  - Requisitos: acceso a Vercel, git history

### Timing
- Total: 2-3 horas sin incidents
- Si hay incidents: +1-2 horas para debugging + rollback
- Recomendado: ejecutar cuando puedas estar disponible 3+ horas

---

**Documento generado:** 2026-07-17 04:35 UTC  
**Versión:** 1.0 (ready for execution próxima sesión)  
**Última revisión:** Inicio de Etapa 3
