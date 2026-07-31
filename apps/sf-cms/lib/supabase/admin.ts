import { createServiceRoleClient } from '@sf/supabase'

/**
 * Admin Supabase client for SF-CMS backend
 * Uses service_role key for full database access
 * NEVER expose this to the browser
 */
export function createAdminClient() {
  return createServiceRoleClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
