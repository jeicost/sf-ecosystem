import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'

/**
 * POST /api/me/ensure-mira-user — auto-provisiona la fila de mira_users del
 * usuario autenticado y devuelve su id.
 *
 * Por qué existe: mira_projects.user_id tiene FK a mira_users, pero NINGÚN
 * flujo creaba filas en mira_users (tabla vacía en producción) — crear un
 * proyecto fallaba con "User not found" para TODOS los usuarios desde siempre.
 * El alta de clientes crea el usuario en auth.users y el grant en
 * mira_project_access, pero nunca tocó mira_users.
 */
export async function POST() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()

    const { data: existing } = await admin
      .from('mira_users')
      .select('id')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ id: existing.id })
    }

    const email = user.email ?? ''
    const { data: created, error } = await admin
      .from('mira_users')
      .insert({
        auth_id: user.id,
        email,
        // company_name es NOT NULL en el esquema real — mejor dato disponible
        company_name:
          (user.user_metadata?.company_name as string | undefined) ||
          email.split('@')[0] ||
          'Sin nombre',
      })
      .select('id')
      .single()

    if (error || !created) {
      // Carrera benigna: otro request pudo crearla entre el select y el insert
      const { data: retry } = await admin
        .from('mira_users')
        .select('id')
        .eq('auth_id', user.id)
        .maybeSingle()
      if (retry) return NextResponse.json({ id: retry.id })
      return NextResponse.json({ error: error?.message || 'Insert failed' }, { status: 500 })
    }

    return NextResponse.json({ id: created.id })
  } catch (error) {
    console.error('ensure-mira-user error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
