import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { requireTool } from '@/lib/tools/access'
import { adminClient } from '@/lib/supabase'
import { generateTenderOferta } from '@/lib/generation/tender-oferta'
import { toJson } from '@/lib/db-json'
import { isUuid, loadTeaching, resolveTenderTeaching } from '@/lib/tenders/teaching'

// Paso 2b: del pliego a la OFERTA ECONÓMICA propuesta línea a línea, aprendida
// de las ofertas que el cliente ya presentó. Sale para revisar y editar; la
// persona decide, el agente propone.
export const maxDuration = 300

export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json()) as Record<string, unknown>
    const pliego = typeof body.pliego === 'string' ? body.pliego.trim() : ''
    if (pliego.length < 200) return NextResponse.json({ error: 'Falta el pliego (pega PCAP + PPT con las tablas de precios)' }, { status: 400 })
    const access = await requireTool('tenders', typeof body.clientId === 'string' ? body.clientId : null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/oferta', access)

    const tenderId = isUuid(body.tenderId) ? body.tenderId : null
    // Las instrucciones del expediente y las lecciones de la marca también
    // entran en la oferta (Usoa: «cada licitación tiene su peculiaridad»). La
    // guía de REDACCIÓN no: es de prosa, no de precios. La base (baseTenderId)
    // se resuelve igual pero aquí no se usa: la oferta aprende de todas las presentadas.
    const [{ instructions }, teaching] = await Promise.all([
      resolveTenderTeaching(access.clientId, body, tenderId),
      loadTeaching(access.clientId),
    ])
    const oferta = await generateTenderOferta({ clientId: access.clientId, pliegoText: pliego, tenderId, instructions, lessons: teaching.lessons })

    // Persistencia inmediata: una oferta generada nunca se pierde al recargar.
    if (tenderId) {
      await adminClient().from('tenders')
        .update({ oferta: toJson(oferta), updated_at: new Date().toISOString() })
        .eq('id', tenderId).eq('client_id', access.clientId)
    }
    done({ pliegoChars: pliego.length, instruccionesChars: instructions?.length || 0, conBase: false, lecciones: teaching.lessons.length })
    return NextResponse.json(oferta)
  } catch (error) {
    done?.error(500, error instanceof Error ? error.message : 'Generation failed')
    console.error('tender/oferta error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 500 })
  }
}
