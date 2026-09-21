import { NextRequest, NextResponse } from 'next/server'

/**
 * Captación de la lista. SOLO GUARDA: el aviso por correo no se hace aquí.
 *
 * Es el patrón de todo el ecosistema desde el 20-ago-2026: las webs escriben en
 * la tabla `leads` del Supabase de sf-cms y el cron de sf-cms
 * (`/api/cron/leads`, cada 10 min, `lib/leads-notify.ts`) manda el aviso por
 * Resend y marca la fila. La primera versión de esta ruta avisaba por su cuenta
 * con formsubmit, y eso no puede funcionar desde aquí: **formsubmit devuelve
 * 403 a las IP de Vercel** (lo documenta leads-notify.ts, con dos leads reales
 * perdidos en discoolver por eso). Además, como `anon` no puede hacer UPDATE,
 * la ruta tenía que avisar ANTES de guardar para poder escribir `notified` en
 * el INSERT — lo contrario de lo que decía su propio comentario.
 *
 * Ahora: se guarda con `notified: false` y el cron hace el resto. Un lead de
 * `adrian-grooves` va al buzón de respaldo del cron (`LEADS_FALLBACK_EMAIL` o
 * info@startupsfactory.es) mientras no tenga entrada propia en DESTINOS.
 *
 * ANON Y NO SERVICE ROLE: la política de RLS de `leads` deja a `anon`
 * únicamente INSERTAR (migración 017 de sf-cms). `Prefer: return=minimal` es
 * obligatorio: sin política de SELECT, pedir la fila de vuelta hace fallar el
 * INSERT entero.
 */

export const maxDuration = 15

const LEADS_URL = process.env.LEADS_SUPABASE_URL?.replace(/\/$/, '')
const LEADS_KEY = process.env.LEADS_SUPABASE_ANON_KEY

/**
 * Campos que se guardan además del correo. Los `utm_*` y el `referrer` son los
 * que permiten saber qué anuncio trae cada registro — sin ellos el CAC por
 * creatividad, que es lo que el trimestre existe para medir, no se puede
 * calcular. Lo que no esté en esta lista se descarta.
 */
const EXTRA_FIELDS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'referrer'] as const

function clean(value: unknown, max = 300): string | undefined {
  if (typeof value !== 'string') return undefined
  const s = value.trim().slice(0, max)
  return s || undefined
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }

  const email = clean(body?.email, 320) ?? ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
  }

  if (!LEADS_URL || !LEADS_KEY) {
    // Sin estas dos variables el lead NO se puede guardar. Se responde 503 para
    // que el formulario diga que ha fallado en vez de dar las gracias: un
    // «apuntado» que no se guardó es el peor fallo posible aquí.
    console.error('[lista] sin LEADS_SUPABASE_URL/KEY — el lead NO se persiste', { email })
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 503 })
  }

  const source = clean(body?.source, 64) ?? 'lista'
  const payload: Record<string, string> = {}
  for (const key of EXTRA_FIELDS) {
    const value = clean(body?.[key])
    if (value) payload[key] = value
  }

  try {
    const res = await fetch(`${LEADS_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        apikey: LEADS_KEY,
        Authorization: `Bearer ${LEADS_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ site: 'adrian-grooves', source, email, locale: 'es', payload, notified: false }),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) {
      console.error('[lista] insert falló', { status: res.status, body: await res.text().catch(() => '') })
      return NextResponse.json({ ok: false, error: 'store_failed' }, { status: 502 })
    }
  } catch (err) {
    console.error('[lista] supabase inalcanzable', err)
    return NextResponse.json({ ok: false, error: 'store_failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
