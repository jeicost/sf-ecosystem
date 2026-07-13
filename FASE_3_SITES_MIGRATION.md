# Fase 3.3 — Migrate 3 Sites to @sf/cms-client

## Status Summary

| Site | Status | Pattern | Work Required |
|------|--------|---------|---|
| **Salsa Burgers** | ✅ Updated | fetch-cms-content.mjs → @sf/cms-client | package.json + lib/cms.ts + /api/revalidate |
| **Startup Factory** | ⏳ To Do | partial CMS (blog only) | extend pattern to all pages |
| **NC Global Assets** | ⏳ To Do | SPA → Next.js migration | complete UI migration first, then CMS |

---

## Salsa Burgers (DONE in this session)

### Files Changed
- `package.json` — added `@sf/cms-client` dependency
- `src/lib/cms.ts` — NEW: fetchers wrapper
- `src/app/api/revalidate/route.ts` — NEW: webhook handler
- `.env.example` — NEW: template with SF_CMS_* vars

### How It Works

**Old pattern (fetch-cms-content.mjs):**
```
Build time: npm run build → node fetch-cms-content.mjs → writes content/*.json → next build → static HTML
```

**New pattern (@sf/cms-client):**
```
Build time: npm run build → next build (pages fetch live from CMS)
Runtime: User visits page → server-side fetch via getPages/getPosts → ISR cache (60s)
Webhook: CMS edit → Supabase webhook → POST /api/revalidate → revalidatePath() → next visit serves fresh
```

### Migration Checklist

- [x] Added @sf/cms-client to dependencies
- [x] Created lib/cms.ts with fetchers
- [x] Created /api/revalidate webhook handler
- [x] Created .env.example with SF_CMS_* vars
- [ ] Update app/page.tsx to call getPages() for homepage sections (if needed)
- [ ] Update src/app/blog/page.tsx to call getPosts() instead of reading from JSON
- [ ] Update src/app/blog/[slug]/page.tsx to call getPostBySlug() instead of generateStaticParams
- [ ] Set env vars in Vercel project settings
- [ ] Test webhook: curl -X POST https://salsaburgers.com/api/revalidate ...
- [ ] Remove scripts/fetch-cms-content.mjs once tested

### Action Items (user manual)

1. **Install dependencies:**
   ```bash
   cd clients/salsa-burgers
   npm install
   ```

2. **Set env vars in Vercel:**
   - SF_CMS_API_URL=https://cms.startupsfactory.es
   - SF_CMS_API_KEY=[from SF-CMS project settings]
   - SF_CMS_PROJECT_SLUG=salsaburgers
   - REVALIDATE_SECRET=[same as SF-CMS webhook secret]

3. **Test locally:**
   ```bash
   SF_CMS_API_KEY=sk_xxx npm run dev
   # Visit http://localhost:3000/blog — should load posts from CMS
   ```

4. **Deploy & test webhook:**
   ```bash
   vercel --prod
   # Once deployed, configure Supabase webhook (see FASE_3_SUPABASE_SETUP.md Step 3)
   ```

---

## Startup Factory Web (TODO — Quick)

### Current State
- Blog posts fetch live from CMS ✅
- Homepage + pages use hardcoded content ❌

### Migration Path

**File: `apps/startup-factory-web/src/app/page.tsx`**

Replace hardcoded sections with CMS fetch:

```typescript
// OLD
const sections = [
  { id: 'hero', title: 'Hero Title', ... },
  { id: 'features', title: 'Features', ... },
]

// NEW
import { getPages } from '@sf/cms-client'

export default async function Home() {
  const page = await getPages('startup-factory', { apiKey: process.env.SF_CMS_API_KEY })
    .then(pages => pages.find(p => p.slug === 'homepage'))
  
  const sections = page?.sections_json || []
  return <RenderSections sections={sections} registry={componentRegistry} />
}
```

