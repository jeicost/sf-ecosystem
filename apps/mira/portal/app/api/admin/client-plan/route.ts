import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'
import { BILLING_PLANS, billingPlan, type BillingPlanId } from '@/lib/billing/plans'
import { errorMessage } from '@/lib/email-ops/auth'

// Tier de facturación de una MARCA (clients.plan). Es lo que decide asientos,
// marcas e imágenes al mes.
//
// ⚠️ No confundir con /api/admin/users/plan, que cambia user_metadata.plan — el
// plan de una PERSONA, que decide qué departamentos ve. Comparten la palabra
// "growth" y no son lo mismo (ver la cabecera de lib/billing/plans.ts). Hasta
// ahora clients.plan no se podía tocar desde ninguna pantalla: todas las marcas
// arrastraban el 'starter' del DEFAULT de la 0069, que con el tope de imágenes
// encendido deja de ser inofensivo.
//
// Lo que NO toca: nada de Stripe. Si la marca tiene suscripción, el webhook
// manda; esto es para las cuentas gestionadas, que son todas hoy.

export async function PUT(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user || user.user_metadata?.plan !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const clientId = typeof body.clientId === 'string' ? body.clientId : ''
    const planId = typeof body.plan === 'string' ? body.plan : ''
    if (!clientId || !(planId in BILLING_PLANS)) {
      return NextResponse.json({ error: 'clientId y plan válidos requeridos' }, { status: 400 })
    }

    const plan = billingPlan(planId as BillingPlanId)
    const db = adminClient()
    const { error } = await db
      .from('clients')
      // max_seats acompaña al tier, igual que hace el webhook de Stripe: dejarlo
      // atrás daría una marca en Brand House con los 2 asientos de Starter.
      .update({ plan: plan.id, max_seats: plan.seats })
      .eq('id', clientId)
    if (error) throw error

    return NextResponse.json({ ok: true, plan: plan.id, seats: plan.seats, images: plan.images })
  } catch (error) {
    console.error('admin/client-plan PUT error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
