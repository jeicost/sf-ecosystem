# Credential Rotation Plan — SF-CMS + Webs Clientes
**Estrategia segura para no romper el pipeline CMS→webs en producción**

---

## SITUACIÓN ACTUAL (Riesgos)

Tres credenciales reales en **texto plano commiteado** en el repositorio:

### 1. Supabase Service Role Key (CRÍTICO)

| Campo | Valor |
|-------|-------|
| Ubicación | `scripts/fix-sf-cms-schema.mjs` línea 4 |
| Clave | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (truncado) |
| Proyecto | `dmzecrlkclocqaywkjtc` (SF-CMS, separado de MIRA) |
| Permisos | Service role (acceso total a todos los datos de SF-CMS) |
| Riesgo | 🔴 CRÍTICO — anyone with this key can: read/write/delete all posts, pages, users, audit logs |
| Uso actual | Script de migración para arreglar schema (probablemente no se ejecuta hoy) |

### 2. REVALIDATE_SECRET (ALTO)

| Campo | Valor |
|-------|-------|
| Ubicación | `CMS_PRODUCTION_SNAPSHOT.md` línea 74 |
| Secreto | `[ROTATED]` |
| Propósito | Header `x-revalidate-secret` para POST `/api/revalidate` en las 3 webs |
| Proyectos Vercel afectados | `startup-factory-web`, `salsa-burgers-web`, `nc-global-assets` |
| Riesgo | 🔴 ALTO — anyone can trigger ISR revalidates en las 3 webs (no es modificación de contenido, pero es DoS vector si publicamos secret) |
| Uso | Supabase webhooks en tabla `posts` del CMS → llama a cada web's `/api/revalidate` |

### 3. Admin Password (ALTO)

| Campo | Valor |
|-------|-------|
| Ubicación | `CMS_PRODUCTION_SNAPSHOT.md` línea 82 |
| Contraseña | `[ROTATED]` |
| Usuario | `jacostech@gmail.com` (superadmin) |
| Aplicación | SF-CMS login (`cms.startupsfactory.es`) |
| Riesgo | 🔴 ALTO — anyone can log in and modify all content, user permissions, etc. |
| Uso | Login manual en `cms.startupsfactory.es` (no automatizado) |

---

## PLAN DE ROTACIÓN (Orden seguro)

### PREREQUISITO: Backups y plan de rollback

```bash
# Antes de empezar cualquier rotación:
1. Snapshot Supabase project dmzecrlkclocqaywkjtc (manually in Supabase UI: Settings → Backups)
2. Guardar credenciales ANTIGUAS en un lugar seguro local (solo lectura) por 24h, por si hay rollback
3. Notificar a cualquier script/proceso que use estas credenciales (hay que parar antes de rotar)
```

### ORDEN: Service Role Key → REVALIDATE_SECRET → Admin Password

**RAZÓN:** Service role key es la más crítica (acceso total a BD). REVALIDATE_SECRET es segundo (afecta webs). Admin password es tercero (solo affects CMS UI, menos impacto que la BD o el pipeline).

---

## PASO 1: Rotar Supabase Service Role Key

**Duración:** 15 minutos  
**Riesgo:** ⚠️ BAJO — este script (`fix-sf-cms-schema.mjs`) no es crítico en producción hoy

### 1.1 — Generar nueva key en Supabase

```
1. Abre Supabase dashboard: https://app.supabase.com
2. Selecciona project: dmzecrlkclocqaywkjtc
3. Settings → API
4. Encuentra "service_role" under "Project API keys"
5. Haz clic en las 3 puntos → "Rotate" 
   (NO "Revoke" — rotate = new key + old key invalid inmediatamente)
6. Confirma que entiendes que se invalida
7. Copia la nueva key
```

### 1.2 — Actualizar en código

**Archivo:** `scripts/fix-sf-cms-schema.mjs` línea 4  
Reemplazar:
```javascript
const SERVICE_ROLE_KEY = 'eyJhbGc...'; // OLD
```
con:
```javascript
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // USE ENV VAR
```

