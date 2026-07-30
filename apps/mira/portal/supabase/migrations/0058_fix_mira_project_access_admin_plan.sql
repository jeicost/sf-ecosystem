-- mira_project_access's "users see own" policy still lets ANY user with
-- user_metadata.plan = 'admin' read the FULL table -- every user↔client
-- grant mapping across ALL tenants, not just their own. This was a
-- temporary artifact of the 0040 outage fix (at the time, 'admin' was the
-- only account that could pass the broken mira_users-subquery policy at
-- all) -- that reasoning is now stale: 0040 already restored the correct
-- direct auth.uid() = user_id comparison for regular users, and
-- super_admins already get full unrestricted read via the SEPARATE policy
-- "Super admins can view all access records" (0014_mira_project_access.sql),
-- which correctly checks plan = 'super_admin'.
--
-- 'admin' is a real, assignable plan (VALID_PLANS in
-- app/api/admin/users/plan/route.ts) held today by carlos@startupsfactory.es
-- -- confirmed via the Auth Admin API that no app-level feature depends on
-- this specific RLS grant (the 5 real "plan === 'admin'" checks in code --
-- brain/chat origin tagging, brain/proposals, questionnaires, BrainChatGate,
-- lib/questionnaires.ts -- are all plain application logic, untouched by
-- this policy change). Removing it costs nothing and closes a real
-- cross-tenant grant-table disclosure risk if 'admin' is ever assigned to
-- a non-staff account.

alter policy "mira_project_access: users see own"
on "public"."mira_project_access"
to public
using (
  user_id = auth.uid()
);
