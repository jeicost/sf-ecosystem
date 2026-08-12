import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { applyBrainChange } from '@/lib/brain-tools'
import { sanitizeDraft, draftToBrainPayload } from '@/lib/onboarding/self-serve'
import { ensureBrandProfile, loadSelfServeState } from '@/lib/onboarding/self-serve-server'

export const maxDuration = 120

// POST /api/onboarding/self-serve/apply — {clientId?, brand_name, website_url?, draft, finish?}
//
// Escribe en el Cerebro lo que el cliente acaba de revisar. El navegador manda
// el borrador PLANO; las claves canónicas las decide draftToBrainPayload aquí
// en el servidor, para que ni un body manipulado ni un rediseño de la UI puedan
// meter datos en una clave que después no lee ningún prompt.
//
// Se reutilizan los executors compartidos (applyBrainChange): mismo deep-merge
// y misma provenance que el alta de agencia y que la ingesta de cuestionarios.
// No hay bandeja de propuestas de por medio a propósito — la pantalla de
// revisión ES la confirmación. Una propuesta que espera a que alguien la
// apruebe es el tiempo del CEO que no escala a cincuenta marcas personales.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const access = await resolveRequestClient(typeof body.clientId === 'string' ? body.clientId : null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const clientId = access.clientId

    const draft = sanitizeDraft(body.draft)
    const brandName = typeof body.brand_name === 'string' ? body.brand_name.trim() : ''
    const websiteUrl = typeof body.website_url === 'string' ? body.website_url.trim() : ''
    const finish = body.finish === true

    const { profile, pillars } = draftToBrainPayload(draft, { brandName, websiteUrl })
    if (!Object.keys(profile).length && !pillars.length) {
      return NextResponse.json({ error: 'There is nothing to save yet' }, { status: 400 })
    }

    await ensureBrandProfile(clientId, brandName)

    // Los pilares se guardan uno a uno y los fallos no se tragan: son el único
    // gate que bloquea el producto entero, así que "se guardó todo menos los
    // pilares" tiene que ser visible, no un éxito silencioso.
    const failures: string[] = []
    if (Object.keys(profile).length) {
      try {
        await applyBrainChange(
          clientId,
          { target: 'brand_profile', op: 'merge', payload: profile },
          undefined,
          { sourceType: 'onboarding', sourceRef: 'self_serve' }
        )
      } catch (e) {
        failures.push(e instanceof Error ? e.message : 'Could not save your brand details')
      }
    }

    let pillarsSaved = 0
    for (const pillar of pillars) {
      try {
        await applyBrainChange(
          clientId,
          { target: 'content_pillar', op: 'add', payload: pillar },
          undefined,
          { sourceType: 'onboarding', sourceRef: 'self_serve' }
        )
        pillarsSaved++
      } catch (e) {
        failures.push(`${pillar.pillar_name}: ${e instanceof Error ? e.message : 'could not be saved'}`)
      }
    }

    // clients.onboarding_mode se estrena aquí: hasta ahora la columna de la
    // migración 0069 no la leía ni la escribía nadie y los 11 clientes estaban
    // en el default 'assisted'. Solo se marca al TERMINAR — a mitad del alta el
    // cliente sigue siendo un alta sin modo decidido.
    //
    // Deliberadamente NO se toca clients.plan: hoy el gating real vive en
    // auth.users.user_metadata.plan (proxy.ts:118-123, lib/plans.ts) y escribir
    // aquí un plan que nadie lee crearía una tercera fuente de verdad. Esa
    // consolidación es una decisión de facturación, no del alta.
    if (finish && !failures.length) {
      const { error } = await adminClient()
        .from('clients')
        .update({ onboarding_mode: 'self_serve' })
        .eq('id', clientId)
      if (error) failures.push(`Could not mark your setup as finished: ${error.message}`)
    }

    // El estado se relee de la BD DESPUÉS de escribir: el progreso que ve el
    // cliente al terminar sale de lo que hay guardado de verdad, no de lo que
    // creíamos haber guardado. `state.finished` es la fuente autoritativa del
    // onboarding_mode recién escrito.
    const state = await loadSelfServeState(clientId)

    return NextResponse.json({
      success: failures.length === 0,
      client_id: clientId,
      pillars_saved: pillarsSaved,
      ...(failures.length ? { errors: failures } : {}),
      ...state,
    })
  } catch (error) {
    console.error('onboarding/self-serve/apply error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not save your Brand Brain' },
      { status: 500 }
    )
  }
}
