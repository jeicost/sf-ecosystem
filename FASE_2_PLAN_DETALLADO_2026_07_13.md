# FASE 2: PLAN DETALLADO CON CHECKPOINTS
**Rotación de credenciales + blindaje de infraestructura**

---

## 📋 ESTADO ACTUAL (Verificado)

### Scripts que USAN service_role_key:
1. ✅ `scripts/fix-sf-cms-schema.mjs` — Script manual (no automático)
2. ⚠️ `scripts/adhoc/update-salsa-home.js` — Script viejo, probablemente legacy (verificar con usuario si se usa)
3. ⚠️ `clients/nc-global-assets/import-cms-pages.mjs` — Script de NC Global (verificar si se usa)

### Scripts que NO usan service_role_key (safe):
- `scripts/adhoc/check-db-state.js`
- `scripts/adhoc/fix-salsa-home-complete.js`
- `scripts/adhoc/get-table-schema.js`
- `scripts/adhoc/paso-2-fix-startup-factory.js`
- `scripts/adhoc/paso-3-seed-nc-global.js`

### Dependencias de REVALIDATE_SECRET:
- ✅ Supabase webhook (tabla `posts` en proyecto `dmzecrlkclocqaywkjtc`)
- ✅ 3 endpoints `/api/revalidate` en:
  - `apps/startup-factory-web/app/api/revalidate/route.ts`
  - `clients/salsa-burgers/src/app/api/revalidate/route.ts`
  - `clients/nc-global-assets-next/app/api/revalidate/route.ts`

---

## ⚙️ PLAN EJECUCIÓN (6 fases)

### FASE 2.1: BACKUP DE SUPABASE
**Duración:** 5 minutos  
**Riesgo:** ✅ Cero (solo lectura)

**Pasos:**
1. Entrar en Supabase dashboard: https://app.supabase.com
2. Proyecto: `dmzecrlkclocqaywkjtc`
3. Settings → Backups
4. Crear snapshot manual: "Pre-credential-rotation-2026-07-13"
5. Esperar a que complete (2-3 min)

**Confirmación requerida:** ✋ ¿Hiciste el backup?

---

### FASE 2.2: ACTUALIZAR SCRIPTS LOCALES (ANTES de rotar key)
**Duración:** 10 minutos  
**Riesgo:** ⚠️ Bajo (solo cambios locales)

**Decisión previa:** Los 2 scripts (`update-salsa-home.js` + `import-cms-pages.mjs`) tienen la key hardcoded.

**Opción A:** Borrar scripts legacy (update-salsa-home.js probablemente no se usa)  
**Opción B:** Migrar a env var (más lento)  
**Opción C:** Dejar como están (cuando rotenmos la key, se rompen — pero si son legacy, no importa)

**Pregunta:** ¿Qué prefieres?
- [ ] Borrar los 2 scripts legacy (más limpio)
- [ ] Migrar a env var (más trabajo)
- [ ] Dejar y si se rompen, da igual (más rápido)

---

### FASE 2.3: ROTAR SUPABASE SERVICE_ROLE_KEY
**Duración:** 15 minutos  
**Riesgo:** 🟡 Medio (si algo usa la key, se rompe)

**Pasos en Supabase dashboard:**
1. Settings → API → Project API keys
2. Busca `service_role` (debería estar debajo de `anon`)
3. Haz clic en los 3 puntitos → **Rotate** (no Revoke, que es irreversible)
4. Confirma
5. Copia la **nueva key**

**Luego (actualizar en repo):**
6. Edita `scripts/fix-sf-cms-schema.mjs`:
   - Línea 4: `const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;`
   - Crea `.env.local` (NO committear): `SUPABASE_SERVICE_ROLE_KEY=<nueva-key>`

7. Si migraste los otros scripts a env var (opción B), actualiza también

**Verificación:**
```bash
npm run fix:cms-schema  # Si existe este script
# Esperado: error diciendo que la columna ya existe (OK)
```

**Confirmación requerida:** ✋ ¿Completaste la rotación de service_role_key en Supabase?

---

### FASE 2.4: ROTAR REVALIDATE_SECRET (EL MÁS CRÍTICO)
**Duración:** 45 minutos  
**Riesgo:** 🔴 ALTO si no coordinamos bien

**⚠️ IMPORTANTE:** Este secreto está en 2 lugares que deben sincronizarse:
- Vercel env vars (3 webs)
- Supabase webhook (tabla `posts`)

