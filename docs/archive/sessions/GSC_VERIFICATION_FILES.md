# Google Search Console — Verification & Setup Files

**For manual setup of GSC properties.** Each project includes its own instructions.

---

## 📋 Verification Methods by Project

For GSC verification, use these methods in order of preference:

### **Method 1: Google Analytics (If GA4 connected) ✅ FASTEST**
- If site already has GA4 → GSC auto-verifies
- No additional files needed
- **Projects that likely have GA4:**
  - Startup Factory (mature)
  - Salsa Burgers (integrated landing)
  - NC Global Assets (GA4 in app/layout.tsx)

### **Method 2: HTML Meta Tag in layout.tsx**
- Works for all Next.js projects
- Add to app/layout.tsx metadata
- No file upload needed

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  verification: {
    google: 'YOUR_VERIFICATION_CODE_HERE',
  },
  // ... rest
};
```

### **Method 3: HTML File Upload**
- For projects without GA4
- Upload verification file to public/ folder
- File URL: `https://www.domain.com/google-site-verify-XXXXX.html`

---

## 🎯 Per-Project Setup Instructions

### 1️⃣ **NC Global Assets** (www.ncglobalassets.com)

**Status:** Domain alias just created, now ready for GSC

**Steps:**
1. Go to https://search.google.com/search-console
2. Click "Add property"
3. Select "URL prefix" → Enter `https://www.ncglobalassets.com`
4. Choose verification method:
   - **Option A:** Use Google Analytics (if GA4 ID exists → auto-verify)
   - **Option B:** Add meta tag to `app/layout.tsx` → Redeploy to Vercel → Verify

5. Once verified:
   - Go to "Sitemaps"
   - Add: `https://www.ncglobalassets.com/sitemap.xml`
   - Submit

6. After 5-10 min:
   - Check "Coverage" tab
   - Expected: ~7 pages (5 static + 2 blog posts)

**Next:** Monitor Coverage daily for 3 days

---

### 2️⃣ **Salsa Burgers** (www.salsaburgers.com)

**Status:** Already deployed (robots.ts + sitemap live)

**Steps:**
1. Go to https://search.google.com/search-console
2. Check if property `www.salsaburgers.com` exists
   - If yes → Skip to step 5
   - If no → Click "Add property" → URL prefix → `https://www.salsaburgers.com`

3. Verify ownership (likely already verified from SPA version):
   - If Google Analytics method available → Use it
   - Otherwise → Add meta tag to `app/layout.tsx` → Redeploy

4. Go to "Sitemaps"
5. Check if sitemap already submitted
   - If not → Add: `https://www.salsaburgers.com/sitemap.xml`
   - If yes → Note the date, should update automatically

6. Check "Coverage":
   - Should show all pages
   - Watch for duplicate URL warnings

**Next:** Monitor for 3 days for any crawl errors

---

### 3️⃣ **Discoolver** (www.discoolver.com)

**Status:** www-consistency fixed, robots.ts + sitemap live

**Steps:**
1. Go to https://search.google.com/search-console
2. Check if property `www.discoolver.com` exists
   - If only `discoolver.com` exists → Create new property with `www.` prefix

3. Verify ownership (should be quick if already verified):
   - Use Google Analytics or meta tag method

4. Go to "Sitemaps"
5. Check if old sitemap exists (from non-www version)
   - Remove old one: `https://discoolver.com/sitemap.xml`
   - Add new one: `https://www.discoolver.com/sitemap.xml`

6. Check "Coverage":
   - Should now show **0 duplicate URL errors** (www fix applied)
   - All pages under "Valid"

**Next:** Verify no duplicate URL warnings appear

---

### 4️⃣ **Mira Landing** (www.miralanding.com)

**Status:** robots.ts + sitemap.ts just deployed

**Steps:**
1. Go to https://search.google.com/search-console
2. Click "Add property" (likely new property)
3. Select "URL prefix" → `https://www.miralanding.com`
4. Verify ownership:
   - Try Google Analytics first (if GA4 connected)
   - Else: Add meta tag to `app/layout.tsx` → Redeploy → Verify

5. Once verified:
   - Go to "Sitemaps"
   - Add: `https://www.miralanding.com/sitemap.xml`
   - Submit

6. After 5-10 min:
   - Check "Coverage"
   - Expected: At least homepage

**Next:** Monitor for indexing over next 3-7 days

---

### 5️⃣ **Startup Factory** (www.startupsfactory.es)

**Status:** Mature site, baseline maintained

**Steps:**
1. Go to https://search.google.com/search-console
2. Property should already exist
3. Verify recent deployments:
   - Go to "Coverage"
   - Check for any new error categories
   - Note date/time of last crawl

4. Go to "Performance"
   - Record baseline metrics (clicks, impressions, CTR, position)
   - Expected: Already some organic traffic (established domain)

5. Check sitemap status:
   - Should be updated with any new pages from recent deployment
   - If not listed → Add if needed

**Next:** Compare baseline from 30 days ago for improvement tracking

---

## 🔐 DNS Configuration (For Custom Domains)

Once domain is alias in Vercel, update DNS at registrar:

### **For Google Domains (where ncglobalassets.com is registered):**

1. Go to https://domains.google.com/registrar/
2. Select domain → DNS → Custom nameservers
3. Enter Vercel's nameservers:
   - `ns-1.vercel-dns.com`
   - `ns-2.vercel-dns.com`

4. Click Save (2-48 hours for propagation)

### **For other registrars (GoDaddy, Cloudflare, etc):**
- Similar process: Nameservers settings → Change to Vercel's
- Vercel docs: https://vercel.com/docs/projects/domains/add-a-domain

---

## ✅ Post-Setup Verification

After setting up all 5 projects:

1. **Test each domain is live:**
   ```bash
   curl -I https://www.ncglobalassets.com/robots.txt
   curl -I https://www.salsaburgers.com/robots.txt
   curl -I https://www.discoolver.com/robots.txt
   curl -I https://www.miralanding.com/robots.txt
   curl -I https://www.startupsfactory.es/robots.txt
   ```
   - All should return **200 OK**

2. **Check robots.txt is accessible:**
   - Each URL should show User-Agent rules + Sitemap declaration

3. **Check sitemap.xml is accessible:**
   - Each sitemap should list all pages

4. **In GSC, verify sitemaps parsed:**
   - After submitting, wait 10-15 min
   - Go to "Sitemaps" tab
   - Should show "Success" status + number of URLs found

---

## 📈 30-Day Monitoring

| Day | Action | Expected Result |
|-----|--------|-----------------|
| Day 1 | Submit all sitemaps | Sitemaps show "Success" |
| Day 3 | Check Coverage | Blog posts appearing, 0 errors |
| Day 7 | All pages indexed | Coverage shows 100% "Valid" |
| Day 14 | Monitor Performance | Impressions +50% (if had traffic) |
| Day 30 | Compare metrics | Clicks +15%, impressions +10% |

---

## 🚨 If Errors Appear

**Duplicate URLs (Discoolver):**
- Should be 0 after www-consistency fix
- If still appearing → Check canonical tags in code

**"Excluded" pages:**
- Check robots.txt doesn't have broad Disallow rule
- Verify og:noindex meta tag not applied

**"Error" pages:**
- Check blog post has BlogPosting schema
- Verify all links are crawlable (not behind auth)

**Sitemap not parsing:**
- Verify XML is well-formed: `https://validator.w3.org/feed/`
- Check all URLs in sitemap are www-consistent

---

**Estimated time for complete setup: 45 min - 1 hour**
