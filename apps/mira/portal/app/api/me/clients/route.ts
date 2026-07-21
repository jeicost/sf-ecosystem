import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'

/**
 * GET /api/me/clients — los clientes a los que el usuario tiene acceso.
 *
 * Modelo de 3 niveles sobre mira_project_access (N:M, project_id = clients.id):
 *  - usuario normal: 1 grant → 1 cliente
 *  - tipo admin: varios grants → varios clientes (elige en el switcher)
 *  - super_admin (user_metadata.plan): todos los clientes
 *
 * El ClientSwitcher consume esto; nunca listar `clients` desde el navegador.
 */
export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()
    const isSuperAdmin = user.user_metadata?.plan === 'super_admin'

    if (isSuperAdmin) {
      const { data, error } = await admin
        .from('clients')
        .select('id, name, slug, logo_url, primary_color')
        .order('name')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ clients: data ?? [], super_admin: true })
    }

    const { data: grants, error: grantsError } = await admin
      .from('mira_project_access')
      .select('project_id')
      .eq('user_id', user.id)
    if (grantsError) return NextResponse.json({ error: grantsError.message }, { status: 500 })

    const ids = (grants ?? []).map((g) => g.project_id)
    if (ids.length === 0) return NextResponse.json({ clients: [], super_admin: false })

    const { data, error } = await admin
      .from('clients')
      .select('id, name, slug, logo_url, primary_color')
      .in('id', ids)
      .order('name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ clients: data ?? [], super_admin: false })
  } catch (error) {
    console.error('me/clients error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed' },
      { status: 500 }
    )
  }
}