Si uno tiene el secret nuevo y el otro tiene el viejo, el pipeline rompe.

**Estrategia:** Actualizar Vercel PRIMERO (más rápido), luego Supabase (dashboard manual).

#### Paso 1: Generar nuevo secret
```bash
openssl rand -hex 32
# Salida: a3f7c2e1b9d4f6c8a2e5f1d3b7c9e2a4 (ejemplo)
# Tu nuevo secret: sk_live_a3f7c2e1b9d4f6c8a2e5f1d3b7c9e2a4
```

**Pregunta:** ¿Ya generaste el nuevo secret? ¿Cuál es?

#### Paso 2: Actualizar Vercel env vars (3 webs)

**TÚ EN VERCEL DASHBOARD, POR CADA PROYECTO:**

**Proyecto 1: `startup-factory-web`**
1. Abre https://vercel.com/dashboard
2. Busca proyecto `startup-factory-web`
3. Settings → Environment Variables
4. Busca `REVALIDATE_SECRET`
5. Haz clic en el eye (editar)
6. Borra el valor viejo, pega el nuevo: `sk_live_a3f7c2e1b9d4f6c8a2e5f1d3b7c9e2a4`
7. Save

**Proyecto 2: `salsa-burgers-web`** (mismo proceso)

**Proyecto 3: `nc-global-assets`** o `nc-global-assets-next`** (mismo proceso)

**Confirmación requerida:** ✋ ¿Actualizaste los 3 proyectos en Vercel?

#### Paso 3: Actualizar Supabase webhook

**TÚ EN SUPABASE DASHBOARD:**
1. Proyecto `dmzecrlkclocqaywkjtc`
2. Database → Webhooks
3. Busca webhooks que apunten a `https://www.startupsfactory.es/api/revalidate` (o las otras 2 webs)
4. Edita cada uno
5. Actualiza el `secret` field con el nuevo: `sk_live_a3f7c2e1b9d4f6c8a2e5f1d3b7c9e2a4`
6. Save

**Confirmación requerida:** ✋ ¿Actualizaste los webhooks en Supabase?

#### Paso 4: SMOKE TEST CRÍTICO
Después de actualizar Vercel Y Supabase:

1. Abre https://cms.startupsfactory.es
2. Login: `jacostech@gmail.com` / `[ROTATED]` (aún válida)
3. Crea un POST NUEVO con título "TEST-REVALIDATE-[fecha]"
4. Publica
5. Abre https://www.startupsfactory.es/blog (o la url de blog si existe)
6. **DENTRO DE 5 SEGUNDOS**, debería ver el nuevo post

**Si aparece en < 5s:** ✅ El pipeline funciona, nueva key sincronizada correctamente  
**Si NO aparece en 5s:** 🔴 PROBLEM — webhook o endpoint desincronizado, rollback necesario

**Confirmación requerida:** ✋ ¿Hiciste el smoke test? ¿Funcionó?

---

### FASE 2.5: ROTAR ADMIN PASSWORD DEL CMS
**Duración:** 5 minutos  
**Riesgo:** ✅ Bajo (solo afecta login manual)

**En Supabase dashboard:**
1. Proyecto `dmzecrlkclocqaywkjtc`
2. SQL Editor
3. Ejecuta:
```sql
-- Cambiar password de admin
UPDATE auth.users 
SET encrypted_password = crypt('TU_NUEVA_PASSWORD_SUPER_SEGURA_AQUI', gen_salt('bf'))
WHERE email = 'jacostech@gmail.com';
```

O si eso no funciona, en la tabla `user_roles`:
```sql
UPDATE user_roles 
SET password_hash = crypt('TU_NUEVA_PASSWORD_AQUI', gen_salt('bf'))
WHERE user_email = 'jacostech@gmail.com';
```

**Luego, verifica que funciona:**
1. Logout de cms.startupsfactory.es (si estabas logueado)
2. Login con: `jacostech@gmail.com` / `TU_NUEVA_PASSWORD_AQUI`
3. Debería entrar

**Confirmación requerida:** ✋ ¿Cambiaste la contraseña y verificaste que funciona?

---

### FASE 2.6: AGREGAR `.vercel/project.json` A CLIENTES
**Duración:** 15 minutos  
**Riesgo:** ✅ Cero (solo commits locales)

**Qué hace:** Blindea cada proyecto para que un redeploy vaya al proyecto correcto (previene el incidente de mayo).

**Pasos:**

