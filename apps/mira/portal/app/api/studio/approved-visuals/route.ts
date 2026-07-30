import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { fetchApprovedVisualsStatus } from '@/lib/studio-references'

// Real approved visuals for the Studio archetype (designer/spark/video-editor
// Workspace tab) -- replaces the hardcoded DEFAULT_PROJECTS mock. Sources
// from approval_queue, the same table /approvals reads/writes, so "approved"
// here means a human actually approved it in the real review flow.

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId')
  const resolved = await resolveRequestClient(clientId)
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status })
  }

  const result = await fetchApprovedVisualsStatus(adminClient(), resolved.clientId)
  if (result.status !== 'ready') {
    return NextResponse.json(result)
  }

  const projects = result.data.map((row) => ({
    id: row.id,
    name: row.platform ? `Post aprobado — ${row.platform}` : 'Post aprobado',
    type: 'post' as const,
    tool: 'custom' as const,
    status: 'approved' as const,
    updatedAt: new Date(row.reviewed_at ?? row.submitted_at).toLocaleString('es-ES', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    preview: row.asset_url ?? undefined,
  }))

  return NextResponse.json({ status: 'ready', data: projects })
}
