# Revalidation Setup Status & Project IDs

**Last Updated:** 2026-05-21  
**Purpose:** Reference for Vercel project IDs, deployment URLs, and env var configuration

---

## Project Configuration

### 1. Startup Factory Web

| Property | Value |
|----------|-------|
| **Vercel Project ID** | `prj_XqOuowAPVwCIquJSGvtW1j7D1iiE` |
| **Vercel Org ID** | `team_7QGpRqqi1FjrJugGLL0sDehf` |
| **Latest Deployment** | `startup-factory-mvmtx6igx-jeicosts-projects.vercel.app` |
| **Custom Domain** | `www.startupsfactory.es` |
| **Revalidate Endpoint** | `https://www.startupsfactory.es/api/revalidate` |
| **Code Location** | `apps/startup-factory-web/app/api/revalidate/route.ts` |

### 2. NC Global Assets

| Property | Value |
|----------|-------|
| **Vercel Project ID** | `prj_GqKIJAxeq8ZgJ9VB6GYIr3O7qwlD` |
| **Vercel Org ID** | `team_7QGpRqqi1FjrJugGLL0sDehf` |
| **Latest Deployment** | `nc-global-assets-next-jbvl1c96s-jeicosts-projects.vercel.app` |
| **Custom Domain** | `www.ncglobalassets.com` |
| **Revalidate Endpoint** | `https://www.ncglobalassets.com/api/revalidate` |
| **Code Location** | `clients/nc-global-assets-next/app/api/revalidate/route.ts` |

### 3. Salsa Burgers Web

| Property | Value |
|----------|-------|
| **Vercel Project ID** | `prj_ermiutbVMzAyE8lRL3mrot8g5JRC` |
| **Vercel Org ID** | `team_7QGpRqqi1FjrJugGLL0sDehf` |
| **Latest Deployment** | `salsa-burgers-3qmx8wl0z-jeicosts-projects.vercel.app` |
| **Custom Domain** | `salsaburgers.com` |
| **Revalidate Endpoint** | `https://salsaburgers.com/api/revalidate` |
| **Code Location** | `clients/salsa-burgers/web/src/app/api/revalidate/route.ts` |

---

## Environment Variables

### REVALIDATE_SECRET

**Status:** Needs to be set on all 3 projects  
**Scope:** Production environment  
**Value:** `sk_live_revalidate_prod_e7f9a2c8d4b1f3e6a9c2b5d8e1f4a7c9`  

Must match the value used in Supabase webhook headers (`x-revalidate-secret`)

**How to Set:**
```bash
# Option 1: Vercel UI
# Project Settings → Environment Variables → Add REVALIDATE_SECRET = sk_live_revalidate_prod_e7f9a2c8d4b1f3e6a9c2b5d8e1f4a7c9 → Select Production → Save

# Option 2: CLI (if authenticated)
cd /path/to/project
VERCEL_PROJECT_ID="prj_..." VERCEL_ORG_ID="team_..." \
vercel env add REVALIDATE_SECRET production --value="sk_live_revalidate_prod_e7f9a2c8d4b1f3e6a9c2b5d8e1f4a7c9"
```

### CMS_API_URL (already set)

**Status:** ✅ Configured on all 3 projects  
**Value:** `https://sf-cms.vercel.app/api/public`

### CMS_API_KEY (already set)

**Status:** ✅ Configured on all 3 projects  
**Value:** [Valid production key set in Vercel UI]

### CMS_PROJECT (already set)

**Status:** ✅ Configured per project  
**Values:**
- Startup Factory: `startupsfactory`
- NC Global: `ncglobalassets`
- Salsa Burgers: `salsaburgers`

---

## Webhook Configuration (Supabase)

### Event Trigger

| Field | Value |
|-------|-------|
| **Table** | `posts` |
| **Events** | INSERT, UPDATE, DELETE |
| **Webhook Method** | POST |
| **Auth Header** | `x-revalidate-secret: sk_live_revalidate_prod_e7f9a2c8d4b1f3e6a9c2b5d8e1f4a7c9` |

### Webhook URLs

```
POST https://www.startupsfactory.es/api/revalidate
POST https://www.ncglobalassets.com/api/revalidate
POST https://salsaburgers.com/api/revalidate
```

**Payload Example:**
```json
{
  "paths": ["/blog", "/blog/new-post-slug"]
}
```

---

## .vercel/project.json Files

All three projects have `.vercel/project.json` to prevent Vercel CLI from using parent project:

```json
{
  "projectId": "prj_XqOuowAPVwCIquJSGvtW1j7D1iiE",
  "orgId": "team_7QGpRqqi1FjrJugGLL0sDehf"
}
```

Update the `projectId` for each respective project.

---

## Endpoint Response Format

### Success (200)

```json
{
  "revalidated": true,
  "paths": ["/blog", "/blog/new-slug"]
}
```

### Error (401)

```
Invalid or missing x-revalidate-secret header
```

### Error (404)

```
Endpoint not found (domain alias still points to old deployment)
```

---

## Deployment Commands

If re-deploying any project:

```bash
cd /path/to/project
VERCEL_PROJECT_ID="prj_..." \
VERCEL_ORG_ID="team_7QGpRqqi1FjrJugGLL0sDehf" \
vercel --prod --yes

# After deploy, ALWAYS update domain alias in Vercel UI
# Settings → Domains → select latest deployment → Save
```

---

## CMS Credentials

**Super Admin:**
- Email: `jacostech@gmail.com`
- Password: `SFcms2026!`

**Other Users:**
- Editor: `nirada@startupsfactory.es` (project-scoped)

---

## Monitoring

### Check Endpoint Availability

```bash
curl -I https://www.startupsfactory.es/api/revalidate
# Should return 405 Method Not Allowed (GET not supported, but endpoint exists)
# If 404 or timeout, domain alias hasn't been updated
```

### Test Webhook Delivery

```bash
curl -X POST https://www.startupsfactory.es/api/revalidate \
  -H "x-revalidate-secret: sk_live_revalidate_prod_e7f9a2c8d4b1f3e6a9c2b5d8e1f4a7c9" \
  -H "Content-Type: application/json" \
  -d '{"paths":["/blog"]}'

# Should return 200 + {"revalidated": true}
```

### Verify ISR Behavior

```bash
# 1. Publish new post in SF-CMS
# 2. Request /blog within 3 seconds of publish
# 3. New post should appear
```

---

## References

- Main steps: `/Users/carlosjacoste/Desktop/Claude/REVALIDATE_FINAL_STEPS.md`
- Quick snapshot: `/Users/carlosjacoste/Desktop/Claude/CMS_PRODUCTION_SNAPSHOT.md`
- Session context: `[[session_cms_sync_complete_2026_05_21]]`
