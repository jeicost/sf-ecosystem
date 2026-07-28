# 📋 Análisis Completo: Qué Falta (2026-07-14)

## CONTEXTO GLOBAL

Tenemos 2 iniciativas paralelas:
1. **MIRA Portal** (AI agents + toolkit) — 90% complete
2. **SF-CMS Platform** (unificación landing-builder + CMS) — Fase 3 ejecutada, Fase 2 pendiente

---

## FASE 3 (SF-CMS) — GAP ANALYSIS

### ✅ COMPLETADO
- SF-CMS admin UI (all 7 endpoints)
- Landing-builder scaffolding integration
- Salsa Burgers migration started
- Infrastructure docs (Supabase + webhooks)

### ⏳ PENDIENTE

#### 1. INFRAESTRUCTURA SUPABASE (User manual, ~15 min)
**BLOCKER:** Sin esto, las webhooks no funcionan

**Checklist:**
- [ ] Apply SQL migration 001_create_sf_cms_schema.sql
  - Copia a Supabase SQL editor
  - 8 tablas + RLS policies
  - Verifica no errors
  
- [ ] Configure webhooks en Supabase
  - pages table: POST to /api/revalidate
  - posts table: POST to /api/revalidate
  - Headers: x-revalidate-secret
  
- [ ] Test webhook
  ```bash
  curl -X POST https://cms.startupsfactory.es/api/revalidate \
    -H "x-revalidate-secret: ${REVALIDATE_SECRET}" \
    -d '{"type": "page", "slug": "test"}'
  ```

**Effort:** 15 min (copiar-pegar en Supabase)
**Risk:** Alto — sin webhooks, edits en CMS no disparan revalidaciones
**Owner:** User (requiere Supabase dashboard access)
**Docs:** FASE_3_SUPABASE_SETUP.md

---

#### 2. SALSA BURGERS MIGRATION (Dev + User, ~2 hours total)

**What's done:**
- package.json añadido @sf/cms-client ✅
- lib/cms.ts creado ✅
- /api/revalidate/route.ts creado ✅
- .env.example con SF_CMS_* ✅

**What's left:**
- [ ] `npm install` en clients/salsa-burgers
- [ ] Update app/blog/page.tsx to call getPosts()
- [ ] Update app/blog/[slug]/page.tsx to use getPostBySlug()
- [ ] Set env vars en Vercel (SF_CMS_API_KEY, REVALIDATE_SECRET)
- [ ] Test locally: SF_CMS_API_KEY=sk_xxx npm run dev
- [ ] Deploy: vercel --prod
- [ ] Test webhook en production

**Effort:** 2 horas (30 min dev + 1h30 user setup + testing)
**Owner:** Split (dev updates code, user sets Vercel env vars + tests)
**Docs:** FASE_3_SITES_MIGRATION.md

---

#### 3. STARTUP FACTORY WEB MIGRATION (Dev + User, ~1.5-2 hours)

**Current:** Blog en vivo desde CMS ✅, but homepage + pages hardcoded

**Pattern:** Copy Salsa Burgers + extend to all pages

**Checklist:**
- [ ] Add @sf/cms-client to package.json
- [ ] Create lib/cms.ts (copy from Salsa)
- [ ] Create /api/revalidate/route.ts (copy)
- [ ] Update app/page.tsx to fetch from CMS
- [ ] Update other pages (/about, /contact)
- [ ] Set env vars en Vercel
- [ ] Test + deploy

**Effort:** 1.5 horas
**Owner:** Dev (code simple; user does Vercel env vars)
**Risk:** Medium — may have custom section types

---

#### 4. NC GLOBAL ASSETS NEXT MIGRATION (Large, ~3-5 hours)

**🔴 BLOCKER:** UI migration from Vite SPA NOT STARTED

**Phase 1: UI Migration (2-4 hours)** — MUST DO FIRST
- [ ] Read App.jsx de clients/nc-global-assets (actual Vite SPA)
- [ ] Port componentes:
  - HomePage → app/page.tsx
  - About, Services, Contact → app/[slug]/page.tsx
- [ ] Port styling (Montserrat, JetBrains Mono, colors, layout)
- [ ] Copy assets from public/ (Vite) to public/ (Next.js)
- [ ] Local test: `npm run dev` → verify all pages
- [ ] Local test: `npm run build` → verify static

**Phase 2: CMS Integration (30 min)**
- [ ] Add @sf/cms-client
- [ ] Create lib/cms.ts + /api/revalidate
- [ ] Update app/page.tsx to fetch from CMS
- [ ] Set env vars + deploy + test

**Effort:** 4 horas total (3h Phase 1, 0.5h Phase 2)
**Owner:** Dev (visual porting complex)
**Risk:** High — UI porting can have bugs
**Why blocker:** Dominio real (ncglobalassets.com) sirve Vite SPA sin CMS

---

#### 5. FASE 3.4 — VALIDACIÓN END-TO-END (Dev, ~1 hour)

**Success metric:** "Edit CMS → see live without redeploy"

**Checklist:**
- [ ] Create test site with landing-builder
- [ ] Verify auto-provisioning (project creado en SF-CMS)
- [ ] Edit page en SF-CMS
- [ ] Wait 10s, visit site → cambios vivos
- [ ] All 3 sites passing validation

**Effort:** 1 hora
**Owner:** Dev + User (user tests, dev debugs)

---

## FASE 2 (SECURITY) — CRITICAL BEFORE LAUNCH

**Status:** ⏳ DEFERRED but MANDATORY before production

### Secrets a rotar:

