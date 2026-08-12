import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { loadSelfServeState } from '@/lib/onboarding/self-serve-server'

// GET /api/onboarding/self-serve/progress?clientId=
//
// Progreso honesto del Cerebro: cuántos de los 9 imprescindibles están puestos,
// cuántos slots de brand_data tienen contenido y cuántos pilares hay.
//
// Sin gate de agencia a propósito: resolveRequestClient ya exige un grant en
// mira_project_access para el cliente pedido, que es la comprobación correcta
// para una ruta que el DUEÑO de la marca usa sobre su propia marca.
export async function GET(req: NextRequest) {
  try {
    const access = await resolveRequestClient(new URL(req.url).searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const state = await loadSelfServeState(access.clientId)
    return NextResponse.json({ client_id: access.clientId, ...state })
  } catch (error) {
    console.error('onboarding/self-serve/progress error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not read your setup progress' },
      { status: 500 }
    )
  }
}
