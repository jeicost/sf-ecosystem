# MIRA Portal v2 — Setup Completo

**Status**: 🟢 OPERACIONAL
**Última actualización**: 2026-07-09
**Usuarios activos**: Natalia (Dadybox), Alessandro (Discoolver) + Carlos (admin)

---

## ✅ Completado Hoy

### 1. **Datos Cargados para 4 Clientes**

Cada cliente tiene:
- ✅ Brand Profile (nombre, misión, tone_of_voice, valores, descripción)
- ✅ 4 Content Pillars completos con descripción
- ✅ Acceso multi-tenant aislado (RLS + client_id)

**Clientes y sus pilares:**

#### Dadybox (e664873b-034d-48cd-9a45-8631672ef375)
- 📍 Radar Logístico — Actualidad, tendencias, crisis logísticas
- 📍 Dadybox en Acción — Servicios y procesos reales
- 📍 Entregas Mágicas — Creatividad en escenarios imposibles
- 📍 E-com Playbook — Frameworks y buenas prácticas

#### Salsa Burgers (c375bb80-b0d1-4923-a73a-ac96a3ce7799)
- 🍔 Drive Craving — Visual storytelling y apetito visual
- 🍔 Ritual & Packaging — Experiencia de desempaque
- 🍔 Brand Cult — Comunidad y lealtad
- 🍔 Trust & Authenticity — Sourcing y craft

#### Discoolver (160d5a90-0da7-4db1-a1fb-9c29ea57a736)
- 📊 Insights & Discovery — Patrones de datos
- 📊 Growth Stories — Casos de crecimiento
- 📊 Audience Mastery — Metodología de audiencia
- 📊 Tech & Innovation — Capacidades técnicas

#### Startup Factory (cef0a1b7-aabb-4239-a5a8-28ece0d1819b)
- 🚀 Ecosystem & Network — Red de conexiones
- 🚀 Build with Purpose — Construcción con propósito
- 🚀 Scale Stories — Historias de escalado
- 🚀 Founders First — Educación founder

### 2. **Brand Brain UI — Completamente Editable**

**4 Tabs funcionales:**

#### 📝 Identidad
- ✅ Nombre (editable inline)
- ✅ Misión (editable textarea)
- ✅ Tono de voz (editable)
- ✅ Valores (display-only array)
- ✅ Descripción (editable textarea)

#### 📍 Pilares
- ✅ Ver todos los pilares del cliente
- ✅ Agregar nuevo pilar (+ botón)
- ✅ Editar nombre del pilar (inline)
- ✅ Editar descripción (inline)
- ✅ Eliminar pilar (con confirmación)

#### 📚 Referencias
- ✅ Agregar referencia (URL + título)
- ✅ Asignar a pilar (dropdown)
- ✅ Notas "¿Por qué funcionó?" (editable)
- ✅ Eliminar referencia (con confirmación)
- ✅ Graciosa si tabla no existe aún

#### 🎨 Visuales
- ✅ Colores principales (Navy, Verde, Blanco, Rojo)
- ✅ Tipografía (Poppins, DM Sans, Inter)
- ✅ Información de uso para cada color/fuente

### 3. **Endpoints API Nuevos**

#### POST `/api/populate-all-clients`
Carga datos para los 4 clientes en 1 call:
- 4/4 brand profiles ✅
- 16/16 content pillars ✅

#### GET `/api/memory/save`
Genera memoria automática de cambios en Brand Brain:
- Captura perfil, pilares, referencias
- Estructura JSON para IA
- Timestamp automático

#### POST `/api/ensure-tables`
Verifica e intenta crear tabla `brand_references`:
- Check automático
- Script SQL para fallback manual

---

## 📋 Setup Manual Requerido (5 min)

### 1. Crear tabla `brand_references` en Supabase

Ir a: **SQL Editor** → **New Query** → Copiar/pegar:

