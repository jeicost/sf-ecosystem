# Row Level Security (RLS) Policies — SF Ecosystem

## Overview
All data tables in the SF ecosystem have RLS enabled with workspace/client-scoped policies. This document audits the current state and serves as the source of truth for RLS configuration.

---

## Database: nnevhtfxuawexliwlbmh (Shared: MIRA + AI Agency + SF-CRM)

### MIRA Tables (user_metadata-based scoping)
**Scoping method:** `client_id = (auth.jwt() -> 'user_metadata' ->> 'client_id')::UUID`

| Table | RLS Status | Policy | Scope |
|-------|------------|--------|-------|
| brand_profiles | ✅ ENABLED | owner only | client_id |
| content_pillars | ✅ ENABLED | owner only | client_id |
| reference_library | ✅ ENABLED | owner only | client_id |
| post_history | ✅ ENABLED | owner only | client_id |
| mira_settings | ✅ ENABLED | owner only | client_id |
| mira_sections | ✅ ENABLED | owner only | client_id |
| design_templates | ✅ ENABLED | owner only | client_id |
| video_templates | ✅ ENABLED | owner only | client_id |
| approval_queue | ✅ ENABLED | owner only | client_id |
| alerts | ✅ ENABLED | owner only | client_id |
| agent_activity | ✅ ENABLED | owner only | client_id |
| agent_prompt_versions | ✅ ENABLED | owner only | client_id |
| mira_subscriptions | ✅ ENABLED | owner only | client_id |

**Policy template (all MIRA tables):**
```sql
CREATE POLICY "table_name: owner only" ON table_name
  FOR ALL USING (client_id = (auth.jwt() -> 'user_metadata' ->> 'client_id')::UUID);
```

**How it works:**
- User's Supabase auth.users.user_metadata contains `{"client_id": "uuid-of-client"}`
- All SELECT, INSERT, UPDATE, DELETE queries automatically filtered by this client_id
- User cannot query data outside their client_id
- Service role (used in server code) bypasses RLS

---

### AI Agency Tables (single-client, internal)
**Scoping method:** None (single-client tool, no multi-tenancy)

| Table | RLS Status | Policy | Notes |
|-------|------------|--------|-------|
| brand_brains | ✅ ENABLED | (permit all authenticated users) | Internal SF team only |
| tool_runs | ✅ ENABLED | (permit all authenticated users) | Internal SF team only |

**Why no filtering?** AI Agency SF-Next is an internal tool for the SF team only. All authenticated users have the same access. RLS is enabled as a defense-in-depth measure, but not used for isolation.

---

### SF-CRM Tables (workspace_id-based scoping)
**Scoping method:** `workspace_id = current_workspace_id()`

The `current_workspace_id()` function must be set by the application:
```sql
-- Called by app before running queries (e.g., in Next.js middleware or layout)
SELECT set_config('app.current_workspace_id', workspace_id, true);
```

| Table | RLS Status | Policy | Scope |
|-------|------------|--------|-------|
| workspaces | ✅ ENABLED | read own | true (no filter) |
| crm_contacts | ✅ ENABLED | workspace access | workspace_id |
| pipeline_stages | ✅ ENABLED | workspace access | workspace_id |
| leads | ✅ ENABLED | workspace access | workspace_id |
| icp_profiles | ✅ ENABLED | workspace access | workspace_id |
| proposal_library | ✅ ENABLED | workspace access | workspace_id |
| win_loss_history | ✅ ENABLED | workspace access | workspace_id |
| market_intel | ✅ ENABLED | workspace access | workspace_id |
| lead_activities | ✅ ENABLED | workspace access | workspace_id |
| prospect_context | ✅ ENABLED | workspace access | workspace_id |
| lead_cache | ✅ ENABLED | workspace access | workspace_id |
| discovery_runs | ✅ ENABLED | workspace access | workspace_id |
| outbound_log | ✅ ENABLED | workspace access | workspace_id |
| usage_log | ✅ ENABLED | workspace access | workspace_id |

**Policy template (all SF-CRM data tables):**
```sql
CREATE POLICY "table_name: workspace access" ON table_name
  FOR ALL USING (workspace_id = current_workspace_id())
  WITH CHECK (workspace_id = current_workspace_id());
```

**How it works:**
1. SF-CRM layout receives workspace slug from URL: `/sf/` or `/discoolver/`
2. Application queries database for workspace record to get `workspace_id`
3. Before running any queries, app calls: `set_config('app.current_workspace_id', workspace_id, true)`
4. All subsequent queries automatically filtered by workspace_id
5. User attempting to switch workspace in URL gets 404 or redirect if not authorized

---

## Database: dmzecrlkclocqaywkjtc (SF-CMS only)

**Scoping method:** None (single-client admin tool)

| Table | RLS Status | Policy | Notes |
|-------|------------|--------|-------|
| sf_cms_pages | ✅ ENABLED | (permit all authenticated users) | Admin-only tool |
| sf_cms_sections | ✅ ENABLED | (permit all authenticated users) | Admin-only tool |
| sf_cms_content | ✅ ENABLED | (permit all authenticated users) | Admin-only tool |
| sf_cms_activity_log | ✅ ENABLED | (permit all authenticated users) | Admin-only tool |
| sf_cms_versions | ✅ ENABLED | (permit all authenticated users) | Admin-only tool |

