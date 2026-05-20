# Google Search Console Setup — Startup Factory Projects

**Date:** 2026-05-15  
**Objective:** Submit all SF projects to Google Search Console and monitor indexation

---

## 🎯 Quick Overview

| Project | Domain | Status | Priority |
|---------|--------|--------|----------|
| NC Global Assets (Next.js) | www.ncglobalassets.com | Pending domain config | 🔴 HIGH |
| Salsa Burgers | www.salsaburgers.com | Deployed 2026-05-15 | 🟠 MEDIUM |
| Discoolver | www.discoolver.com | Fixed www-consistency | 🟠 MEDIUM |
| Mira Landing | www.miralanding.com | Deployed 2026-05-15 | 🟠 MEDIUM |
| Startup Factory | www.startupsfactory.es | Baseline (95/100) | 🟢 LOW |

---

## 📋 Per-Project Setup (5-10 min per project)

### 1️⃣ Access Google Search Console

Go to: **https://search.google.com/search-console**

Log in with Google account that owns the domain (or has access).

---

### 2️⃣ Add Property (Domain)

**If property doesn't exist yet:**

1. Click **"Add property"** (top left)
2. Choose **"URL prefix"** tab
3. Enter: `https://www.example.com` (with **www** prefix)
4. Click **"Continue"**

**If property exists, skip to Verification step.**

---

### 3️⃣ Verify Ownership

Google offers 4 verification methods. **Recommended: Google Analytics (if already connected)** or **HTML file upload**.

#### **Method A: Google Analytics (Fastest if connected)**
- If Analytics 4 is already on the site → Google auto-verifies
- Otherwise, use Method B

#### **Method B: HTML File Upload**
1. Download the verification file from GSC
2. Upload to `public/google-site-verify-[code].html` in project
3. Deploy to production
4. Return to GSC → Click "Verify"

#### **Method C: HTML Meta Tag**
1. Copy the meta tag provided
2. Add to `app/layout.tsx` in the root metadata
3. Deploy to production
4. Return to GSC → Click "Verify"

**For NC Global (Vercel):**
```tsx
// app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL('https://www.ncglobalassets.com'),
  verification: {
    google: '[verification-code-from-gsc]', // Replaces manual meta tag
  },
  // ... rest of metadata
};
```

---

### 4️⃣ Submit Sitemap

**Once property is verified:**

1. Left sidebar → **"Sitemaps"**
2. Click **"Add/test sitemap"**
3. Enter: `https://www.example.com/sitemap.xml`
4. Click **"Submit"**

GSC will crawl and parse the sitemap.

---

### 5️⃣ Check Coverage

**5 minutes after submitting sitemap:**

1. Left sidebar → **"Coverage"**
2. Expected state:
   - ✅ "Valid" (green): All pages indexed
   - ⚠️ "Valid with warnings" (yellow): Some redirects detected
   - ❌ "Error" (red): Pages not indexed (check robots.txt, canonical issues)
   - ⏳ "Excluded" (gray): Intentionally blocked (e.g., /admin)

**For NC Global (expected):**
- Homepage + About + Services + Contact + Blog listing = 5 pages
- Blog posts (2 posts) = 2 pages
- Total: ~7+ pages under "Valid"

**If errors appear:**
- Click on error → Details
- Check if: robots.txt blocks, canonical conflicts, or URL parameter issues
- Fix in code and redeploy

---

### 6️⃣ Check Performance Baseline

1. Left sidebar → **"Performance"**
2. Date range: **Last 28 days** (or Today if first day)
3. Record these baseline metrics:
   - **Clicks** (organic)
   - **Impressions** (search result appearances)
   - **CTR** (Click-Through Rate %)
   - **Avg. Position** (average ranking position)

**Example baseline for brand-new site:**
- Clicks: 0-5
- Impressions: 50-200 (if home + blog in index)
- CTR: 0-2%
- Position: 50+ (very low)

**30-day goal:** 10-50% improvement in clicks + impressions

---

### 7️⃣ Request URL Inspection (Optional)

To speed up indexing of specific pages:

