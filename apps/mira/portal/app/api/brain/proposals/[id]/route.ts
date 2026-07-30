import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { applyBrainChanges, type BrainChange } from '@/lib/brain-tools'

// P6 — confirmar o rechazar una propuesta. Regla: la agencia (admin/super_admin)
// confirma todo; un cliente solo puede confirmar lo que propuso la agencia…
// decisión CEO: lo del cliente deja AVISO → el cliente propone, la AGENCIA
// confirma. Los clientes sí pueden rechazar sus propias propuestas pendientes.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { action } = await req.json()
    if (action !== 'confirm' && action !== 'reject') {
      return NextResponse.json({ error: "action debe ser 'confirm' o 'reject'" }, { status: 400 })
    }

    const admin = adminClient()
    const { data: proposal, error } = await admin
      .from('brain_change_proposals')
      .select('id, client_id, project_id, origin, status, summary, changes, proposed_by')
      .eq('id', id)
      .maybeSingle()
    if (error || !proposal) {
      return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 })
    }
    if (!(await userCanAccessClient(user, proposal.client_id))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }
    if (proposal.status !== 'pending') {
      return NextResponse.json({ error: `La propuesta ya está ${proposal.status}` }, { status: 409 })
    }

    const plan = (user.user_metadata?.plan as string) ?? 'starter'
    const isAgency = plan === 'super_admin' || plan === 'admin'
    if (action === 'confirm' && !isAgency) {
      return NextResponse.json(
        { error: 'Las propuestas las confirma la agencia — la tuya quedó registrada y avisada.' },
        { status: 403 }
      )
    }
    if (action === 'reject' && !isAgency && proposal.proposed_by !== user.id) {
      return NextResponse.json({ error: 'Solo puedes retirar tus propias propuestas' }, { status: 403 })
    }

    if (action === 'reject') {
      await admin
        .from('brain_change_proposals')
        .update({ status: 'rejected', resolved_by: user.id })
        .eq('id', proposal.id)
      return NextResponse.json({ success: true, status: 'rejected' })
    }

    // confirm → aplicar con los executors compartidos
    try {
      const sourceType = proposal.origin === 'drive_sync' || proposal.origin === 'lint' ? proposal.origin : 'chat'
      const applied = await applyBrainChanges(
        proposal.client_id,
        (proposal.changes as BrainChange[]) ?? [],
        proposal.project_id,
        { sourceType, sourceRef: proposal.id }
      )
      await admin
        .from('brain_change_proposals')
        .update({ status: 'applied', resolved_by: user.id, applied_at: new Date().toISOString() })
        .eq('id', proposal.id)
      return NextResponse.json({ success: true, status: 'applied', applied })
    } catch (applyError) {
      await admin
        .from('brain_change_proposals')
        .update({ status: 'failed', resolved_by: user.id })
        .eq('id', proposal.id)
      return NextResponse.json(
        { error: applyError instanceof Error ? applyError.message : 'Error aplicando los cambios' },
        { status: 500 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