```sql
CREATE TABLE IF NOT EXISTS brand_references (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  url text NOT NULL,
  title text NOT NULL,
  pillar text,
  why_worked text,
  what_to_repeat text,
  created_at timestamp WITH TIME ZONE DEFAULT now(),
  updated_at timestamp WITH TIME ZONE DEFAULT now(),
  UNIQUE(client_id, url)
);

CREATE INDEX IF NOT EXISTS idx_brand_references_client_id ON brand_references(client_id);
ALTER TABLE brand_references ENABLE ROW LEVEL SECURITY;

CREATE POLICY brand_references_select ON brand_references
  FOR SELECT
  USING (
    client_id = auth.jwt() ->> 'client_id'
    OR EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'plan' IN ('admin', 'super_admin'))
  );

CREATE POLICY brand_references_insert ON brand_references
  FOR INSERT
  WITH CHECK (
    client_id = auth.jwt() ->> 'client_id'
    OR EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'plan' IN ('admin', 'super_admin'))
  );

CREATE POLICY brand_references_update ON brand_references
  FOR UPDATE
  USING (
    client_id = auth.jwt() ->> 'client_id'
    OR EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'plan' IN ('admin', 'super_admin'))
  )
  WITH CHECK (
    client_id = auth.jwt() ->> 'client_id'
    OR EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'plan' IN ('admin', 'super_admin'))
  );

CREATE POLICY brand_references_delete ON brand_references
  FOR DELETE
  USING (
    client_id = auth.jwt() ->> 'client_id'
    OR EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'plan' IN ('admin', 'super_admin'))
  );
```

**Luego**: → **Run** ✅

---

## 🧪 Verificación End-to-End

```bash
# 1. Dev server
cd apps/mira/portal && npm run dev

# 2. Abrir navegador
https://localhost:3000

# 3. Probar cada cliente:
# - Login como Natalia (Dadybox)
# - Login como Alessandro (Discoolver)
# - Login como Carlos (admin, todos)

# 4. Para cada cliente:
# ✅ Brand Brain carga correcto (nombre del cliente)
# ✅ Pestaña Identidad muestra datos
# ✅ Pestaña Pilares muestra 4 pilares
# ✅ Puedo editar nombre/misión/descripción
# ✅ Puedo agregar/eliminar pilares
# ✅ Puedo agregar referencias
```

---

## 📊 Arquitectura de Aislamiento

```
User Login (Supabase Auth)
    ↓
user.user_metadata.client_id
    ↓
lib/client-context.tsx (CLIENT_NAMES hardcoded)
    ↓
Query con .eq('client_id', clientId)
    ↓
RLS policies en Supabase
    ↓
100% data isolation por cliente
```

**Client IDs fijos:**
```typescript
const CLIENT_NAMES = {
  'e664873b-034d-48cd-9a45-8631672ef375': { name: 'Dadybox', slug: 'dadybox' },
  'c375bb80-b0d1-4923-a73a-ac96a3ce7799': { name: 'Salsa Burgers', slug: 'salsa-burgers' },
  '160d5a90-0da7-4db1-a1fb-9c29ea57a736': { name: 'Discoolver', slug: 'discoolver' },
  'cef0a1b7-aabb-4239-a5a8-28ece0d1819b': { name: 'Startup Factory', slug: 'startup-factory' },
}
```

---

## 🚀 Próximos Pasos (Fase 3)

1. **Asistente IA del Brand Brain** — Conectar BrainChat al tab "Asistente" (ya existe, solo necesita montarse)
2. **Panel de integraciones BYOK** — Agregar campos para API keys de Claude/OpenAI por cliente
3. **Sincronización de 30 agentes** — El Brand Brain alimenta los prompts de agents
4. **Memoria automática en MD** — Cambios en Brand Brain → actualización de archivo de contexto

---

## 📝 Notas de Seguridad

✅ **RLS activo** — Ningún cliente ve datos de otro
✅ **Service role rotado** — Nunca hardcodeada en código
✅ **Auth proxy** — Todos los endpoints requieren sesión válida
✅ **Client ID verificado** — Sesión debe coincidir con recurso

---

## 🔗 URLs de Trabajo

**Vercel (producción)**: `sf-crm-phi.vercel.app`
**Local**: `localhost:3000`
**Supabase**: `nnevhtfxuawexliwlbmh.supabase.co`
**Base datos**: `clients`, `brand_profiles`, `content_pillars`, `brand_references` (crear)

---

**Commit**: `d1a8314` — "feat: complete Brand Brain with CRUD pillars + references + memory system"
