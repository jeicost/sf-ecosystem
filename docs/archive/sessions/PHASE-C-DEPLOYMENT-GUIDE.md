# Phase C: Vercel Deploy Hooks + CMS Webhook Integration

**Status:** In Progress  
**Objective:** Automate web rebuilds when SF-CMS publishes content  
**User Request:** "que todos lean los datos del cms cuando se de a publicar y se cambien sin mas lios"

---

## Architecture Overview

```
SF-CMS (publishes content)
         ↓
  Webhook Trigger
         ↓
Vercel Deploy Hook / /api/revalidate
         ↓
Next.js builds + revalidatePath()
         ↓
Updated pages live (instant)
```

---

## Step 1: Set Environment Variable (REVALIDATE_SECRET)

Generated secret: `[ROTATED]`

### For Each Project (nc-global-assets-next, startup-factory-web, salsa-burgers-web):

1. Open https://vercel.com
2. Select project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New Variable**
   - Name: `REVALIDATE_SECRET`
   - Value: `[ROTATED]`
   - Environments: **Production**
5. Click **Save & Deploy**

---

## Step 2: Verify /api/revalidate Endpoints

All three webs already have revalidation endpoints:

### NC Global Assets Next
- **File:** `clients/nc-global-assets-next/app/api/revalidate/route.ts`
- **Endpoint:** `POST https://nc-global-assets-next-jeicosts-projects.vercel.app/api/revalidate`
- **Payload:** `{ type: 'post', slug: 'article-slug' }` or `{ type: 'all' }`

### Salsa Burgers
- **File:** `clients/salsa-burgers/web/src/app/api/revalidate/route.ts`
- **Endpoint:** `POST https://salsaburgers.com/api/revalidate`
- **Payload:** `{ type: 'post', slug: 'article-slug' }` or `{ type: 'all' }`

### Startup Factory
- **File:** `apps/startup-factory-web/app/api/revalidate/route.ts`
- **Endpoint:** `POST https://startupsfactory.es/api/revalidate`
- **Payload:** `{ type: 'post', slug: 'article-slug' }` or `{ type: 'all' }`

### Test Revalidation (Manual)
```bash
# Test NC Global Assets Next
curl -X POST https://nc-global-assets-next-jeicosts-projects.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: [ROTATED]" \
  -d '{"type":"all"}'

# Expected response:
# {"revalidated":true,"timestamp":"2026-05-21T..."}
```

---

## Step 3: CMS Webhook Integration (SF-CMS → Vercel)

### Option A: Vercel Deploy Hooks (Recommended)

1. Go to each project on Vercel
2. Settings → Deployments → Deployment Hooks
3. Create 3 hooks:
   - **post-published**: `POST /api/revalidate` with `{type:'all'}`
   - **page-updated**: `POST /api/revalidate` with `{type:'page',slug:'...'}`
   - **blog-updated**: `POST /api/revalidate` with `{type:'post',slug:'...'}`
4. Copy the webhook URLs
5. Configure SF-CMS to call these URLs on publish events

### Option B: Direct /api/revalidate Calls (Current)

SF-CMS publishes → Calls `/api/revalidate` endpoint directly with secret header:
```bash
curl -X POST {web_url}/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: {REVALIDATE_SECRET}" \
  -d '{type: "all"}'
```

---

## Step 4: SF-CMS Webhook Configuration

In SF-CMS admin panel:
1. Go to **Settings** → **Webhooks**
2. Add webhook for each event:

### Webhook: On Blog Post Published
- **Event:** `post.published`
- **URL:** `https://nc-global-assets-next.vercel.app/api/revalidate`
  (or use all three endpoints)
- **Method:** `POST`
- **Headers:**
  ```
  Content-Type: application/json
  x-revalidate-secret: [ROTATED]
  ```
- **Body:**
  ```json
  {
    "type": "post",
    "slug": "{{ post.slug }}"
  }
  ```

### Webhook: On Page Updated
- **Event:** `page.published`
- **URL:** `https://nc-global-assets-next.vercel.app/api/revalidate`
- **Method:** `POST`
- **Headers:** (same as above)
- **Body:**
  ```json
  {
    "type": "page",
    "slug": "{{ page.slug }}"
  }
  ```

### Webhook: Full Rebuild (Bulk Update)
- **Event:** `cms.bulk_update_complete`
- **Body:**
  ```json
  {
    "type": "all"
  }
  ```

---

## Step 5: ISR Revalidation Settings (Already Configured)

### What's Already in Place:

| Web | Interval | Route | Blog | All |
|-----|----------|-------|------|-----|
| NC Global | 1h | ✅ | ✅ | ✅ |
| Salsa Burgers | 1h | ✅ | ✅ | ✅ |
| Startup Factory | 1h | ✅ | ✅ | ✅ |

**Means:**
- Pages auto-refresh every hour (fallback if webhooks fail)
- Manual revalidation works via `/api/revalidate`
- Instant updates via CMS webhooks (when configured)

---

## Testing Checklist

- [ ] Set REVALIDATE_SECRET env var on all three Vercel projects
- [ ] Test `/api/revalidate` endpoint manually with curl
- [ ] Configure SF-CMS webhooks to call the three endpoints
- [ ] Publish a test blog post in SF-CMS
- [ ] Verify post appears on web within 10 seconds
- [ ] Update a page in SF-CMS
- [ ] Verify page updates within 10 seconds
- [ ] Monitor Vercel deploy logs for successful builds

---

## Monitoring & Alerts

### Check Revalidation Status:
```bash
# Check Vercel build logs
vercel logs nc-global-assets-next --prod

# Check if endpoint is responding
curl -i https://nc-global-assets-next.vercel.app/api/revalidate \
  -X POST \
  -H "x-revalidate-secret: {SECRET}"
```

### Success Indicators:
- Vercel shows "Deployed" status
- `/api/revalidate` returns `{"revalidated":true,"timestamp":"..."}`
- CMS webhook logs show successful POST (200 response)

### Troubleshooting:
- **401 Unauthorized:** Wrong REVALIDATE_SECRET
- **404 Not Found:** Web not deployed or wrong URL
- **500 Error:** Check Vercel build logs for errors
- **No update after 1h:** ISR fallback will trigger anyway

---

## Summary

**Phase C enables:**
1. ✅ Instant CMS-to-web updates via webhooks
2. ✅ Automatic rebuilds every hour (ISR fallback)
3. ✅ Manual revalidation via `/api/revalidate`
4. ✅ All three webs (NC Global, Salsa Burgers, Startup Factory) synchronized

**Next:** Once REVALIDATE_SECRET is set and webhooks are configured in SF-CMS, the system is live.