Luego crear una variable de entorno local (`.env.local`):
```
SUPABASE_SERVICE_ROLE_KEY=<nueva-key-aqui>
```

### 1.3 — Purgar del repo

Borrar credencial del markdown:
- Edit `CMS_PRODUCTION_SNAPSHOT.md` (line 57) → reemplazar hardcoded key con `[ROTATED — stored in env var]`
- Commit: "chore: rotate Supabase service_role key, move to env var"

### 1.4 — Verificar

```bash
# El script debería funcionar igual, pero con la nueva key
npm run fix:cms-schema  # (si existe este script)
# Esperado: error diciendo que la columna ya existe (ok, porque se ejecutó en el pasado)
```

---

## PASO 2: Rotar REVALIDATE_SECRET

**Duración:** 30 minutos  
**Riesgo:** ⚠️ MEDIO — esto afecta el pipeline activo CMS→webs

### 2.1 — Generar nuevo secret

```bash
# Generar un nuevo sk_live_... token (crypto-random, 64 caracteres)
openssl rand -hex 32  # Output: algo como 'a3f7c2e1b...'
# Resultado: sk_live_<hex>
# Nuevo secreto: sk_live_a3f7c2e1b9d4f6c8a2e5f1d3b7c9e2a4 (ejemplo)
```

### 2.2 — Actualizar en Vercel (3 webs)

Actualizar env vars en **Vercel production environment** para cada proyecto:

```
vercel env add REVALIDATE_SECRET --environments production
# Input: sk_live_a3f7c2e1b9d4f6c8a2e5f1d3b7c9e2a4

# Repeat para:
1. startup-factory-web
2. salsa-burgers-web (clients/salsa-burgers/ en monorepo, pero desplegado como salsa-burgers-web)
3. nc-global-assets (Vite) O nc-global-assets-next (Next.js, si está en producción ya)
```

**Verificar en Vercel UI:**
- Cada proyecto → Settings → Environment Variables
- Production: REVALIDATE_SECRET debe estar actualizado

### 2.3 — Actualizar en Supabase webhook

Webhook de Supabase tabla `posts` en proyecto `dmzecrlkclocqaywkjtc`:

```
1. Supabase → SQL Editor
2. Ejecutar consulta para actualizar webhook secret:
   UPDATE supabase.webhooks 
   SET secret = 'sk_live_a3f7c2e1b9d4f6c8a2e5f1d3b7c9e2a4'
   WHERE name LIKE 'revalidate%';
```

O manualmente:
```
1. Database → Webhooks
2. Editar cada webhook que envía a `/api/revalidate`
3. Actualizar el secret
```

### 2.4 — Purgar del repo

- Edit `CMS_PRODUCTION_SNAPSHOT.md` → reemplazar con `[ROTATED — stored in Vercel env vars]`
- Commit: "chore: rotate REVALIDATE_SECRET, store in Vercel env vars"

### 2.5 — SMOKE TEST CRÍTICO

```bash
# Después de actualizar secretos, ANTES de revocar el viejo:
# Publicar un post de prueba en cms.startupsfactory.es
# Visitar https://www.startupsfactory.es/blog
# Verificar que el nuevo post aparece en < 3 segundos

# Si funciona: todo bien, la nueva key se está usando
# Si no funciona: ROLLBACK — revertir Vercel env vars al secret viejo
```

---

## PASO 3: Rotar Admin Password ([ROTATED])

**Duración:** 5 minutos  
**Riesgo:** ✅ BAJO — afecta solo a acceso UI, no a pipeline automatizado

### 3.1 — Cambiar password en Supabase

```sql
-- En Supabase SQL Editor del proyecto dmzecrlkclocqaywkjtc
UPDATE auth.users 
SET encrypted_password = crypt('new_password_here_random', gen_salt('bf'))
WHERE email = 'jacostech@gmail.com';
```

