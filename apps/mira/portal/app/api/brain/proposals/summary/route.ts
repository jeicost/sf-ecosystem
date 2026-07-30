import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'
import { fetchProposalsSummary } from '@/lib/brain-proposals-sentinel'

// Resumen cross-cliente de propuestas pendientes del Brand Brain -- solo
// agencia (admin/super_admin). Un cliente solo ve las suyas vía
// GET /api/brain/proposals?clientId=...
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plan = (user.user_metadata?.plan as string) ?? 'starter'
  if (plan !== 'super_admin' && plan !== 'admin') {
    return NextResponse.json({ error: 'Solo la agencia puede ver el resumen cross-cliente' }, { status: 403 })
  }

  const result = await fetchProposalsSummary(adminClient())
  return NextResponse.json(result)
}
