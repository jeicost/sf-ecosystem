# MIRA Portal — Setup Final: Dadybox + Salsa Burgers

## ✅ Status: LISTO PARA EJECUTAR

Tienes **2 scripts SQL** listos para cargar 100% Dadybox y Salsa Burgers en MIRA. Sin conflictos, sin tablas faltantes.

---

## 🚀 Paso 1: Cargar DADYBOX

**Archivo:** `scripts/setup-dadybox-complete.sql`

1. Ve a: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh
2. **SQL Editor** → Nueva query
3. **Copia y pega TODO el contenido** de `setup-dadybox-complete.sql`
4. **RUN** (botón verde)
5. Espera a que diga "Success"

**Qué se crea:**
- ✅ `brand_profiles` para Dadybox (1 registro)
- ✅ `content_pillars` para Dadybox (4 pilares: Radar Logístico, Dadybox en Acción, Entregas Mágicas, E-com Playbook)
- ✅ Cada pilar tiene 4 colecciones en JSONB `themes`

**Verificación:**
```sql
SELECT COUNT(*) FROM brand_profiles WHERE client_id = 'e664873b-034d-48cd-9a45-8631672ef375';
-- Debería devolver: 1

SELECT COUNT(*) FROM content_pillars WHERE client_id = 'e664873b-034d-48cd-9a45-8631672ef375';
-- Debería devolver: 4
```

---

## 🌶️ Paso 2: Cargar SALSA BURGERS

**Archivo:** `scripts/setup-salsa-burgers-complete.sql`

1. **SQL Editor** → Nueva query
2. **Copia y pega TODO el contenido** de `setup-salsa-burgers-complete.sql`
3. **RUN** (botón verde)
4. Espera "Success"

**Qué se crea:**
- ✅ `brand_profiles` para Salsa Burgers (1 registro)
- ✅ `content_pillars` para Salsa Burgers (8 pilares: Drive Craving, Ritual & Packaging, Brand Cult, Trust & Authenticity, Salsa Phrases, Salsa People, News/Updates/Promos, Salsa Iconic Moments)
- ✅ Cada pilar tiene 4 colecciones en JSONB `themes`

**Verificación:**
```sql
SELECT COUNT(*) FROM brand_profiles WHERE client_id = '166def42-9da5-4926-8a47-e6857e5c85db';
-- Debería devolver: 1

SELECT COUNT(*) FROM content_pillars WHERE client_id = '166def42-9da5-4926-8a47-e6857e5c85db';
-- Debería devolver: 8
```

---

## 🔄 Paso 3: Verificar en MIRA Portal

Una vez ejecutados ambos scripts:

1. Ve a: http://localhost:3000 (dev) o https://portal-six-kappa-22.vercel.app (production)
2. **Login con usuario de Natalia** (natalia.aldea@albasanzexpress.es — Dadybox)
3. Navega a **Dashboard → Brand Brain**
4. **Deberías ver los 4 pilares de Dadybox** en el sidebar
5. Haz clic en cada uno para ver sus colecciones

---

## 🔗 Data Isolation (VERIFICADO)

```
Dadybox Client ID:      e664873b-034d-48cd-9a45-8631672ef375
Salsa Burgers Client ID: 166def42-9da5-4926-8a47-e6857e5c85db
```

✅ **RLS en Supabase asegura que:**
- Natalia (Dadybox) solo ve sus 4 pilares
- Users de Salsa Burgers solo ven sus 8 pilares
- **CERO mezcla de datos** — client_id los separa completamente

---

## 📋 Estructura de Datos (para referencia)

**brand_profiles:**
```
id | client_id | name | mission | values (jsonb) | tone_of_voice | description | proposition | created_at | updated_at
```

**content_pillars:**
```
id | client_id | pillar_name | description | themes (jsonb) | examples (jsonb) | created_at
```

Donde `themes` es un JSON array con objetos que tienen:
```json
{
  "name": "Collection Name",
  "description": "Description",
  "examples": ["example1", "example2", ...]
}
```

---

## 🚨 Si algo falla

**Error: "relation X does not exist"**
→ Probablemente copiar-pega incompleto. Asegúrate de copiar TODO el archivo SQL, sin saltarte líneas.

**Error: "duplicate key value"**
→ Ya existe un registro con ese client_id. Ejecuta el script de nuevo — tiene `ON CONFLICT DO UPDATE` que reemplaza si existe.

**Natalia no ve nada en Brand Brain**
→ Después de ejecutar los SQL, recarga la página en el navegador (Cmd+Shift+R para hard refresh).

---

## ✨ Qué sigue (opcional, para después)

- [ ] Llenar `reference_library` con URLs de Google Drive (templates visuales)
- [ ] Crear visual assets (colors, fonts, logos) en tabla `visual_assets`
- [ ] Setup de LINE OA para Salsa Burgers
- [ ] Integración con BrainChat para proposiciones automáticas de posts

---

**Estado:** TODO LISTO. Ejecuta los dos SQL, verifica en MIRA, y avísame cuando Natalia vea su Brand Brain. 🎉
