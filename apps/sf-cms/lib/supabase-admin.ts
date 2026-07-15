import { createClient } from '@supabase/supabase-js'

let adminClient: ReturnType<typeof createClient> | null = null

export function createServiceClient() {
  if (adminClient) return adminClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase credentials: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
    )
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey)
  return adminClient
}
