import { createServiceRoleClient } from '@sf/supabase'

// Single service-role client, bypasses RLS. Never exposed to the browser —
// every query goes through Next.js API routes (see CLAUDE.md).
export const supabase = createServiceRoleClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export const supabaseAdmin = supabase

export type Database = any
