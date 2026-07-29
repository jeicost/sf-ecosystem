import type { adminClient } from '@/lib/supabase'

// Shared query for "real approved visuals" -- the actual creative a human
// approved in /approvals for this client. Backs both the Studio archetype's
// Workspace tab (app/api/studio/approved-visuals) and the vision grounding
// given to designer/spark's generate_image tool (app/api/agent/route.ts).
const APPROVED_STATUSES = ['approved', 'approved_with_edits']

export interface ApprovedVisualRow {
  id: string
  platform: string | null
  status: string
  asset_url: string | null
  submitted_at: string
  reviewed_at: string | null
}

export async function fetchApprovedVisuals(
  admin: ReturnType<typeof adminClient>,
  clientId: string,
  limit = 12
): Promise<ApprovedVisualRow[]> {
  const { data, error } = await admin
    .from('approval_queue')
    .select('id, platform, status, asset_url, submitted_at, reviewed_at')
    .eq('client_id', clientId)
    .in('status', APPROVED_STATUSES)
    .not('asset_url', 'is', null)
    .order('reviewed_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('fetchApprovedVisuals error:', error.message)
    return []
  }
  return data ?? []
}
