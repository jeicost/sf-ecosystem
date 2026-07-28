import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'

/**
 * POST /api/projects — creación de proyectos server-side.
 *
 * Por qué: el insert client-side de useProjectManagement fallaba para TODOS
 * los usuarios (mira_users vacía rompía el FK de user_id, y aun provisionada,
 * la RLS de mira_projects bloquea el insert con anon key). Crear proyectos
 * nunca funcionó en producción hasta esta ruta.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, slug: rawSlug } = body
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 })
    }

    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const admin = adminClient()

    // mira_projects.user_id → mira_users.id: auto-provisionar si falta
    let { data: miraUser } = await admin
      .from('mira_users')
      .select('id')
      .eq('auth_id', access.userId)
      .maybeSingle()
    if (!miraUser) {
      const { data: authUser } = await admin.auth.admin.getUserById(access.userId)
      const email = authUser?.user?.email ?? ''
      const { data: created, error: muError } = await admin
        .from('mira_users')
        .insert({
          auth_id: access.userId,
          email,
          company_name:
            (authUser?.user?.user_metadata?.company_name as string | undefined) ||
            email.split('@')[0] ||
            'Sin nombre',
        })
        .select('id')
        .single()
      if (muError || !created) {
        return NextResponse.json({ error: muError?.message || 'User provisioning failed' }, { status: 500 })
      }
      miraUser = created
    }

    const slug = (typeof rawSlug === 'string' && rawSlug.trim() ? rawSlug : name)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)

    let finalSlug = slug
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = attempt === 0 ? slug : `${slug}-${attempt + 1}`
      const { data: project, error } = await admin
        .from('mira_projects')
        .insert({
          user_id: miraUser.id,
          client_id: access.clientId,
          name,
          slug: candidate,
          description: description || null,
          status: 'active',
          agents_count: 0,
        })
        .select('*')
        .single()
      if (!error && project) {
        return NextResponse.json({ project, success: true })
      }
      if (!error?.message.includes('duplicate') && !error?.message.includes('unique')) {
        return NextResponse.json({ error: error?.message || 'Insert failed' }, { status: 500 })
      }
      finalSlug = candidate
    }

    return NextResponse.json({ error: `Slug collision for '${finalSlug}'` }, { status: 409 })
  } catch (error) {
    console.error('projects POST error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
