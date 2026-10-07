import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'
import { errorMessage } from '@/lib/email-ops/auth'
import { CLIENT_MONTHLY_BUDGET_USD } from '@/lib/ai/budget'

// Tope mensual de IA de una MARCA (clients.ai_budget_usd), solo Super Admin.
// null → el general (MIRA_CLIENT_MONTHLY_BUDGET_USD, 30 $); 0 → sin tope; otro
// número → ese. Lo aplica lib/ai/budget.ts antes de cada llamada al modelo.
// Hermano de /api/admin/client-plan (tier) con el mismo patrón de permisos.

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user || user.user_metadata?.plan !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await req.json().catch(() => ({}))
    const clientId = typeof body.clientId === 'string' ? body.clientId : ''
    if (!clientId) return NextResponse.json({ error: 'clientId requerido' }, { status: 400 })
    let budget: number | null
    if (body.budget === null || body.budget === undefined || body.budget === '') budget = null
    else {
      const n = Number(body.budget)
      if (!Number.isFinite(n) || n < 0 || n > 100000) return NextResponse.json({ error: 'budget: número ≥ 0 (0 = sin tope) o vacío para el general' }, { status: 400 })
      budget = Math.round(n * 100) / 100
    }
    const db = adminClient()
    const { error } = await db.from('clients').update({ ai_budget_usd: budget }).eq('id', clientId)
    if (error) throw error
    return NextResponse.json({ ok: true, budget, effective: budget ?? CLIENT_MONTHLY_BUDGET_USD })
  } catch (error) {
    console.error('admin/client-budget PUT error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
