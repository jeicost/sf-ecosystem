import { NextRequest, NextResponse } from 'next/server'
import { trackRoute } from '@/lib/activity'
import { requireTool } from '@/lib/tools/access'
import { generateTenderMemoria, type TenderCriteria } from '@/lib/generation/tender-memoria'
import { isUuid, loadTeaching, resolveTenderTeaching } from '@/lib/tenders/teaching'

// Guarda de entitlement: hasta ahora estas rutas solo comprobaban que la persona
// tuviera acceso al CLIENTE, no que el cliente tuviera contratada Licitaciones —
// una asimetría ya documentada en lib/email-ops/auth.ts. Con el catálogo en BD
// (client_tools, 0073) se cierra: requireTool hace las dos comprobaciones.
export const maxDuration = 300

// Paso 2: con el pliego + los criterios, genera la memoria criterio a criterio.
export async function POST(req: NextRequest) {
  let done: ReturnType<typeof trackRoute> | null = null
  try {
    const body = (await req.json()) as Record<string, unknown>
    const pliego = typeof body.pliego === 'string' ? body.pliego.trim() : ''
    const criteria = body.criteria as TenderCriteria | undefined
    const access = await requireTool('tenders', typeof body.clientId === 'string' ? body.clientId : null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    done = trackRoute('tender/generate', access)
    // Usoa subió su propio borrador de memoria como pliego: el extractor no
    // encontró criterios (no los hay) y esto devolvía «Faltan el pliego o los
    // criterios», que no dice qué hacer. Ahora se explica y queda registrado.
    if (!pliego) { done.error(400, 'sin pliego'); return NextResponse.json({ error: 'No hay texto del pliego: sube el PCAP y el PPT en el paso 1.' }, { status: 400 }) }
    if (!criteria?.criteria?.length) {
      done.error(400, 'sin criterios')
      return NextResponse.json({
        error: 'El texto subido no contiene criterios de adjudicación, así que no hay contra qué escribir la memoria. Si es una memoria o un borrador propio, súbelo en Documentos para mejorarlo; si es una licitación, añade el PCAP, que es donde están los criterios.',
      }, { status: 400 })
    }
    const tenderId = isUuid(body.tenderId) ? body.tenderId : null
    // Lo que la persona ha enseñado: instrucciones de ESTE expediente, memoria
    // de partida, guía de redacción y lecciones de la marca. Todo se resuelve
    // con access.clientId, nunca con el clientId del navegador.
    const [{ instructions, baseTenderId }, teaching] = await Promise.all([
      resolveTenderTeaching(access.clientId, body, tenderId),
      loadTeaching(access.clientId),
    ])
    const memoria = await generateTenderMemoria({ clientId: access.clientId, pliegoText: pliego, criteria, tenderId, instructions, baseTenderId, teaching })
    done({
      secciones: Array.isArray((memoria as { secciones?: unknown[] }).secciones) ? (memoria as { secciones?: unknown[] }).secciones!.length : 0,
      pliegoChars: pliego.length,
      instruccionesChars: instructions?.length || 0,
      conBase: typeof memoria.base_tender_id === 'string',
      lecciones: teaching.lessons.length,
    })
    return NextResponse.json(memoria)
  } catch (error) {
    done?.error(500, error instanceof Error ? error.message : 'Generation failed')
    console.error('tender/generate error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 500 })
  }
}
