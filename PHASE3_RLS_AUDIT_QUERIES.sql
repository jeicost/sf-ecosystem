-- Phase 0: RLS Security Audit Queries
-- Run these in EACH old Supabase instance's SQL Editor
-- Expected results shown in comments

-- =============================================================================
-- Instance 1: nnevhtfxuawexliwlbmh (AI Agency + CRM)
-- =============================================================================

-- Query 1: Verify RLS enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- EXPECTED: All tables should have rowsecurity = true
-- If any are false: STOP — RLS not enabled


-- Query 2: Check for insecure USING(true) policies
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE schemaname = 'public' AND qual LIKE '%true%';
-- EXPECTED: EMPTY result (0 rows)
-- If you see anything: RLS bypass vulnerability exists — STOP


-- Query 3: List all RLS policies (verify isolation filters exist)
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- EXPECTED: Policies should check client_slug, workspace_id, or similar filters
-- Look for: No blanket USING(true) or WITH CHECK(true) without conditions


-- =============================================================================
-- Instance 2: dmzecrlkclocqaywkjtc (MIRA + CMS)
-- =============================================================================

-- Run the same 3 queries above in this instance's SQL Editor


-- =============================================================================
-- After verification:
-- If all queries return:
--   Query 1: All tables with rowsecurity = true
--   Query 2: No results (empty)
--   Query 3: Proper isolation filters in place
--
-- Then: Phase 0 PASSED ✅ — Safe to proceed to Phase 3.1
--
-- If any issues found:
--   STOP — Do not proceed with Phase 3
--   Apply RLS hardening patches (to be provided)
--   Re-run audit until passed
-- =============================================================================
