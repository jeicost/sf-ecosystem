import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { getSchema, DEFAULT_SCHEMA_KEY, SCHEMAS } from '@/lib/email-ops/schema'
import { MAX_RULES_CHARS } from '@/lib/email-ops/learning'

// Ajustes de Email Ops del cliente: reglas para la IA y campos requeridos.
// También devuelve el esquema de campos, que la UI usa para pintar la tabla.

export async function GET(req: NextRequest) {
  try {
    const access = await requireEmailOps(req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const db = adminClient()
    const { data, error } = await db.from('email_ops_settings').select('client_id,schema_key,rules,required_fields,updated_at').eq('client_id', access.clientId).maybeSingle()
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
    const { data, error } = await db.from('email_ops_settings').upsert(patch, { onConflict: 'client_id' }).select('client_id,schema_key,rules,required_fields,updated_at').single()
    if (error) throw error
    return NextResponse.json({ settings: data, schema: getSchema(data.schema_key as string) })
  } catch (error) {
    console.error('email-ops/settings PUT error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
