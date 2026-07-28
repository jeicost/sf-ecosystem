# Phase C: SF-CMS Webhook Configuration — Implementation Steps

**Status:** Ready to execute  
**Objective:** Configure SF-CMS to trigger instant rebuilds on all three webs when content is published  
**Prerequisites:** REVALIDATE_SECRET env vars set on Vercel (see PHASE-C-DEPLOYMENT-GUIDE.md Step 1)

---

## Step 1: Log into SF-CMS Admin

Navigate to **https://cms.startupsfactory.es/admin** and log in with your credentials.

---

## Step 2: Create Webhooks in SF-CMS

Go to **Settings** → **Webhooks** → **Create New Webhook**

### Webhook 1: Blog Post Published (Trigger All Three Webs)

| Field | Value |
|-------|-------|
| **Name** | `post.published → all webs rebuild` |
| **Event** | `post.published` |
| **URL** | `https://nc-global-assets-next.vercel.app/api/revalidate` |
| **Method** | `POST` |
| **Auth Header** | `x-revalidate-secret: [ROTATED]` |
| **Body Template** | See below |
| **Active** | ✅ Yes |

**Body JSON:**
```json
{
  "type": "post",
  "slug": "{{ post.slug }}"
}
```

**Why this triggers all three webs:**
- All three projects have `/api/revalidate` endpoints that accept the same payload
- NC Global is listed first; configure it once here
- Then duplicate and point to `salsaburgers.com/api/revalidate` and `startupsfactory.es/api/revalidate`

---

### Webhook 2: Blog Post Published → Salsa Burgers

| Field | Value |
|-------|-------|
| **Name** | `post.published → salsaburgers.com` |
| **Event** | `post.published` |
| **URL** | `https://www.salsaburgers.com/api/revalidate` |
| **Method** | `POST` |
| **Auth Header** | `x-revalidate-secret: [ROTATED]` |
| **Body Template** | (same as above) |
| **Active** | ✅ Yes |

---

### Webhook 3: Blog Post Published → Startup Factory

| Field | Value |
|-------|-------|
| **Name** | `post.published → startupsfactory.es` |
| **Event** | `post.published` |
| **URL** | `https://startupsfactory.es/api/revalidate` |
| **Method** | `POST` |
| **Auth Header** | `x-revalidate-secret: [ROTATED]` |
| **Body Template** | (same as above) |
| **Active** | ✅ Yes |

---

## Step 3: Page Content Webhooks (Optional but Recommended)

If you want pages (hero, services, FAQ, etc.) to update instantly when edited in CMS:

### Webhook 4: Page Published → All Three Webs

| Field | Value |
|-------|-------|
| **Name** | `page.published → all webs rebuild` |
| **Event** | `page.published` |
| **URL** | `https://nc-global-assets-next.vercel.app/api/revalidate` |
| **Method** | `POST` |
| **Auth Header** | `x-revalidate-secret: [ROTATED]` |
| **Body Template** | (see below) |
| **Active** | ✅ Yes |

**Body JSON:**
```json
{
  "type": "page",
  "slug": "{{ page.slug }}"
}
```

**Then repeat for:**
- `salsaburgers.com/api/revalidate`
- `startupsfactory.es/api/revalidate`

---

## Step 4: Bulk Rebuild Webhook (For Major Changes)

If you want a single webhook to trigger a full rebuild of all content:

| Field | Value |
|-------|-------|
| **Name** | `cms.bulk_update_complete → full rebuild` |
| **Event** | `cms.bulk_update_complete` or custom event |
| **URL** | `https://nc-global-assets-next.vercel.app/api/revalidate` |
| **Method** | `POST` |
| **Auth Header** | `x-revalidate-secret: [ROTATED]` |
| **Body Template** | (see below) |
| **Active** | ✅ Yes |

**Body JSON:**
```json
{
  "type": "all"
}
```

---

## Step 5: Test Each Webhook

SF-CMS provides a **Test** button on each webhook. Click it to send a dry-run payload:

1. Open the webhook
2. Click **Test** or **Send Test Event**
3. Check **Webhook Delivery Log** for:
   - ✅ Status `200 OK` → Success
   - ❌ Status `401 Unauthorized` → Wrong secret (verify env var)
   - ❌ Status `404 Not Found` → Wrong URL or endpoint not deployed

---

## Step 6: Verify Live Trigger (Manual Test)

### Test 1: Publish a Blog Post in CMS
1. Go to **SF-CMS** → **Blog** → **Create Post**
2. Title: `Test Post — Webhook Verification`
3. Slug: `test-webhook-verification`
4. Content: `Testing instant CMS → web sync`
5. Click **Publish**
6. Check webhook delivery logs in SF-CMS (should show 3× POST 200 if all three are active)

### Test 2: Verify Post Appears on All Three Webs
- ✅ Check **nc-global-assets-next.vercel.app/blog/test-webhook-verification**
- ✅ Check **salsaburgers.com/blog/test-webhook-verification**
- ✅ Check **startupsfactory.es/blog/test-webhook-verification**

All should show the test post within 5-10 seconds.

### Test 3: Edit and Republish
1. Edit the test post in CMS (change title or content)
2. Click **Publish** (or **Update**)
3. Verify change appears on all three webs within 5-10 seconds

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| **401 Unauthorized** | REVALIDATE_SECRET env var not set or wrong value | Set `REVALIDATE_SECRET=[ROTATED]` in Vercel Settings → Environment Variables for each project |
| **404 Not Found** | Endpoint URL is wrong or site not deployed | Verify URL is exactly `https://domain.com/api/revalidate` (not `/api/revalidate/`) |
| **Post doesn't appear after 30s** | Webhook didn't fire or body template is wrong | Check CMS webhook delivery logs; verify body JSON is valid |
| **Only 1 of 3 webs updated** | One webhook failed silently | Check individual webhook logs in CMS; test each endpoint separately with curl |

---

## Fallback: Manual Revalidation (If Webhooks Fail)

If webhooks aren't working, you can manually trigger a rebuild:

```bash
# Revalidate NC Global
curl -X POST https://nc-global-assets-next.vercel.app/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: [ROTATED]" \
  -d '{"type":"all"}'

# Revalidate Salsa Burgers
curl -X POST https://www.salsaburgers.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: [ROTATED]" \
  -d '{"type":"all"}'

# Revalidate Startup Factory
curl -X POST https://startupsfactory.es/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: [ROTATED]" \
  -d '{"type":"all"}'
```

---

## Summary

After completing these steps:
1. ✅ Publish blog post in SF-CMS
2. ✅ All three webs rebuild automatically (5-10 seconds)
3. ✅ Post visible on all three sites simultaneously
4. ✅ Zero manual deploys needed
5. ✅ 1-hour ISR fallback if webhooks fail

**Phase C is complete when test post appears on all three webs within 10 seconds of publishing in CMS.**
