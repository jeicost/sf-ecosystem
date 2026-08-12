import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { adminClient } from '@/lib/supabase'
import { getSeatUsage, canAddSeat } from '@/lib/seats'

// Equipo de una marca: ver quién tiene acceso, invitar y quitar.
//
// Hasta ahora los accesos SOLO se concedían por script desde la agencia, así
// que un departamento de diez personas compartía un login. Esto crea el flujo
// que faltaba y, de paso, el punto donde el límite de asientos significa algo.

/** Quién tiene acceso a esta marca y cuántos asientos quedan. */
export async function GET(req: NextRequest) {
  try {
    const access = await resolveRequestClient(req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const usage = await getSeatUsage(access.clientId)
    if (!usage) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    const db = adminClient()
    const { data: grants } = await db
      .from('mira_project_access')
      .select('user_id, role, created_at')
      .in('project_id', usage.groupClientIds)

    // Un usuario puede tener acceso a varias marcas del grupo: se muestra una
    // vez, que es como cuenta para los asientos.
    const byUser = new Map<string, { role: string; created_at: string }>()
    for (const g of grants || []) if (!byUser.has(g.user_id)) byUser.set(g.user_id, { role: g.role, created_at: g.created_at })

    const { data: authList } = await db.auth.admin.listUsers()
    const members = [...byUser.entries()].map(([userId, g]) => {
      const u = authList?.users.find((x) => x.id === userId)
      return {
        userId,
        email: u?.email ?? null,
        role: g.role,
        joinedAt: g.created_at,
        lastSignInAt: u?.last_sign_in_at ?? null,
        isYou: userId === access.userId,
      }
    })

    return NextResponse.json({ members, seats: { used: usage.used, max: usage.max, available: usage.available }, plan: usage.plan })
  } catch (error) {
    console.error('team GET error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

/** Invita a alguien por email. Consume un asiento salvo que ya tuviera acceso. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
    }
    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const db = adminClient()

    // ¿Existe ya esa persona en el sistema? Si no, se crea sin contraseña y se
    // le manda un enlace para ponerla — mismo patrón que el reset del portal.
    const { data: authList } = await db.auth.admin.listUsers()
    let user = authList?.users.find((u) => u.email?.toLowerCase() === email)

    // El asiento se comprueba ANTES de crear nada: si no cabe, no dejamos un
    // usuario huérfano por el camino.
    const check = await canAddSeat(access.clientId, user?.id ?? '00000000-0000-0000-0000-000000000000')
    if (!check.ok) {
      return NextResponse.json({ error: check.message, seats: check.usage ? { used: check.usage.used, max: check.usage.max } : undefined }, { status: 409 })
    }

    let invited = false
    if (!user) {
      const { data: created, error: createErr } = await db.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: { plan: 'growth', client_id: access.clientId },
      })
      if (createErr || !created?.user) {
        return NextResponse.json({ error: createErr?.message || 'Could not create the user' }, { status: 500 })
      }
      user = created.user
      invited = true
    }

    const { data: existing } = await db
      .from('mira_project_access')
      .select('id')
      .eq('project_id', access.clientId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      const { error: grantErr } = await db
        .from('mira_project_access')
        .insert({ user_id: user.id, project_id: access.clientId, role: body.role === 'admin' ? 'admin' : 'member' })
      if (grantErr) return NextResponse.json({ error: grantErr.message }, { status: 500 })
    }

    // Enlace para que entre. Si el correo no está configurado en Supabase, al
    // menos devolvemos el enlace para poder pasárselo a mano.
    let actionLink: string | null = null
    try {
      const { data: link } = await db.auth.admin.generateLink({
        type: invited ? 'invite' : 'magiclink',
        email,
        options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://mira-portal-nu.vercel.app'}/login` },
      })
      actionLink = link?.properties?.action_link ?? null
    } catch {
      /* el acceso ya está concedido aunque el enlace falle */
    }

    const usage = await getSeatUsage(access.clientId)
    return NextResponse.json({
      ok: true,
      userId: user.id,
      email,
      invited,
      actionLink,
      seats: usage ? { used: usage.used, max: usage.max, available: usage.available } : null,
    })
  } catch (error) {
    console.error('team POST error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}

/** Quita el acceso de alguien a esta marca (libera su asiento). */
export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    const access = await resolveRequestClient(req.nextUrl.searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    // Nadie se quita a sí mismo: dejaría la cuenta sin dueño por accidente.
    if (userId === access.userId) {
      return NextResponse.json({ error: 'You cannot remove your own access.' }, { status: 400 })
    }

    const { error } = await adminClient()
      .from('mira_project_access')
      .delete()
      .eq('project_id', access.clientId)
      .eq('user_id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const usage = await getSeatUsage(access.clientId)
    return NextResponse.json({ ok: true, seats: usage ? { used: usage.used, max: usage.max, available: usage.available } : null })
  } catch (error) {
    console.error('team DELETE error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 })
  }
}
