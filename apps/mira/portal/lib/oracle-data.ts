import type { adminClient } from '@/lib/supabase'
import { WorkspaceStatus, workspaceError } from '@/lib/archetype-workspace'

// Oracle archetype (copy variants to pick from): copywriter, icebreaker-writer.
// Real source: recent quick_actions_results content for this role's real
// actions. No engagement metric exists anywhere in MIRA (no social API
// integration) -- unlike the old mock, we never invent one.
const ROLE_ACTION_TYPES: Record<string, string[]> = {
  copywriter: ['crear_post', 'crear_newsletter', 'crear_video_brief', 'crear_carousel'],
  'icebreaker-writer': [], // no dedicated quick action today; chat-only role
}

export interface OracleVariant {
  id: string
  text: string
  platform?: string
}

function extractDisplayText(output: Record<string, unknown> | null): string | null {
  if (!output) return null
  const candidates = ['copy', 'body', 'message', 'newsletter_body', 'script', 'content']
  for (const key of candidates) {
    const val = output[key]
    if (typeof val === 'string' && val.trim()) return val.trim()
  }
  return null
}

export async function fetchOracleVariants(
  admin: ReturnType<typeof adminClient>,
  clientId: string,
  role: string
): Promise<WorkspaceStatus<OracleVariant[]>> {
  const actionTypes = ROLE_ACTION_TYPES[role] ?? []
  if (actionTypes.length === 0) return { status: 'empty' }

  const { data, error } = await admin
    .from('quick_actions_results')
    .select('id, action_type, output_data, created_at')
    .eq('client_id', clientId)
    .eq('status', 'success')
    .in('action_type', actionTypes)
    .order('created_at', { ascending: false })
    .limit(8)

  if (error) return workspaceError(error.message)

  const variants: OracleVariant[] = (data ?? [])
    .map((row): OracleVariant | null => {
      const text = extractDisplayText(row.output_data as Record<string, unknown> | null)
      if (!text) return null
      const output = row.output_data as Record<string, unknown> | null
      return {
        id: row.id as string,
        text,
        platform: typeof output?.platform === 'string' ? (output.platform as string) : undefined,
      }
    })
    .filter((v): v is OracleVariant => v !== null)

  if (variants.length === 0) return { status: 'empty' }
  return { status: 'ready', data: variants }
}
