# MIRA PORTAL v2 — Setup Completo

**Fecha:** 2026-07-08  
**Estado:** 90% OPERATIVO — Datos en Supabase cargados ✅  
**Próxima sesión:** Actualizar Claude + Visual Studio → Continuar con UI fixes

---

## 📊 ESTADO ACTUAL

### ✅ COMPLETADO

1. **Dadybox (Cliente)**
   - Client ID: `e664873b-034d-48cd-9a45-8631672ef375`
   - Brand Profile: CARGADO ✅
   - 4 Content Pillars: CARGADOS ✅
     - Radar Logístico
     - Dadybox en Acción
     - Entregas Mágicas
     - E-com Playbook
   - User: Natalia (natalia.aldea@albasanzexpress.es) → Acceso confirmado ✅

2. **Salsa Burgers (Cliente)**
   - Client ID (real en BD): `c375bb80-b0d1-4923-a73a-ac96a3ce7799`
   - Brand Profile: CARGADO ✅
   - 8 Content Pillars: CARGADOS ✅
     - Drive Craving
     - Ritual & Packaging
     - Brand Cult
     - Trust & Authenticity
     - Salsa Phrases
     - Salsa People
     - News, Updates & Promotions
     - Salsa Iconic Moments

3. **Supabase**
   - Project: `nnevhtfxuawexliwlbmh`
   - Service Role Key: 🔐 stored in Vercel env vars (rotated)
   - Tablas pobladas:
     - `brand_profiles` (2 clientes)
     - `content_pillars` (12 pillars = 4 Dadybox + 8 Salsa)
     - `clients` (4 clientes totales: Dadybox, Salsa Burgers, Discoolver, Startup Factory)

4. **MIRA Portal Vercel**
   - URL: https://portal-six-kappa-22.vercel.app
   - Estado: 🟢 RUNNING
   - Login: ✅ Funciona (Natalia confirmado)
   - Dashboard: ✅ Visible

---

## ❌ PENDIENTE

### High Priority
1. **Brand Brain UI no muestra pillars**
   - Problema: Página muestra wizard/form pero no carga los pillars desde BD
   - Causa probable: Supabase query no retorna datos o componente no está refrescando
   - Solución: Revisar `app/(dashboard)/brain/page.tsx` → query de content_pillars por client_id
   - Workaround: Verificar RLS policies de Supabase

2. **Verificar RLS (Row Level Security)**
   - Cada cliente debe ver SOLO sus propios pilares
   - Test: Login como Natalia (Dadybox) → debería ver 4 pillars
   - Test: Login como otro usuario (Salsa) → debería ver 8 pillars
   - If failing: Revisar `supabase/migrations` para RLS policies

### Medium Priority
3. **Complete Brand Brain Editable Fields**
   - tone_of_voice, description, proposition ya están en BD
   - Falta UI para editar estos campos
   - Falta tab para Content Pillars CRUD

4. **Google Drive Integration**
   - Phase 3 requirement: Visual assets upload vía Drive OAuth
   - Not started yet

5. **Reference Library Population**
   - 0/32 references loaded (4 Dadybox pillars × 4 collections + 8 Salsa × 4 = 32 expected)
   - URLs from Google Drive folders not extracted
   - Visual assets library not created

6. **Salsa Burgers ID Mismatch**
   - Expected: `166def42-9da5-4926-8a47-e6857e5c85db`
   - Real in BD: `c375bb80-b0d1-4923-a73a-ac96a3ce7799`
   - Action: Update any hardcoded references to use REAL ID

---

## 🔑 CREDENCIALES & CONFIG

### Supabase
```
Project ID: nnevhtfxuawexliwlbmh
URL: https://nnevhtfxuawexliwlbmh.supabase.co
Service Role Key: 🔐 stored in Vercel env vars (rotated)
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZXZodGZ4dWF3ZXhsaXdsYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDUzNTUsImV4cCI6MjA5MzUyMTM1NX0.BTQkTUL4rOzhQXC0kPlcyn5xQ8M45Qps3lIZmrGP2Ww
```

