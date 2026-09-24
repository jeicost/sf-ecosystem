import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireEmailOps, errorMessage } from '@/lib/email-ops/auth'
import { encryptSecret, isEncryptionConfigured } from '@/lib/crypto'
import { testImapConnection } from '@/lib/email-ops/imap'
import { pollImapInbox } from '@/lib/email-ops/imap-poll'
import type { ImapInboxRow } from '@/lib/email-ops/imap'
import { writable } from '@/lib/db-json'

// Alta y prueba de buzones leídos por IMAP.
//
// La contraseña llega UNA vez desde el formulario, se prueba contra el servidor
// y se guarda cifrada (misma clave que los tokens OAuth). No se devuelve nunca
// por la API ni se escribe en logs: los errores del servidor pasan antes por
// cleanImapError.

export const maxDuration = 120

interface Body {
  clientId?: string
  action?: 'test' | 'save'
  department?: string
  address?: string
  host?: string
  port?: number
  user?: string
  password?: string
  displayName?: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Body
    const access = await requireEmailOps(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
    // Alta de buzones = agencia, igual que en el alta por reenvío.
    if (!access.isAgency) return NextResponse.json({ error: 'Only the agency can connect mailboxes' }, { status: 403 })

    const host = String(body.host || '').trim().toLowerCase()
    const user = String(body.user || '').trim()
    const password = String(body.password || '')
    const port = Number(body.port) > 0 ? Number(body.port) : 993
    if (!host || !user || !password) {
      return NextResponse.json({ error: 'host, user and password are required' }, { status: 400 })
    }

    // Siempre se prueba antes: ni se guarda un buzón que no se puede leer, ni
    // se descubre el fallo tres horas después en el cron.
    const test = await testImapConnection({ host, port, user, password })
    if (!test.ok) return NextResponse.json({ ok: false, error: test.error }, { status: 200 })
    if (body.action === 'test') return NextResponse.json({ ok: true, messages: test.messages })

    if (!isEncryptionConfigured()) {
      return NextResponse.json({ error: 'MIRA_ENCRYPTION_KEY is not configured: cannot store credentials' }, { status: 500 })
    }
    const department = String(body.department || '').trim().slice(0, 60)
    if (!department) return NextResponse.json({ error: 'department required' }, { status: 400 })
    const address = String(body.address || user).trim().toLowerCase()

    const db = adminClient()
    const { data, error } = await db.from('email_inboxes').insert(writable({
      client_id: access.clientId,
      department,
      address,
      display_name: typeof body.displayName === 'string' ? body.displayName.slice(0, 80) : null,
      created_by: access.userId,
      source: 'imap',
      imap_host: host,
      imap_port: port,
      imap_user: user,
      imap_password: encryptSecret(password),
    })).select('id,client_id,department,address,display_name,active,source,imap_host,imap_port,imap_user,imap_last_checked_at,imap_last_error,created_at').single()

    if (error) {
      if ((error as { code?: string }).code === '23505') return NextResponse.json({ error: 'Address already connected' }, { status: 409 })
      throw error
    }

    // Primera lectura inmediata: el cliente ve tickets reales en el momento,
    // sin esperar al cron de 10 minutos.
    const poll = await pollImapInbox({ ...(data as unknown as ImapInboxRow), imap_password: encryptSecret(password), imap_last_uid: null })
    return NextResponse.json({ ok: true, inbox: data, firstPoll: { fetched: poll.fetched, processed: poll.processed, error: poll.error } })
  } catch (error) {
    console.error('email-ops/inboxes/imap error:', error)
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 })
  }
}
