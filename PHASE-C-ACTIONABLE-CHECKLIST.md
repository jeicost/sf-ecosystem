# Phase C: CMS-to-Web Sync — Actionable Checklist

**Goal:** All three webs read from SF-CMS and update instantly when content is published.  
**Secret Key:** `cUizyvMKA8xDv2I7aYxBLdNiw7fuwZtypc3+QStlH6g=`

---

## 🟡 REQUIRED FIRST: Set REVALIDATE_SECRET on Vercel (3 projects)

### For NC Global Assets Next (nc-global-assets-next)
1. Go to **https://vercel.com**
2. Click **NC Global Assets Next** project
3. → **Settings** → **Environment Variables**
4. Click **Add New Variable**
   - Name: `REVALIDATE_SECRET`
   - Value: `cUizyvMKA8xDv2I7aYxBLdNiw7fuwZtypc3+QStlH6g=`
   - Environments: **Production** (select)
5. Click **Save & Deploy**
6. ✅ Verify it deployed (watch build log)

### For Salsa Burgers (salsa-burgers-web)
1. Go to **https://vercel.com**
2. Click **Salsa Burgers Web** project
3. → **Settings** → **Environment Variables**
4. Click **Add New Variable**
   - Name: `REVALIDATE_SECRET`
   - Value: `cUizyvMKA8xDv2I7aYxBLdNiw7fuwZtypc3+QStlH6g=`
   - Environments: **Production**
5. Click **Save & Deploy**
6. ✅ Verify it deployed

### For Startup Factory (startup-factory-web)
1. Go to **https://vercel.com**
2. Click **Startup Factory Web** project
3. → **Settings** → **Environment Variables**
4. Click **Add New Variable**
   - Name: `REVALIDATE_SECRET`
   - Value: `cUizyvMKA8xDv2I7aYxBLdNiw7fuwZtypc3+QStlH6g=`
   - Environments: **Production**
5. Click **Save & Deploy**
6. ✅ Verify it deployed

---

## 🟢 THEN: Test Each Endpoint Works

Run these curl commands to verify the secrets were applied correctly:

```bash
# Test NC Global
curl -X POST https://nc-global-assets-next.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: cUizyvMKA8xDv2I7aYxBLdNiw7fuwZtypc3+QStlH6g=" \
  -d '{"type":"all"}'
# Expected: {"revalidated":true,"timestamp":"2026-05-21T..."}

# Test Salsa Burgers
curl -X POST https://www.salsaburgers.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: cUizyvMKA8xDv2I7aYxBLdNiw7fuwZtypc3+QStlH6g=" \
  -d '{"type":"all"}'
# Expected: {"revalidated":true,"timestamp":"2026-05-21T..."}

# Test Startup Factory
curl -X POST https://startupsfactory.es/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: cUizyvMKA8xDv2I7aYxBLdNiw7fuwZtypc3+QStlH6g=" \
  -d '{"type":"all"}'
# Expected: {"revalidated":true,"timestamp":"2026-05-21T..."}
```

If any return `401 Unauthorized`, the env var didn't apply. If `404 Not Found`, the domain/endpoint is wrong.

---

## 🟠 THEN: Configure SF-CMS Webhooks

1. Go to **https://cms.startupsfactory.es/admin**
2. → **Settings** → **Webhooks**
3. Follow the detailed instructions in **PHASE-C-WEBHOOK-SETUP.md**

**Quick summary:**
- Create 3 webhooks for `post.published` event
- Each webhook points to one web:
  - `https://nc-global-assets-next.vercel.app/api/revalidate`
  - `https://www.salsaburgers.com/api/revalidate`
  - `https://startupsfactory.es/api/revalidate`
- All three use same secret: `x-revalidate-secret: cUizyvMKA8xDv2I7aYxBLdNiw7fuwZtypc3+QStlH6g=`
- Body template: `{"type":"post","slug":"{{ post.slug }}"}`

---

## 🟣 FINALLY: Test Complete Workflow

1. **Publish a test blog post in SF-CMS:**
   - Go to **Blog** → **New Post**
   - Title: `Test Webhook Sync`
   - Slug: `test-webhook-sync`
   - Publish

2. **Verify it appears on all three webs within 10 seconds:**
   - https://nc-global-assets-next.vercel.app/blog/test-webhook-sync
   - https://www.salsaburgers.com/blog/test-webhook-sync
   - https://startupsfactory.es/blog/test-webhook-sync

3. **If any are missing:** Check CMS webhook delivery logs for 401/404 errors

---

## 📋 Verification Checklist

- [ ] REVALIDATE_SECRET set on NC Global Vercel project → deployed
- [ ] REVALIDATE_SECRET set on Salsa Burgers Vercel project → deployed
- [ ] REVALIDATE_SECRET set on Startup Factory Vercel project → deployed
- [ ] Manual endpoint test (curl): NC Global returns 200
- [ ] Manual endpoint test (curl): Salsa Burgers returns 200
- [ ] Manual endpoint test (curl): Startup Factory returns 200
- [ ] SF-CMS webhooks created (3× `post.published` events)
- [ ] Test blog post published in CMS
- [ ] Test post appears on NC Global within 10 seconds
- [ ] Test post appears on Salsa Burgers within 10 seconds
- [ ] Test post appears on Startup Factory within 10 seconds

---

## 🔄 What Happens After Setup

When you publish a blog post in SF-CMS:

1. **CMS fires webhook** → calls `/api/revalidate` on each web
2. **Each web receives request:**
   - Verifies secret matches
   - Calls `revalidatePath()` to mark cache invalid
3. **Next.js rebuilds affected pages** on next request
4. **Fresh content appears** immediately (no manual deploy needed)

**Fallback (if webhooks fail):** ISR refreshes all pages automatically every 1 hour.

---

## ⚠️ Common Issues

| Problem | Solution |
|---------|----------|
| Endpoint returns `401 Unauthorized` | Vercel env var not deployed yet. Wait 2 min, then retry curl. If still fails, check the var was saved (click the project and verify it shows in Environment Variables list). |
| Endpoint returns `404 Not Found` | Domain/URL is wrong, or web isn't deployed to Vercel. Verify the domain is correct and the project is active. |
| Test post doesn't appear after 30 seconds | Check CMS webhook delivery logs. Look for failures in the webhook history and debug the response status. |
| Only 1 or 2 webs update | One webhook is failing. Check its delivery log in CMS and verify the secret/URL are correct. |

---

## Reference Files

- **PHASE-C-DEPLOYMENT-GUIDE.md** — Full technical architecture + ISR settings
- **PHASE-C-WEBHOOK-SETUP.md** — Detailed CMS webhook configuration instructions

**Status after completing checklist:** Phase C Complete ✅
