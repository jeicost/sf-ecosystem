// Sincroniza lo que una marca PAGA con lo que sus personas VEN.
//
// Conviven dos taxonomías de "plan" (ver lib/billing/plans.ts): clients.plan
// (facturación, lo escribe el webhook de Stripe) y user_metadata.plan
// (secciones, lo lee proxy.ts vía PLAN_SECTIONS). Hasta ahora nada las unía:
// pagar Marca (690 €) subía clients.plan y el usuario seguía viendo las
// secciones de Starter — cobrar sin entregar. Este módulo es el puente, y es
// EL ÚNICO sitio donde vive el mapeo.

import { adminClient } from '@/lib/supabase'
import type { BillingPlanId } from '@/lib/billing/plans'
import type { UserPlan } from '@/lib/plans'

// Los paquetes enterprise (venta asistida) abren todos los departamentos;
// los autoservicio se quedan en Starter. Ajustar aquí si cambia el comercial.
const SECTION_PLAN_FOR_BILLING: Record<BillingPlanId, UserPlan> = {
  starter: 'starter',
  starter_multi: 'starter',
  brand: 'scale',
  growth: 'scale',
  brand_house: 'scale',
}

// Planes de sección que el sync JAMÁS pisa: roles internos y el plan-sin-
// toolkit. Un pago del cliente no debe degradar al equipo de la agencia ni
// promocionar a un usuario de consulta.
const NEVER_OVERWRITE: ReadonlySet<string> = new Set(['super_admin', 'admin', 'consulta'])

export function sectionPlanForBilling(billingPlanId: BillingPlanId): UserPlan {
  return SECTION_PLAN_FOR_BILLING[billingPlanId] ?? 'starter'
}

/**
 * Aplica a TODAS las personas con acceso a la marca el plan de secciones que
 * corresponde a su plan de facturación. Best-effort por usuario: un fallo en
 * uno no impide los demás (el webhook de Stripe reintenta el evento entero si
 * devolvemos error, y regenerar metadata es idempotente).
 *
 * El Admin API de GoTrue falla intermitentemente con "unrecognized JWT kid"
 * en escrituras (mismo quirk que app/api/admin/users/plan) — 3 intentos.
 */
export async function syncSectionPlanForClient(
  clientId: string,
  billingPlanId: BillingPlanId
): Promise<{ updated: number; skipped: number; failed: number }> {
  const db = adminClient()
  const target = sectionPlanForBilling(billingPlanId)
  const result = { updated: 0, skipped: 0, failed: 0 }

  const { data: grants, error } = await db
    .from('mira_project_access')
    .select('user_id')
    .eq('project_id', clientId)
  if (error || !grants?.length) {
    if (error) console.error('plan-sync: could not read grants for', clientId, error.message)
    return result
  }

  for (const grant of grants) {
    try {
      const { data: existing } = await db.auth.admin.getUserById(grant.user_id)
      const current = existing?.user?.user_metadata?.plan
      if (!existing?.user || (typeof current === 'string' && NEVER_OVERWRITE.has(current))) {
        result.skipped++
        continue
      }
      if (current === target) {
        result.skipped++
        continue
      }

      const nextMetadata = { ...existing.user.user_metadata, plan: target }
      let ok = false
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        const { data } = await db.auth.admin.updateUserById(grant.user_id, {
          user_metadata: nextMetadata,
        })
        ok = Boolean(data?.user)
        if (!ok) await new Promise((r) => setTimeout(r, 800))
      }
      if (ok) result.updated++
      else {
        result.failed++
        console.error('plan-sync: metadata update failed for user', grant.user_id, 'client', clientId)
      }
    } catch (err) {
      result.failed++
      console.error('plan-sync: unexpected failure for user', grant.user_id, err)
    }
  }

  return result
}
