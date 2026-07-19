import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireLeadAccess } from '@/lib/comercial/lead-access'
import { promoteLeadToCrm } from '@/lib/comercial/promote-lead'

/**
 * POST /api/comercial/promote — puente leads → crm_contacts (Fase B).
 * Body: { leadId }. Auth por ownership del lead (patrón Fase A).
 */
export async function POST(req: NextRequest) {
  const { leadId } = await req.json()

  const access = await requireLeadAccess(leadId)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

  const result = await promoteLeadToCrm(adminClient(), leadId, access.lead.client_id)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status })

  return NextResponse.json({
    success: true,
    crm_contact_id: result.crmContactId,
    workspace: result.workspace,
    already_promoted: result.alreadyPromoted,
  })
}
