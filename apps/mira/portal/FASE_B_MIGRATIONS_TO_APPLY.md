# FASE B Migrations — Manual Execution Required

## Overview
The following migrations must be applied manually in the Supabase SQL editor before Agent settings and Brand Brain features will work.

## 1. Migration 0019: Brand Brain Fixes + Agent Settings Schema

**File**: `supabase/migrations/0019_brand_brain_fixes.sql`

**What it does**:
- Fixes FK constraints in `brain_versions`, `brain_resources`, `brain_learnings` (were pointing to `mira_users`, should point to `clients`)
- Creates `agent_settings` table for persisting autonomy/tone_level by client+agent_role
- Adds missing columns to `agent_activity` (post_id, details JSONB)
- Fixes 0018 migration bug (JSONB cast) and creates `brand_documents` table

**To apply**:
1. Go to Supabase Dashboard → your project
2. Click SQL Editor → New Query
3. Paste the entire contents of `supabase/migrations/0019_brand_brain_fixes.sql`
4. Click "Run"
5. Confirm no errors appear

**Status**: ✅ File ready at `apps/mira/portal/supabase/migrations/0019_brand_brain_fixes.sql`

---

## 2. Migration 0020: Seed Brand Data — Real Data for 4 Clients

**File**: `supabase/migrations/0020_seed_brand_data.sql`

**What it does**:
- Seeds complete brand profiles for:
  - **Salsa Burgers** (`c375bb80-b0d1-4923-a73a-ac96a3ce7799`): mission, tone, values, 4 content pillars
  - **Startup Factory** (`cef0a1b7-aabb-4239-a5a8-28ece0d1819b`): tagline, 4 pillars with weights (40/30/20/10)
  - **Discoolver** (`160d5a90-0da7-4db1-a1fb-9c29ea57a736`): curated discovery positioning, 4 pillars
  - **Dadybox** (`e664873b-034d-48cd-9a45-8631672ef375`): 3PL fulfillment, 3 pillars
- All inserts use ON CONFLICT for idempotent re-execution

**To apply**:
1. Go to Supabase Dashboard → SQL Editor → New Query
2. Paste the entire contents of `supabase/migrations/0020_seed_brand_data.sql`
3. Click "Run"
4. Confirm no errors appear

**Status**: ✅ File ready at `apps/mira/portal/supabase/migrations/0020_seed_brand_data.sql`

---

## What Works After These Migrations

### Agent Settings Persistence
- Autonomy level (always_ask / full_auto) saved per agent+client
- Tone level (0.0-1.0) saved per agent+client
- Settings loaded on page mount from `/api/agent-settings`
- Changes saved automatically when user adjusts sliders/buttons

### Brand Brain Data Flow
- `/brand-brain` page loads real data for 4 clients (Salsa, Startup Factory, Discoolver, Dadybox)
- Agent chat can read brand context from `fetchBrandBrain()` → uses real mission/tone/pillars
- Agents have access to authentic brand voice for each client

### Agent Quick Prompts
- 3-4 contextual prompts per agent role (30 agents × 3-4 prompts)
- Shown in empty chat state as clickable buttons
- Helps users start conversations faster

### Fallback Agent Details
- 12 fully-featured agents (Orchestrator, Luna, Rex, Vera, etc.) with real task examples
- 18 stub agents inherit polished defaults
- Recent tasks use real examples from agent-details.ts
- No more "Task 1, Task 2, Task 3" filler

---

## Verification Checklist After Applying Migrations

**In Supabase SQL Editor**:
```sql
-- Verify agent_settings table exists and has RLS
SELECT * FROM pg_tables WHERE tablename = 'agent_settings';

-- Verify brand data seeded (should return 4 rows)
SELECT client_id, name FROM brand_profiles WHERE client_id IN (
  'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
  'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
  '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
  'e664873b-034d-48cd-9a45-8631672ef375'
);
```

**In Application**:
1. Navigate to `/agent/orchestrator` or any agent
2. ✅ Should load without errors (not 404)
3. ✅ Quick prompts visible in empty chat state
4. ✅ Autonomy/Tone sliders interactive
5. Change autonomy → reload → setting persists
6. Verify in Supabase: `SELECT * FROM agent_settings` shows your change

---

## Next Phase (FASE C) — File Upload Support

Once migrations are applied, the following can be implemented:
- File upload button in agent chat (PDF/TXT/CSV support)
- Document extraction API
- Attach files to messages
- Optional: Save to Brand Brain

**Status**: Prepared but not yet implemented (requires pdf-parse dependency + extraction logic)

---

## Notes

- These migrations are **idempotent** — can be re-run safely if needed
- The `brand_data` JSONB column is created but not yet used by agent chat (legacy columns are sufficient)
- RLS policies ensure users only access their client's settings and documents
- All timestamps use `NOW()` for consistency

---

## Troubleshooting

**Error: "Syntax error at line X"**
→ Verify the entire migration SQL is pasted (not truncated)

**Error: "relation already exists"**
→ This is fine — migration has DO blocks with `IF NOT EXISTS` checks

**Settings not persisting after reload**
→ Verify `agent_settings` table exists and RLS policies are applied

**Brand data not showing in /brand-brain**
→ Confirm 0020 migration ran without errors