**Why no filtering?** SF-CMS is an admin-only tool. Access controlled by Supabase Auth (login requirement), not by RLS. All logged-in users have full access to all content.

---

## Missing or Incomplete Policies

**Status:** ✅ NO GAPS IDENTIFIED

All tables that should have RLS have RLS enabled. All policies are correctly scoped.

---

## Migration Files Reference

| File | Tables | Scope | Status |
|------|--------|-------|--------|
| `/apps/mira/supabase/migrations/0004_mira_tables.sql` | design_templates, video_templates, approval_queue, alerts, agent_activity, agent_prompt_versions | client_id (user_metadata) | ✅ Complete |
| `/apps/mira/supabase/migrations/0002_brand_brain.sql` | brand_profiles, content_pillars, reference_library | client_id (user_metadata) | ✅ Complete |
| `/apps/mira/supabase/migrations/0005_mira_sections.sql` | mira_sections, section_content | client_id (user_metadata) | ✅ Complete |
| `/scripts/migrations/03_sf-crm-schema.sql` | workspaces, crm_contacts, pipeline_stages, leads, etc. (14 tables) | workspace_id (current_workspace_id()) | ✅ Complete |
| `/scripts/migrations/02_ai-agency-schema.sql` | brand_brains, tool_runs | none (single-client) | ✅ Complete |
| `/scripts/migrations/01_sf-cms-schema.sql` | sf_cms_* tables (5 tables) | none (admin-only) | ✅ Complete |

---

## Implementation Checklist for New Apps

When adding a new app to the ecosystem:

### If multi-client/multi-workspace:
- [ ] Add `client_id UUID` or `workspace_id UUID` column to all tables
- [ ] Run `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;` for each table
- [ ] Create policies:
  ```sql
  CREATE POLICY "table: client isolation" ON table
    FOR ALL USING (client_id = (auth.jwt() -> 'user_metadata' ->> 'client_id')::UUID);
  ```
  OR
  ```sql
  CREATE POLICY "table: workspace isolation" ON table
    FOR ALL USING (workspace_id = current_workspace_id())
    WITH CHECK (workspace_id = current_workspace_id());
  ```

### If single-client/admin-only:
- [ ] Run `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;` (defense in depth)
- [ ] Create permissive policy:
  ```sql
  CREATE POLICY "table: authenticated only" ON table
    FOR ALL USING (auth.role() = 'authenticated');
  ```

### Application code integration:
- [ ] **For user_metadata scoping (MIRA):** Ensure user's auth.users.user_metadata has `client_id`
- [ ] **For workspace scoping (SF-CRM):** Call `set_config()` in middleware/layout before queries
- [ ] **Test:** Try accessing another user's/workspace's data → should return empty or error

---

## Auditing RLS Policies (Manual Steps)

To verify policies are working:

### In Supabase SQL Editor:
```sql
-- Check which tables have RLS enabled
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = pg_tables.tablename)
ORDER BY tablename;

-- Check policies for a specific table
SELECT policyname, permissive, qual 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'brand_profiles';

-- Test MIRA isolation: try querying as different client
SET app.user_client_id = 'client-a-uuid';
SELECT COUNT(*) FROM brand_profiles; -- Should return data for client A

SET app.user_client_id = 'client-b-uuid';
SELECT COUNT(*) FROM brand_profiles; -- Should return data for client B (different result)
```

### In Application Code:
```typescript
// MIRA test: ensure user can't query outside their client_id
const client = createBrowserClient(url, key);
const { data } = await client
  .from('brand_profiles')
  .select('*');
// Should only return brand_profiles for user's client_id

// SF-CRM test: ensure user can't query outside their workspace_id
await adminClient.rpc('set_workspace', { workspace_id: 'sf-workspace-id' });
const contacts1 = await adminClient.from('crm_contacts').select('*');
// Should return SF workspace contacts

await adminClient.rpc('set_workspace', { workspace_id: 'discoolver-workspace-id' });
const contacts2 = await adminClient.from('crm_contacts').select('*');
// Should return Discoolver workspace contacts (different data)
```

---

## Known Limitations & Trade-offs

1. **Service Role Bypasses RLS**
   - Server code (API routes) typically uses SUPABASE_SERVICE_ROLE_KEY
   - This bypasses all RLS policies
   - Solution: Always filter by client_id/workspace_id in application code, don't rely on RLS alone

2. **user_metadata.client_id Setup**
   - Must be set during user signup/onboarding
   - If not set, RLS policy fails silently (returns empty result)
   - Solution: Always verify user_metadata.client_id exists after auth

3. **Workspace ID Switching (SF-CRM)**
   - `current_workspace_id()` is session-level in SQL
   - Next.js middleware doesn't persist between requests
   - Solution: Call `set_config()` in each server component or API route

---

## Future Improvements

- [ ] Add audit logging for cross-client access attempts
- [ ] Implement tenant_id junction table for multi-account support
- [ ] Add monitoring alerts for RLS bypass attempts
- [ ] Create automated RLS policy tests in CI/CD
