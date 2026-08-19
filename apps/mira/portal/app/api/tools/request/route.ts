import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { checkRateLimit } from '@/lib/rate-limit'
import { toolById, CUSTOM_TOOL_ID } from '@/lib/tools/catalog'
import { errorMessage } from '@/lib/email-ops/auth'

// Petición de un módulo del marketplace. No cobra ni habilita nada: registra el
// interés para que la agencia lo vea en /admin/tools y ponga precio caso a caso,
// que es como se venden los módulos de operativa.
//
// Sin correo a propósito: en producción no hay clave de Resend, así que un aviso
// por email se perdería en silencio. La bandeja de /admin es el canal.

const MAX_MESSAGE = 1000

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    // 5 peticiones/hora por persona: es un formulario de contacto, no una API.
    if (!checkRateLimit(`tool-request:${access.userId}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many requests, try again later' }, { status: 429 })
    }

    const toolId = typeof body.toolId === 'string' ? body.toolId : ''
    if (toolId !== CUSTOM_TOOL_ID && !toolById(toolId)) {
      return NextResponse.json({ error: 'Unknown tool' }, { status: 400 })
    }

    const message = typeof body.message === 'string' ? body.message.trim().slice(0, MAX_MESSAGE) : null
    const db = adminClient()
    const { data, error } = await db
      .from('tool_requests')
      .insert({
        client_id: access.clientId,
        tool_id: toolId,
        requested_by: access.userId,
        message: message || null,
      })
      .select('id,tool_id,status,created_at')
      .single()

    if (error) {
      // El índice único parcial idx_tool_requests_one_open impide dos peticiones
      // abiertas de lo mismo. No es un fallo: ya está pedido.
      if (error.code === '23505') {
        return NextResponse.json({ alreadyRequested: true }, { status: 200 })
      }
      throw error
    }

    return NextResponse.json({ request: data })
  } catch (error) {
    console.error('tools/request POST error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
