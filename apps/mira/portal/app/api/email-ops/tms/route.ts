import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { encryptSecret, decryptSecret, isEncryptionConfigured } from '@/lib/crypto'
import { toJson, writable } from '@/lib/db-json'
import { normalizarConfig, leerWsdl, namespaceDeWsdl, validarUsuario, desconectarUsuario, obtenerEstructuraXml, DireclineError, type ConexionDirecline } from '@/lib/tms/direcline'

// Conexión de la marca con su programa operativo (Direcline). La contraseña se
// escribe una vez, se prueba contra el servicio (ValidarUsuario) y se guarda
// cifrada; nunca se devuelve. La configuración (códigos del programa) la
// rellena la persona: MIRA no se inventa códigos.

export const maxDuration = 60
const PUBLIC = 'id,provider,base_url,username,culture,namespace,config,active,last_test_at,last_test_ok,last_error,updated_at'

export async function GET(req: NextRequest) {
  try {
    const access = await requireEmailOps(new URL(req.url).searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    const { data, error } = await adminClient().from('tms_connections').select(PUBLIC).eq('client_id', access.clientId).eq('provider', 'direcline').maybeSingle()
    if (error) throw error
    return NextResponse.json({ connection: data ? { ...data, config: normalizarConfig(data.config) } : null, canManage: access.isAgency })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}

interface Body { clientId?: string; action?: 'test' | 'save' | 'structure'; base_url?: string; username?: string; password?: string; culture?: string; config?: unknown; active?: boolean; metodo?: string }

/**
 * PUT: { action: 'test' } prueba URL+usuario+contraseña (WSDL + ValidarUsuario) sin guardar;
 *      { action: 'save' } prueba y guarda (la contraseña solo si viene; si no, se conserva);
 *      { action: 'structure', metodo } pide al programa la estructura XML de ese método (diagnóstico).
 */
export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body
    const access = await requireEmailOps(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    if (!access.isAgency) return NextResponse.json({ error: 'Only the agency can configure the operations program' }, { status: 403 })
    const db = adminClient()
    const { data: existing } = await db.from('tms_connections').select('*').eq('client_id', access.clientId).eq('provider', 'direcline').maybeSingle()

    const baseUrl = String(body.base_url || existing?.base_url || '').trim()
    const username = String(body.username || existing?.username || '').trim()
    const password = typeof body.password === 'string' && body.password ? body.password : decryptSecret(existing?.password) || ''
    const culture = String(body.culture ?? existing?.culture ?? 'es-ES').trim()
    if (!/^https?:\/\/.+\.asmx$/i.test(baseUrl)) return NextResponse.json({ error: 'La URL debe ser la del servicio .asmx (…/WsUtilidades/ControladorUtilidades.asmx)' }, { status: 400 })
    if (!username || !password) return NextResponse.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 })

    // Prueba real: WSDL (namespace) + inicio y cierre de sesión. Nada se graba en el programa.
    let namespace = existing?.namespace || null
    let testError: string | null = null
    let estructura: string | null = null
    try {
      namespace = namespaceDeWsdl(await leerWsdl(baseUrl))
      const conn: ConexionDirecline = { baseUrl, username, password, culture, namespace }
      const guid = await validarUsuario(conn)
      if (body.action === 'structure') {
        const metodo = body.metodo === 'GuardarExpedicion' ? 'GuardarExpedicion' : 'GrabarExpedicionSolicitud'
        estructura = await obtenerEstructuraXml(conn, guid, metodo)
      }
      await desconectarUsuario(conn)
    } catch (e) {
      testError = e instanceof DireclineError ? e.message : errorMessage(e)
    }
    if (body.action === 'test') return NextResponse.json({ ok: !testError, error: testError, namespace })
    if (body.action === 'structure') return NextResponse.json({ ok: !testError, error: testError, estructura })

    if (!isEncryptionConfigured()) return NextResponse.json({ error: 'MIRA_ENCRYPTION_KEY is not configured: cannot store credentials' }, { status: 500 })
    const row = {
      client_id: access.clientId, provider: 'direcline', base_url: baseUrl, username,
      password: encryptSecret(password), culture, namespace,
      config: toJson(normalizarConfig(body.config ?? existing?.config ?? {})),
      active: typeof body.active === 'boolean' ? body.active : (existing?.active ?? true),
      last_test_at: new Date().toISOString(), last_test_ok: !testError, last_error: testError,
      created_by: existing?.created_by ?? access.userId, updated_at: new Date().toISOString(),
    }
    const { data, error } = await db.from('tms_connections').upsert(writable(row), { onConflict: 'client_id,provider' }).select(PUBLIC).single()
    if (error) throw error
    return NextResponse.json({ ok: !testError, error: testError, connection: { ...data, config: normalizarConfig(data.config) } })
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