1. Enter homepage URL in search box: `https://www.example.com/`
2. Click **"Inspect"**
3. View: Last crawl date, crawl status
4. Click **"Request Indexing"** (blue button)
5. Repeat for 2-3 important pages (homepage, blog list, best post)

---

## 📊 Monitoring Schedule

### **Day 1 (Today):**
- [ ] Submit sitemap
- [ ] Check Coverage (allow 5-10 min crawl)
- [ ] Record baseline Performance metrics

### **Day 3:**
- [ ] Check Coverage again (blog posts should start appearing)
- [ ] Look for any error categories

### **Day 7:**
- [ ] All pages should be under "Valid" (0 errors)
- [ ] Impressions should increase 50-200%

### **Weekly (every 7 days):**
- [ ] Check Performance → Clicks, Impressions, CTR
- [ ] Check Coverage → Ensure no new errors
- [ ] Note any ranking improvements

### **Monthly (30-day checkpoint):**
- [ ] Compare baseline vs 30-day metrics
- [ ] Expected uplift: +15-50% clicks, +10-30% impressions

---

## 🔗 Setup Checklist by Project

### **NC Global Assets (www.ncglobalassets.com)**
- [ ] Configure custom domain in Vercel
- [ ] Verify domain ownership in GSC
- [ ] Submit sitemap.xml
- [ ] Check Coverage (expect ~7 pages)
- [ ] Request indexing for /blog/how-to-choose-local-partner-thailand (best post)

### **Salsa Burgers (www.salsaburgers.com)**
- [ ] Check property exists in GSC
- [ ] If not: Add property + verify
- [ ] Check if sitemap already submitted
- [ ] If not: Add robots.ts (DONE ✅), then submit sitemap
- [ ] Review Coverage

### **Discoolver (www.discoolver.com)**
- [ ] Verify property exists (might be under old non-www)
- [ ] If necessary: Add www property
- [ ] Confirm www-consistent fix deployed ✅
- [ ] Submit/re-submit sitemap
- [ ] Check Coverage (should show 0 duplicate URL warnings now)

### **Mira Landing (www.miralanding.com)**
- [ ] Add property (likely new domain)
- [ ] Verify ownership
- [ ] robots.ts + sitemap.ts now deployed ✅
- [ ] Submit sitemap
- [ ] Check Coverage

### **Startup Factory (www.startupsfactory.es)**
- [ ] Property should exist (mature site)
- [ ] Verify recent updates deployed (308 redirects, expanded sitemap)
- [ ] Check Coverage for any new pages
- [ ] Review Performance baseline

---

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| Sitemap not found (404) | Check domain is www-consistent, redeploy robots.ts |
| Pages marked "Excluded" | Check robots.txt doesn't have `Disallow: /` |
| Duplicate URL warnings | Verify canonical tags are self-canonical + www |
| Coverage shows 0 pages | Wait 10-15 min for crawl, then check for errors |
| Blog posts not appearing | Check BlogPosting schema present, request indexing manually |

---

## ✅ Success Criteria (per project)

**Day 1-3:**
- ✅ Sitemap submitted and parsed
- ✅ Coverage shows "Valid" entries
- ✅ No critical errors (orange/red)

**Day 7:**
- ✅ All pages "Valid" (0 errors)
- ✅ Blog posts appearing in search results (optional: manually search `site:domain.com/blog`)

**Day 30:**
- ✅ Organic clicks +15% minimum
- ✅ Impressions +10% minimum
- ✅ 2-5 new keywords ranking (long-tail from blog)
- ✅ Average position improved 5-20 spots (for existing keywords)

---

## 📈 Monitoring Tools (Optional)

While GSC is the source of truth, these tools help track rankings:

- **Free:** Rank tracker features in Ubersuggest, Moz (limited)
- **Paid:** Ahrefs, SEMrush, Moz Pro (full keyword tracking)
- **DIY:** Use Google Analytics → Organic traffic trending

---

## 🎓 Learn More

- **Google Search Central:** https://developers.google.com/search
- **GSC Help:** https://support.google.com/webmasters
- **Structured Data Test:** https://search.google.com/structured-data/testing-tool

---

**Time estimate:** 45 min - 1 hour for all 5 projects

**Repeat: Weekly check-ins until all projects show stable indexation (usually 2-4 weeks)**