### MIRA Portal
```
Production: https://portal-six-kappa-22.vercel.app
Dev: http://localhost:3000 (source code missing — needs rebuild)
Dev command: npx next dev (turbo not installed)
```

### Users
```
Natalia (Dadybox):
- Email: natalia.aldea@albasanzexpress.es
- Password: (via reset link — user sets own)
- Client ID: e664873b-034d-48cd-9a45-8631672ef375

Alessandro (Discoolver):
- Email: alessandro@discoolver.com
- Password: (via reset link — user sets own)
- Client ID: 160d5a90-... (verify in Supabase)
```

---

## 📁 GOOGLE DRIVE FOLDERS

### Dadybox
- Drive ID: (from previous session)
- Pillars: Radar Logístico, Dadybox en Acción, Entregas Mágicas, E-com Playbook
- Templates: Visual templates per pilar

### Salsa Burgers  
- Drive ID: `18W6I55WQgUFCKB-H0HiWWud2yzKp5Wsw`
- Pillars: 8 folders with templates
  - BRAND CULT (with subfolders)
  - CRAVING (with subfolders)
  - NEWS UPDATES & PROMOTIONS (PNG templates)
  - SALSA ICONIC MOMENTS
  - SALSA PEOPLE
  - SALSA PHRASES
  - SALSA RITUAL & PACKAGING
  - TRUST AND AUTHENTICITY

---

## 📋 SQL SCRIPTS GENERATED

All SQL scripts ready to load Brand Brain data into Supabase:

```
/Users/carlosjacoste/Desktop/Claude/scripts/
├── setup-dadybox-complete.sql (4 pillars, brand profile)
├── setup-salsa-burgers-complete.sql (8 pillars, brand profile)
├── insert-salsa-pillars.sql (alternative SQL)
└── salsa-burgers-brand-profile.json (complete identity data)
```

---

## 🎯 NEXT STEPS (After Claude + VSCode Update)

### Session 2 Tasks (Priority Order)

1. **Fix Brand Brain Data Loading**
   - Debug why pillars don't display in UI
   - Check Supabase RLS policies
   - Verify `content_pillars` query in `app/(dashboard)/brain/page.tsx`
   - Test with hard refresh (Cmd+Shift+R)

2. **Test Multi-Tenant Isolation**
   - Login as Natalia → see 4 Dadybox pillars only
   - Create test user for Salsa → see 8 Salsa pillars only
   - Verify no data leaks between clients

3. **Rebuild Dev Environment**
   - Find source code for `apps/mira/portal` (only .next/ exists)
   - OR: Recreate local dev setup from Vercel deployment
   - Install turbo or adjust dev command

4. **Content Pillars CRUD**
   - Build edit UI for pillar details
   - Add create/delete pillar functionality
   - Test via Brand Brain page

5. **Reference Library Population**
   - Extract template URLs from Google Drive folders
   - Create reference_library entries for each pillar
   - Link to visual assets

6. **User Onboarding**
   - Send password reset links to Natalia, Alessandro
   - Verify they can login and see their client data
   - Walk through Brand Brain UI

---

## 📊 TOTAL DATA LOADED

| Entity | Count | Status |
|--------|-------|--------|
| Clients | 4 | ✅ |
| Brand Profiles | 2 | ✅ |
| Content Pillars | 12 | ✅ |
| References | 0 | ❌ (pending) |
| Users | 1 | ✅ (Natalia) |

---

## 🔗 IMPORTANT LINKS

- Supabase Dashboard: https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/settings/api
- MIRA Production: https://portal-six-kappa-22.vercel.app
- GitHub: /Users/carlosjacoste/Desktop/Claude

---

## 📝 NOTES

- **Vercel cache may need clearing** if changes don't appear immediately
- **RLS policies are critical** — without them, clients see each other's data
- **Source code missing** from `apps/mira/portal` — only build artifacts exist
- **Google Drive templates not yet extracted** — Phase 3 work (Drive OAuth integration)
- **Salsa Burgers ID discrepancy** — use `c375bb80-b0d1-4923-a73a-ac96a3ce7799` (real BD ID)

---

**Session saved:** 2026-07-08 16:31 UTC  
**Ready for:** Claude + VSCode Update → Continue Session 2
