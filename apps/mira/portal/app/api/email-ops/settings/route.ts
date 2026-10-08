import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { getSchema, DEFAULT_SCHEMA_KEY, SCHEMAS } from '@/lib/email-ops/schema'
import { MAX_RULES_CHARS } from '@/lib/email-ops/learning'
import { writable } from '@/lib/db-json'
import { EMAIL_RE } from '@/lib/email-ops/send'

// Ajustes de Email Ops del cliente: reglas para la IA y campos requeridos.
// También devuelve el esquema de campos, que la UI usa para pintar la tabla.

export async function GET(req: NextRequest) {
  try {
    const access = await requireEmailOps(req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const { data, error } = await db.from('email_ops_settings').select('client_id,schema_key,rules,required_fields,reply_test_to,reply_signature,updated_at').eq('client_id', access.clientId).maybeSingle()
    if (error) throw error
    const schemaKey = (data?.schema_key as string) || DEFAULT_SCHEMA_KEY
    return NextResponse.json({
      settings: data || { client_id: access.clientId, schema_key: schemaKey, rules: null, required_fields: null },
      schema: getSchema(schemaKey),
    })
  } catch (error) {
    console.error('email-ops/settings GET error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const access = await requireEmailOps(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const patch: Record<string, unknown> = { client_id: access.clientId, updated_at: new Date().toISOString() }
    if (typeof body.rules === 'string') patch.rules = body.rules.trim().slice(0, MAX_RULES_CHARS) || null
    if (Array.isArray(body.required_fields)) {
      const keys = new Set(getSchema(body.schema_key).map((f) => f.key))
      patch.required_fields = body.required_fields.filter((k: unknown): k is string => typeof k === 'string' && keys.has(k))
    } else if (body.required_fields === null) patch.required_fields = null
    if (typeof body.schema_key === 'string' && SCHEMAS[body.schema_key]) patch.schema_key = body.schema_key
    // Modo prueba de respuestas: una dirección válida o vacío (= envíos reales).
    if (typeof body.reply_test_to === 'string') {
      const v = body.reply_test_to.trim().toLowerCase()
      if (v && !EMAIL_RE.test(v)) return NextResponse.json({ error: 'reply_test_to must be an email address' }, { status: 400 })
      patch.reply_test_to = v || null
    } else if (body.reply_test_to === null) patch.reply_test_to = null
    if (typeof body.reply_signature === 'string') patch.reply_signature = body.reply_signature.trim().slice(0, 600) || null
    const { data, error } = await db.from('email_ops_settings').upsert(writable(patch), { onConflict: 'client_id' }).select('client_id,schema_key,rules,required_fields,reply_test_to,reply_signature,updated_at').single()
    if (error) throw error
    return NextResponse.json({ settings: data, schema: getSchema(data.schema_key as string) })
  } catch (error) {
    console.error('email-ops/settings PUT error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