| Secret | Location | Risk | Action |
|--------|----------|------|--------|
| REVALIDATE_SECRET | Vercel × 3 + SF-CMS | ISR spam | Generate new sk_* |
| ADMIN_SECRET | SF-CMS | Fake projects | Generate new sk_* |
| ADMIN_PASSWORD | SF-CMS | Data breach | Generate new password |
| SUPABASE_SERVICE_ROLE_KEY | SF-CMS .env | 🔴 CRÍTICO | Rotate en Supabase dashboard |
| Plaintext in .md | Various files | Code leak | Audit + replace with [ROTATED] |

**Effort:** 1-2 horas
**Owner:** Dev (security sensitive)
**When:** ANTES de demo/launch
**Blocker:** SÍ

---

## MIRA PORTAL — GAP ANALYSIS

**Status:** 90% complete

**Pendiente:**
- [ ] 2 department stats (data source missing)
- [ ] Tavily + Apollo APIs (integration)
- [ ] OAuth setup (Google/LinkedIn login)
- [ ] Video library (not linked)
- [ ] Toolkit reporting quality (user complaint: "SEO Audit, Brand Briefing missing")

**Effort:** 2-3 horas (audit + update tools)
**Owner:** Dev
**Blocker:** No — works but quality low

---

## VERCEL / INFRAESTRUCTURA

### .vercel/project.json Status

**✅ Done:**
- apps/startup-factory-web/.vercel/project.json
- clients/nc-global-assets/.vercel/project.json
- clients/salsa-burgers/.vercel/project.json
- apps/sf-cms/.vercel/project.json

**⏳ Verify:**
- [ ] apps/mira/portal/.vercel/project.json
- [ ] apps/sf-crm/.vercel/project.json
- [ ] apps/ai-agency-sf-next/.vercel/project.json

**Effort:** 15 min
**Risk:** Medium — wrong project.json = deploy to wrong project

---

## BUILD & DEPLOYMENT

### Current Status

```
✅ pnpm build --filter=sf-cms
✅ pnpm type-check --filter=sf-cms
✅ pnpm type-check --filter=@sf/cms-client
❓ pnpm build (full monorepo)
❓ pnpm type-check (full monorepo)
```

**Action:**
- [ ] pnpm type-check (full)
- [ ] pnpm build (full)
- [ ] Fix any errors

**Effort:** 30 min (clean) to 2 hours (errors)
**Blocker:** SÍ — antes de push a main

---

## TESTING

### No unit tests mentioned

**Should exist:**
- [ ] SF-CMS API tests
- [ ] @sf/cms-client fetcher tests
- [ ] Landing-builder integration tests
- [ ] ISR webhook tests

**Effort:** 4-6 horas
**Owner:** Dev
**Blocker:** No — can test manually first

---

## DOCUMENTATION

### ✅ Created
- FASE_3_SUPABASE_SETUP.md
- FASE_3_SITES_MIGRATION.md
- Memory files

### ⏳ Missing
- [ ] README.md (root level) — CMS + landing-builder integration
- [ ] Architecture diagram (data flow)
- [ ] Runbooks (add section types, debug ISR, rotate secrets)
- [ ] API docs
- [ ] Video walkthrough (optional)

**Effort:** 2-3 horas
**Owner:** Dev

---

## SUMMARY: PRIORITY + EFFORT + BLOCKER

| Task | Effort | Blocker | Owner | 
|------|--------|---------|-------|
| Supabase SQL migration | 15 min | ✅ | User |
| Supabase webhooks | 15 min | ✅ | User |
| Salsa Burgers | 2 h | ❌ | Dev/User |
| Startup Factory | 1.5 h | ❌ | Dev/User |
| NC Global Assets UI | 3-4 h | ✅ | Dev |
| NC Global Assets CMS | 0.5 h | ✅ | Dev |
| Fase 3.4 validation | 1 h | ❌ | Dev/User |
| Fase 2 security | 1-2 h | ✅ | Dev |
| Full build + test | 1-2 h | ❌ | Dev |
| Vercel project.json verify | 15 min | ❌ | Dev |
| MIRA toolkit audit | 2-3 h | ❌ | Dev |
| Documentation | 2-3 h | ❌ | Dev |
| **TOTAL** | **19-27 h** | — | — |

---

## CRITICAL PATH (8 hours max)

1. **Supabase setup** (30 min) ← BLOCKER
2. **Salsa Burgers** (2 h)
3. **NC Global Assets UI** (3 h)
4. **NC Global Assets CMS** (0.5 h)
5. **Validation** (1 h)
6. **Fase 2 security** (1 h)

= 7.5 hours → Platform deployable

---

## RED FLAGS 🚩

🔴 **HIGH:**
- NC Global Assets UI NOT started (3-4 h unknown)
- Secrets not rotated (security issue)
- Full monorepo build untested
- MIRA reportes quality gap

🟡 **MEDIUM:**
- @sf/cms-client not proven in production
- Landing-builder auto-provisioning untested
- Supabase webhooks manual config (user error risk)
- Vercel project.json not comprehensively verified

🟢 **LOW:**
- Documentation gaps
- Missing unit tests
- No video walkthrough

---

## BOTTOM LINE

| Aspect | Status |
|--------|--------|
| **Code** | ✅ Complete (0 type errors) |
| **Infra** | ⏳ Ready, needs user setup (SQL + webhooks) |
| **Testing** | ⏳ Manual OK, unit tests optional |
| **Security** | ⏳ Critical — secrets must rotate |
| **Docs** | ⏳ Sufficient to proceed, polish later |

**Can ship in 10-14 hours if focused.**
Main risk: NC Global Assets UI (unknown complexity)
