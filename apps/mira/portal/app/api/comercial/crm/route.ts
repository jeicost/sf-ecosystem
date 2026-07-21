import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'

/**
 * GET /api/comercial/crm?clientId= — contactos ya promovidos al SF CRM.
 *
 * Traduce client_id → workspace vía client_workspaces (mismo mapeo que usa
 * promoteLeadToCrm) y lista crm_contacts de ese workspace. Si el cliente no
 * tiene workspace mapeado, lo dice claro en vez de inventar uno.
 */
export async function GET(req: NextRequest) {
  const access = await resolveRequestClient(req.nextUrl.searchParams.get('clientId'))
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const admin = adminClient()

  const { data: mapping } = await admin
    .from('client_workspaces')
    .select('workspace')
    .eq('client_id', access.clientId)
    .maybeSingle()

  if (!mapping) {
    return NextResponse.json({ workspace: null, contacts: [] })
  }

  // Shape real de crm_contacts en prod (verificado 2026-07-21):
  // first_name/last_name/company_name/title/stage/classification…
  const { data: contacts, error } = await admin
    .from('crm_contacts')
    .select('id, first_name, last_name, company_name, title, email, hot_score, source, stage, created_at')
    .eq('workspace_id', mapping.workspace)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ workspace: mapping.workspace, contacts: contacts ?? [] })
}
