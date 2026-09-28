import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireTool } from '@/lib/tools/access'
import { errorMessage } from '@/lib/email-ops/auth'

// Con qué va a escribir la memoria.
//
// El generador se apoya en dos cosas: el corpus indexado de la empresa
// (knowledge_items, que es una vista sobre los tres silos de documentos) y las
// memorias que ya se presentaron, de las que hereda esqueleto y criterio.
//
// Sin esto, la pantalla no decía nada: se pulsaba "generar memoria" sin saber
// si detrás había 73 documentos o ninguno, y una memoria pobre parecía culpa
// del modelo cuando era falta de material. Enseñar la cifra convierte "esto
// escribe regular" en "esto necesita que le subamos las memorias".

export async function GET(req: NextRequest) {
  try {
    const access = await requireTool('tenders', req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const db = adminClient()
    const [docsRes, tendersRes] = await Promise.all([
      db.from('knowledge_items').select('source').eq('client_id', access.clientId).limit(500),
      db.from('tenders').select('id,status,memoria').eq('client_id', access.clientId),
    ])
    if (docsRes.error) throw docsRes.error
    if (tendersRes.error) throw tendersRes.error

    const bySource: Record<string, number> = {}
    for (const row of docsRes.data || []) {
      const k = (row as { source?: string }).source || 'otros'
      bySource[k] = (bySource[k] || 0) + 1
    }
    const tenders = (tendersRes.data || []) as { status: string; memoria: unknown }[]
    // Solo las PRESENTADAS con memoria alimentan el few-shot: un borrador a
    // medias no es un ejemplo de cómo se escribe aquí.
    const ejemplos = tenders.filter((t) => t.memoria && ['presentada', 'ganada', 'perdida'].includes(t.status)).length

    return NextResponse.json({
      documentos: (docsRes.data || []).length,
      porOrigen: bySource,
      expedientes: tenders.length,
      memoriasPresentadas: ejemplos,
    })
  } catch (error) {
    console.error('tender/corpus error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
