# Fase 3 — Supabase Setup Instructions

**Supabase Project:** `dmzecrlkclocqaywkjtc` (Startup Factory shared)

## Step 1: Apply SQL Migration

1. Go to **Supabase Dashboard** → Select project `dmzecrlkclocqaywkjtc`
2. SQL Editor → New Query
3. Copy the entire content from `apps/sf-cms/supabase/migrations/001_create_sf_cms_schema.sql`
4. Paste into the query editor
5. Click **Run** (don't worry about extension warnings, they're expected)
6. Verify no errors appear; should see "✓ Success"

**Verification:**
```sql
-- Run this query to verify tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
```

Should return:
- clients
- media
- page_activity
- page_versions
- pages
- posts
- posts_revisions
- projects
- section_types

---

## Step 2: Enable RLS Policies

RLS is already enabled in the migration, but verify:

1. Go to **Authentication** → **Policies**
2. Select each table: pages, posts, projects, media, etc.
3. Verify policies named "* Admin only" exist
4. Each should have: `USING: is_admin()`

If any are missing, the migration didn't apply fully. Re-run Step 1 and check for errors.

---

## Step 3: Configure Webhooks

### For `pages` table (NEW — currently missing)

1. Supabase Dashboard → **Database** → **Webhooks**
2. Click **Create webhook**
3. Fill:
   - **Name:** `pages_revalidate`
   - **Table:** `pages`
   - **Event:** SELECT (Insert, Update, Delete)
   - **HTTP method:** POST
   - **URL:** `https://cms.startupsfactory.es/api/revalidate`
   - **Headers:** Add custom header
     - Key: `x-revalidate-secret`
     - Value: `${REVALIDATE_SECRET}` (from .env)

### For `posts` table (VERIFY EXISTS)

Should already be wired from previous sessions. Verify:

1. **Database** → **Webhooks**
2. Look for `posts_revalidate`
3. If it exists, verify the URL and headers are correct
4. If not, create it following the same pattern as above

---

## Step 4: Test Webhook

```bash
# Test the posts webhook
curl -X POST https://cms.startupsfactory.es/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: ${REVALIDATE_SECRET}" \
  -d '{"type": "post", "slug": "test-post"}'

# Should return:
# {"revalidated": true, "timestamp": "2026-07-14T..."}
```

If you get 401 or 500, check:
- REVALIDATE_SECRET is correct
- SF-CMS server is running (or check Vercel logs)
- Webhook URL is accessible from internet

---

## Step 5: Verify RLS with Test Query

```sql
-- This should return rows (admin bypass)
SELECT id, title, slug FROM pages LIMIT 1;

-- This should return empty (non-admin blocked)
SET ROLE authenticated; -- Simulate non-admin user
SELECT id, title, slug FROM pages LIMIT 1;

-- Reset
RESET ROLE;
```

---

## Quick Checklist

- [ ] SQL migration applied (8 tables created)
- [ ] `is_admin()` function exists
- [ ] RLS enabled on all tables
- [ ] pages webhook created and wired to /api/revalidate
- [ ] posts webhook verified (should exist)
- [ ] Test webhook returns 200 + `revalidated: true`

---

## Rollback (if needed)

```sql
-- Drop schema and recreate empty (destructive)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon, authenticated;
```

Then re-apply migration from Step 1.
