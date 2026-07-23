-- CRITICAL FIX: mira_project_access's own SELECT policy still depended on the
-- deprecated mira_users bridge table (auth_id -> id lookup) instead of comparing
-- auth.uid() to user_id directly.
--
-- Migration 0016_unify_auth_users.sql changed mira_project_access.user_id's FK to
-- reference auth.users(id) directly and stated mira_users "is no longer used for
-- auth" -- but this table's own RLS policy was never updated to match, and kept
-- doing: user_id = (SELECT mira_users.id FROM mira_users WHERE mira_users.auth_id
-- = auth.uid() LIMIT 1).
--
-- Confirmed live: mira_users has 0 rows, so that subquery never matched anyone.
-- Of the 7 real production users, only the one with user_metadata.plan = 'admin'
-- ever passed this policy (via the OR's first clause). Every other real client
-- has been unable to read their own mira_project_access row via RLS -- which
-- cascades to every other table whose policy subqueries mira_project_access
-- (e.g. leads, mira_projects), since that subquery runs under the querying
-- user's own RLS permissions on mira_project_access.
--
-- Fix: replace the dead mira_users subquery with a direct auth.uid() = user_id
-- comparison, matching migration 0016's stated architecture. The admin-plan
-- override clause is left untouched.

alter policy "mira_project_access: users see own"
on "public"."mira_project_access"
to public
using (
  (((auth.jwt() -> 'user_metadata'::text) ->> 'plan'::text) = 'admin'::text)
  OR (user_id = auth.uid())
);