1. **Estructura de `.vercel/project.json`:**
```json
{
  "projectId": "prj_XXXXXXXX",
  "orgId": "jeicosts-projects"
}
```

2. **Para cada cliente, obtén el projectId:**

```bash
# Salsa Burgers
vercel project inspect salsa-burgers-web 2>/dev/null | grep "ID" | head -1

# NC Global Assets (viejo)
vercel project inspect nc-global-assets 2>/dev/null | grep "ID" | head -1

# NC Global Assets (nuevo)
vercel project inspect nc-global-assets-next 2>/dev/null | grep "ID" | head -1
```

3. **Crea `.vercel/project.json` en cada cliente:**

```bash
# Salsa Burgers
mkdir -p clients/salsa-burgers/.vercel
cat > clients/salsa-burgers/.vercel/project.json << 'EOF'
{
  "projectId": "prj_XXXX",
  "orgId": "jeicosts-projects"
}
EOF

# Idem para nc-global-assets y nc-global-assets-next
```

4. **Commit:**
```bash
git add clients/*/.vercel/project.json
git commit -m "security: add .vercel/project.json to client projects

Prevents accidental redeploy to wrong Vercel project (root cause of 2026-05-17 incident).

- clients/salsa-burgers/.vercel/project.json
- clients/nc-global-assets/.vercel/project.json  
- clients/nc-global-assets-next/.vercel/project.json

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

**Confirmación requerida:** ✋ ¿Aggregaste `.vercel/project.json` a los 3 clientes?

---

### FASE 2.7: PURGAR CREDENCIALES DEL REPO
**Duración:** 10 minutos  
**Riesgo:** ✅ Bajo (ediciones de documentación)

**Edita estos archivos y reemplaza credenciales con placeholders:**

1. **CMS_PRODUCTION_SNAPSHOT.md**
   - Línea 82: Reemplaza `[ROTATED]` con `[ROTATED]`
   - Línea 74: Reemplaza `sk_live_revalidate_prod_e7f...` con `[ROTATED]`

2. **REVALIDATE_SETUP_STATUS.md**
   - Reemplaza password y secret con `[ROTATED]`

3. **REVALIDATE_FINAL_STEPS.md**
   - Idem

4. **scripts/fix-sf-cms-schema.mjs**
   - Línea 5: Ya debería estar usando `process.env.SUPABASE_SERVICE_ROLE_KEY`
   - Verifica que no haya key hardcoded

5. **scripts/adhoc/update-salsa-home.js** (si no lo borraste)
   - Reemplaza key con `[ROTATED]`

6. **clients/nc-global-assets/import-cms-pages.mjs** (si no lo borraste)
   - Reemplaza key con `[ROTATED]`

**Commit:**
```bash
git add CMS_PRODUCTION_SNAPSHOT.md REVALIDATE_*.md scripts/
git commit -m "security: purge plaintext credentials from documentation

- CMS_PRODUCTION_SNAPSHOT.md
- REVALIDATE_SETUP_STATUS.md
- REVALIDATE_FINAL_STEPS.md
- scripts/fix-sf-cms-schema.mjs (now uses env var)
- scripts/adhoc/update-salsa-home.js (credentials removed)
- clients/nc-global-assets/import-cms-pages.mjs (credentials removed)

All credentials now rotated and stored securely in Vercel/Supabase env vars.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

**Confirmación requerida:** ✋ ¿Purgaste credenciales y hiciste commit?

---

## 🎯 RESUMEN FASE 2

| Paso | Duración | Completado |
|------|----------|-----------|
| 2.1 Backup Supabase | 5 min | ☐ |
| 2.2 Actualizar scripts | 10 min | ☐ |
| 2.3 Rotar service_role_key | 15 min | ☐ |
| 2.4 Rotar REVALIDATE_SECRET | 45 min | ☐ |
| 2.5 Rotar admin password | 5 min | ☐ |
| 2.6 Agregar .vercel/project.json | 15 min | ☐ |
| 2.7 Purgar credenciales | 10 min | ☐ |
| **TOTAL** | **~100 min** | |

**Rollback en cualquier momento:** Si algo se rompe, tenemos backup de Supabase + puedes revertir commits de git.

---

## ✋ SIGUIENTE ACCIÓN

**Usuario debe confirmar:**
1. ¿Entiendes el plan?
2. ¿Listo para empezar con el Paso 2.1 (Backup)?
3. ¿Tienes disponible para los ~100 min?
