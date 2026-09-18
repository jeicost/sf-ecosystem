import { NextRequest, NextResponse } from 'next/server'
import { requireTool } from '@/lib/tools/access'
import { adminClient } from '@/lib/supabase'
import { generateTenderOferta } from '@/lib/generation/tender-oferta'

// Paso 2b: del pliego a la OFERTA ECONÓMICA propuesta línea a línea, aprendida
// de las ofertas que el cliente ya presentó. Sale para revisar y editar; la
// persona decide, el agente propone.
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const pliego = typeof body.pliego === 'string' ? body.pliego.trim() : ''
    if (pliego.length < 200) return NextResponse.json({ error: 'Falta el pliego (pega PCAP + PPT con las tablas de precios)' }, { status: 400 })
    const access = await requireTool('tenders', body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const tenderId = typeof body.tenderId === 'string' ? body.tenderId : null
    const oferta = await generateTenderOferta({ clientId: access.clientId, pliegoText: pliego, tenderId })

    // Persistencia inmediata: una oferta generada nunca se pierde al recargar.
    if (tenderId) {
      await adminClient().from('tenders')
        .update({ oferta, updated_at: new Date().toISOString() })
        .eq('id', tenderId).eq('client_id', access.clientId)
    }
    return NextResponse.json(oferta)
  } catch (error) {
    console.error('tender/oferta error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 500 })
  }
}