**What changes:**
1. Add @sf/cms-client to package.json
2. Create lib/cms.ts (copy from Salsa Burgers)
3. Create /api/revalidate/route.ts (copy from Salsa Burgers)
4. Update app/page.tsx to fetch `getPages('startup-factory').then(pages => pages.find(p => p.slug === 'homepage'))`
5. Repeat for `/about`, `/services`, `/contact` pages
6. Set env vars: SF_CMS_API_URL, SF_CMS_API_KEY, SF_CMS_PROJECT_SLUG=startup-factory
7. Update Supabase webhook to point to https://startupsfactory.es/api/revalidate

**Estimated time:** 1-2 hours (depends on number of unique pages)

---

## NC Global Assets Next (TODO — Large)

### Current State
- Partial Next.js migration (from Vite SPA)
- app/layout.tsx + blog/[slug] done
- app/page.tsx is placeholder (needs UI migration)

### Two-Phase Approach

**Phase 1: Finish UI Migration** (2-4 hours)
- Port App.jsx → app/page.tsx (homepage)
- Port pages (About, Services, etc.) → app/about/page.tsx, etc.
- Port styling (fonts, colors, layout)
- Verify all pages render locally

**Phase 2: Add CMS Integration** (30 min)
- Add @sf/cms-client
- Create lib/cms.ts
- Create /api/revalidate/route.ts
- Update homepage/pages to fetch from CMS
- Set env vars
- Test webhook

### Migration Checklist

Phase 1 (UI):
- [ ] Read App.jsx and understand component structure
- [ ] Port HomePage → app/page.tsx
- [ ] Port About, Services, etc. → app/[slug]/page.tsx
- [ ] Port CSS imports + Montserrat + JetBrains Mono fonts
- [ ] Copy public/assets images to public/
- [ ] Local test: npm run dev → verify all pages render
- [ ] Local test: npm run build → verify static generation works

Phase 2 (CMS):
- [ ] Add @sf/cms-client to package.json
- [ ] Create lib/cms.ts
- [ ] Create /api/revalidate/route.ts
- [ ] Update app/page.tsx to getPages('nc-global-assets')
- [ ] Set env vars in Vercel
- [ ] Configure Supabase webhook to https://ncglobalassets.com/api/revalidate
- [ ] Test: edit page in CMS → visit site → verify changes appear without redeploy

---

## Environment Variables Template

**All three sites need these:**

```env
# CMS Integration
SF_CMS_API_URL=https://cms.startupsfactory.es
SF_CMS_API_KEY=sk_xxxxx                    # from SF-CMS project settings
SF_CMS_PROJECT_SLUG=salsaburgers           # unique per project

# ISR Webhook
REVALIDATE_SECRET=sk_xxxxx                 # must match Supabase webhook header

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXX

# Admin (for landing-builder auto-provisioning, optional)
ADMIN_SECRET=sk_xxxxx
```

---

## Testing Each Site

**After migration, test with:**

```bash
# Test CMS fetch
curl -X GET "https://cms.startupsfactory.es/api/public/pages?project=PROJECT_SLUG" \
  -H "x-api-key: SF_CMS_API_KEY"

# Test revalidate webhook
curl -X POST "https://domain.com/api/revalidate" \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: REVALIDATE_SECRET" \
  -d '{"type": "page", "slug": "homepage"}'

# Expected response:
# {"revalidated": true, "timestamp": "..."}
```

---

## Post-Migration Cleanup

Once all sites are migrated and webhooks working:

1. Delete scripts/fetch-cms-content.mjs from each site
2. Update build scripts to remove `node scripts/fetch-cms-content.mjs &&` prefix
3. Remove old CMS_API_URL / CMS_API_KEY / PROJECT_SLUG env vars
4. Archive old SPA versions (Vite) if still running separately
5. Update SEO audit docs with new ISR pattern

---

## Validation Checklist (Fase 3.4)

For each site, verify:

- [ ] Site loads at domain.com (no 404)
- [ ] CMS pages render correctly (no missing sections)
- [ ] Blog posts show correct metadata + og:image
- [ ] Edit a page in SF-CMS
- [ ] Wait 10 seconds
- [ ] Visit site → changes are live (without redeploy)
- [ ] Supabase webhook logs show successful POST calls
- [ ] Performance: Lighthouse score > 70
- [ ] Security: no hardcoded secrets in code

**Success = all 3 sites passing validation**
