import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { checkRateLimit } from '@/lib/rate-limit'
import { BILLING_PLANS } from '@/lib/billing/plans'

// POST /api/signup — la puerta de entrada del cliente final.
//
// Hasta ahora una cuenta SOLO se creaba por script o desde el alta de agencia,
// las dos cosas con las manos de alguien de Startup Factory dentro. La landing
// lleva meses diciendo "Empezar por 99 €/mes" y el botón llevaba a un login
// donde no se puede empezar nada: el embudo terminaba en una pantalla cerrada.
//
// Esta ruta es pública (ver la lista de proxy.ts) y crea las tres cosas que
// hacen falta para que alguien entre y trabaje: la persona, la marca y el
// permiso que las une. Después, /onboarding se encarga del Cerebro.
//
// PERIODO DE PRUEBA: la cuenta nace en 'trialing' con TRIAL_DAYS por delante.
// Es el único valor comercial que no venía dado por el modelo del 12-ago, y
// existe por una razón concreta: sin claves de Stripe todavía, exigir tarjeta
// aquí dejaría la puerta igual de cerrada que antes. Cuando Stripe esté vivo,
// /api/billing/checkout convierte la prueba en suscripción sin tocar esto.
const TRIAL_DAYS = 14

/** Contraseña mínima. Supabase acepta 6; 8 es el mínimo que no da vergüenza. */
const MIN_PASSWORD = 8

/** Altas por IP y hora. Cinco es holgado para una persona y ruinoso para un bot. */
const SIGNUPS_PER_HOUR = 5

function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/** Un slug libre. Si 'salsa' está cogido prueba 'salsa-2', 'salsa-3'… */
async function freeSlug(db: ReturnType<typeof adminClient>, base: string): Promise<string> {
  const root = base || 'marca'
  for (let i = 0; i < 25; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`
    const { data } = await db.from('clients').select('id').eq('slug', candidate).maybeSingle()
    if (!data) return candidate
  }
  // 25 colisiones con el mismo nombre: sufijo aleatorio antes que fallar el alta.
  return `${root}-${Math.random().toString(36).slice(2, 7)}`
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    if (!checkRateLimit(`signup:${ip}`, SIGNUPS_PER_HOUR, 3_600_000)) {
      return NextResponse.json(
        { error: 'Too many sign-ups from this connection. Try again in an hour.' },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const brandName = typeof body.brandName === 'string' ? body.brandName.trim().slice(0, 60) : ''
    const website = typeof body.website === 'string' ? body.website.trim().slice(0, 200) : ''
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim().slice(0, 80) : ''

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (password.length < MIN_PASSWORD) {
      return NextResponse.json(
        { error: `Your password needs at least ${MIN_PASSWORD} characters.` },
        { status: 400 }
      )
    }
    if (brandName.length < 2) {
      return NextResponse.json({ error: 'Tell us the name of your brand.' }, { status: 400 })
    }

    const db = adminClient()

    // ¿Ya existe esa persona? Aquí sí se revela: en un registro, "ese correo ya
    // está" es la única respuesta útil, y el atacante lo averigua igual
    // intentando registrarse. En el LOGIN es donde no se revela nunca.
    //
    // Paginado: el listUsers({perPage:1000}) de antes dejaba de detectar
    // duplicados EN SILENCIO a partir del usuario 1001 (el Admin API no filtra
    // por email). Se recorre hasta agotar; con <1000 usuarios sigue siendo una
    // sola llamada.
    let emailExists = false
    for (let page = 1; page <= 50 && !emailExists; page++) {
      const { data: authList } = await db.auth.admin.listUsers({ page, perPage: 1000 })
      const users = authList?.users ?? []
      if (users.some((u) => u.email?.toLowerCase() === email)) emailExists = true
      if (users.length < 1000) break
    }
    if (emailExists) {
      return NextResponse.json(
        { error: 'There is already an account with that email. Sign in instead.', existing: true },
        { status: 409 }
      )
    }

    const plan = BILLING_PLANS.starter
    const slug = await freeSlug(db, slugify(brandName))

    const trialEnds = new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString()

    // 1) La marca primero. Si esto falla no hemos creado ninguna cuenta que
    //    limpiar; al revés sí habría que deshacer, y deshacer siempre falla
    //    justo el día que hace falta.
    const { data: client, error: clientErr } = await db
      .from('clients')
      .insert({
        name: brandName,
        slug,
        owner_email: email,
        status: 'active',
        description: website ? `Alta autoservicio · ${website}` : 'Alta autoservicio',
        plan: plan.id,
        max_seats: plan.seats,
        onboarding_mode: 'self_serve',
        subscription_status: 'trialing',
        trial_ends_at: trialEnds,
      })
      .select('id, slug, name')
      .single()

    if (clientErr || !client) {
      console.error('signup: client insert failed:', clientErr?.message)
      return NextResponse.json({ error: 'Could not create your brand. Try again.' }, { status: 500 })
    }

    // 2) La persona.
    const { data: created, error: userErr } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // sin confirmación por correo no se puede entrar, y hoy no hay envío garantizado
      user_metadata: {
        name: fullName || email.split('@')[0],
        plan: 'starter', // taxonomía de SECCIONES (lib/plans.ts), no la de facturación
        client_id: client.id,
        signup_source: 'self_serve',
      },
    })

    if (userErr || !created?.user) {
      // La marca ya está creada: se borra para no dejar basura que luego
      // aparece en el selector de clientes de la agencia.
      await db.from('clients').delete().eq('id', client.id)
      console.error('signup: user creation failed:', userErr?.message)
      return NextResponse.json(
        { error: userErr?.message || 'Could not create your account. Try again.' },
        { status: 500 }
      )
    }

    // 3) El permiso que las une. Sin esto la cuenta existe y no ve nada.
    const { error: grantErr } = await db
      .from('mira_project_access')
      .insert({ user_id: created.user.id, project_id: client.id, role: 'owner' })

    if (grantErr) {
      await db.auth.admin.deleteUser(created.user.id)
      await db.from('clients').delete().eq('id', client.id)
      console.error('signup: grant failed:', grantErr.message)
      return NextResponse.json({ error: 'Could not finish setting up your account.' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      clientId: client.id,
      clientName: client.name,
      email,
      plan: plan.id,
      trialEndsAt: trialEnds,
    })
  } catch (error) {
    console.error('signup error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sign-up failed' },
      { status: 500 }
    )
  }
}