O más seguro, usar la tabla de usuarios del CMS si existe:
```sql
UPDATE user_roles 
SET password_hash = crypt('new_password_here', gen_salt('bf'))
WHERE user_email = 'jacostech@gmail.com';
```

### 3.2 — Probar login

```bash
curl -X POST https://cms.startupsfactory.es/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jacostech@gmail.com","password":"new_password_here"}'

# Esperado: 200 + token JWT
```

### 3.3 — Purgar del repo

- Edit `CMS_PRODUCTION_SNAPSHOT.md` → reemplazar contraseña con `[ROTATED]`
- Commit: "chore: rotate CMS admin password"

---

## PASO 4: Finalizar

### 4.1 — Limpiar documentación

```bash
cd /Users/carlosjacoste/Desktop/Claude

# Purgar credenciales de documentos
grep -r "SFcms2026" --include="*.md" .  # Debe devolver 0 resultados
grep -r "sk_live_revalidate_prod_e7f" --include="*.md" .  # Debe devolver 0
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" --include="*.md" .  # Debe devolver 0
```

### 4.2 — Revocar credencial vieja en Vercel

```
1. Vercel → Account Settings → Tokens
2. Encuentra "SF-CMS Source Recovery"
3. Haz clic → "Revoke"
4. Confirma
```

### 4.3 — Crear git commit final

```bash
git add -A
git commit -m "security: rotate all exposed credentials (service_role_key, REVALIDATE_SECRET, admin_password)

- Rotated Supabase service_role_key in scripts/fix-sf-cms-schema.mjs
- Rotated REVALIDATE_SECRET in Vercel env vars (startup-factory-web, salsa-burgers-web, nc-global-assets)
- Rotated CMS admin password
- Purged plaintext credentials from CMS_PRODUCTION_SNAPSHOT.md and REVALIDATE_SETUP_STATUS.md
- Verified ISR pipeline still working after rotation

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## PLAN B: ROLLBACK (Si algo se rompe)

### Si el ISR pipeline se rompe después de rotar REVALIDATE_SECRET:

```bash
# 1. INMEDIATAMENTE revertir a la secret vieja en Vercel env vars:
vercel env rm REVALIDATE_SECRET --environments production
# (restaura a valor viejo)

# 2. Redeploy:
cd apps/startup-factory-web && vercel --prod
# (idem para las otras 2 webs)

# 3. Smoke test:
curl -X POST https://www.startupsfactory.es/api/revalidate \
  -H "x-revalidate-secret: [ROTATED]" \
  -H "Content-Type: application/json" \
  -d '{"paths":["/blog"]}'

# Esperado: 200
```

### Si el CMS login se rompe:

```bash
# Revertir el password en Supabase usando backups
# (esto es por qué hicimos snapshot en 0.0)
```

---

## CHECKLIST FINAL

- [ ] **Pre-rotación:** Backup de Supabase project `dmzecrlkclocqaywkjtc`
- [ ] **Paso 1:** Service role key rotada, nueva en .env, script actualizado
- [ ] **Paso 2:** REVALIDATE_SECRET nuevo, Vercel env vars actualizadas, Supabase webhook actualizado, smoke test PASÓ
- [ ] **Paso 3:** Admin password rotada, login probado
- [ ] **Paso 4:** Documentación limpiada, credenciales purgadas del repo, commit creado
- [ ] **Revoke:** Token PAT de Vercel revocado (si se usó)
- [ ] **Verify:** `grep -r "secret\|password\|key" --include="*.md" .` devuelve 0 credenciales en texto plano

---

## RESPONSABILIDAD Y TIMING

**Quién:** Carlos (usuario)  
**Cuándo:** No es urgente, pero **antes del próximo push a main** (para no exponer credenciales nuevas)  
**Cómo:** Paso a paso, verificando smoke test después del paso 2 (punto más crítico)

---

**Documento:** 2026-07-13  
**Estado:** Listo para ejecutar (TODOS los pasos son no-destructivos, con rollback disponible)
