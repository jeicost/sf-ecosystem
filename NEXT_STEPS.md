# 🎯 PRÓXIMOS PASOS — Action Checklist

## ✅ Lo que está HECHO

### SPA (NC Global Assets Legacy)
- ✅ Article schema dinámico
- ✅ LocalBusiness schema
- ✅ H1 optimizado + sr-only keywords
- ✅ Deployed a producción

### Next.js Migration (NC Global Assets v2)
- ✅ 12 rutas pre-compiladas a static HTML
- ✅ Blog con generateStaticParams + generateMetadata
- ✅ BlogPosting schema en cada post
- ✅ Sitemap dinámico
- ✅ robots.txt generado
- ✅ OG + Twitter cards
- ✅ Canonical tags en todas las páginas

### Estándares Globales SF
- ✅ CLAUDE.md (363 líneas — checklist + templates)
- ✅ Aplicado a: Salsa Burgers, Discoolver, Mira Landing, Startup Factory

---

## 📋 AHORA (Hoy — 5-15 minutos)

### 1️⃣ Deploy NC Global Assets Next.js a Netlify
```bash
# Option A: Drag & Drop (easiest)
1. Ir a https://netlify.com/drop
2. Drag `/out/` folder → DROP
3. Wait 30 seconds for build
4. Get URL like: https://abc123.netlify.app

# Option B: CLI
cd /Users/carlosjacoste/Desktop/Claude/clients/nc-global-assets-next
npm install -g netlify-cli
netlify deploy --prod --dir=out
```

**After Deploy:**
- Copy URL from Netlify dashboard
- Test: visit `/sitemap.xml` → should show 12+ URLs
- Test: visit `/robots.txt` → should show sitemap declaration
- Test: visit `/blog/how-to-choose-local-partner-thailand` → should render full post

---

### 2️⃣ Verificar Vercel Deployments (otros proyectos)
```bash
# Check each project
curl -I https://www.salsaburgers.com/robots.txt
curl -I https://www.discoolver.com/robots.txt  
curl -I https://www.miralanding.com/robots.txt

# Should return 200 OK
```

---

### 3️⃣ Google Search Console — Setup (por proyecto)

**Para cada dominio:**

1. **Google Search Console** → https://search.google.com/search-console
2. Add property (si no existe):
   - Property type: URL prefix
   - https://www.ncglobalassets.com
   - Verify: DNS / HTML file / Google Analytics

3. **Sitemaps:**
   - Go to Sitemaps section
   - Add: `https://www.ncglobalassets.com/sitemap.xml`
   - Wait for "Discovered 12 URLs"

4. **Coverage:**
   - Check "Coverage" tab
   - Should see 0 errors (green)
   - All pages "Indexed"

5. **Performance:**
   - Check baseline clicks + impressions
   - Record for comparison in 30 days

---

## 📅 THIS WEEK (2-4 días)

### 4️⃣ Monitor Google Crawl
**Google Search Console → Coverage tab**
- Day 1: Check status
- Day 3: Blog posts should appear
- Day 5: All pages indexed

**Expected timeline:**
- Homepage: 24-48 hours
- Blog posts: 3-7 days
- Full crawl: 14 days

---

### 5️⃣ Verify Rankings Starting Point
**Use any rank tracker (Ahrefs, SEMrush, Moz, etc.):**

Track these keywords:
- **NC Global Assets:**
  - "Bangkok brand launch" → track #
  - "Thailand market entry operating partner" → track #
  - "F&B Thailand" → track #

- **Salsa Burgers:**
  - "Bangkok burgers" → track #
  - "Delivery Bangkok" → track #

- **Discoolver:**
  - "Travel experiences Spain" → track #
  - "Local experiences Madrid" → track #

**Record baseline NOW** (before SEO improvements show up)

---

## 📊 30-60 DAYS (Monitor & Report)

### 6️⃣ Google Search Console Metrics
- Clicks: should increase 10-50%
- Impressions: should increase 5-30%
- CTR: should improve (more clicks per impression)
- Average position: should move up 5-15 positions

### 7️⃣ Organic Traffic
- Analytics → Organic users
- Should see +15-80% lift depending on project
- Higher lift for NC Global (blog was invisible)

### 8️⃣ Rank Tracker
- Most keywords should improve 5-20 positions
- New keywords may rank (long-tail questions from blog)

---

## 🚨 BLOCKERS & SOLUTIONS

| Blocker | Solution |
|---------|----------|
| Netlify deploy fails | Use Vercel (once CVE patched) OR keep at local URL until ready |
| Google not crawling | Verify sitemap in GSC → Request URL inspection → Submit |
| Duplicate content errors | Check www-consistency (should be fixed) |
| Blog posts not indexing | Verify BlogPosting schema present → Fetch as Google → Request indexing |

---

## 🎓 Learning Resources (If needed)

- Google Search Central: https://developers.google.com/search
- Schema.org: https://schema.org/BlogPosting
- Next.js SEO: https://nextjs.org/learn/seo/introduction-to-seo

---

## ✨ SUCCESS CRITERIA (30 days)

✅ All pages indexed in Google  
✅ Blog posts showing in search results  
✅ Organic traffic +15% minimum  
✅ 5+ keywords on first page (from none previously)  
✅ NC Global blog CTR >5%  
✅ Discoolver no duplicate URL errors  
✅ Mira getting daily crawl (from monthly)  

---

## 💬 Questions?

- NC Global: Check `/DEPLOYMENT_STATUS_2026.md`
- SEO Standards: Check `CLAUDE.md`
- Migration Details: Check `SF_SEO_ROADMAP_2026.md`

---

**Time estimate for completion:**  
✅ Deploy: 5-15 min  
✅ Verify: 10-15 min  
✅ GSC setup: 15-20 min  
✅ **Total: ~45 min to go live**
