import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireSuperAdmin } from '@/lib/require-super-admin'
import { createClientLoginAccess } from '@/lib/onboarding/account'
import { applyBrainChange } from '@/lib/brain-tools'

export const maxDuration = 120

// P7 — creación FINAL del wizard de alta: nada existe en BD hasta este POST.
// Orden: cliente → brand profile (executors compartidos) → proyecto opcional →
// acceso (recovery link). Fallos parciales devuelven qué quedó hecho y qué
// reintentar. GET ?list=orphans lista los borradores huérfanos del chat viejo;
// el borrado exige slug draft-* + nombre placeholder + cero grants (por id).

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

export async function GET(req: NextRequest) {
  const user = await requireSuperAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  if (searchParams.get('list') !== 'orphans') {
    return NextResponse.json({ error: 'Unsupported' }, { status: 400 })
  }
  const admin = adminClient()
  const { data } = await admin
    .from('clients')
    .select('id, name, slug, created_at')
    .like('slug', 'draft-%')
    .order('created_at', { ascending: false })
    .limit(50)
  return NextResponse.json({ orphans: data ?? [] })
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireSuperAdmin()
    if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const admin = adminClient()

    // ── Borrado seguro de un huérfano concreto ──
    if (typeof body.delete_orphan_id === 'string' && body.delete_orphan_id) {
      const { data: orphan } = await admin
        .from('clients')
        .select('id, name, slug')
        .eq('id', body.delete_orphan_id)
        .maybeSingle()
      if (!orphan) return NextResponse.json({ error: 'No existe' }, { status: 404 })
      if (!orphan.slug?.startsWith('draft-') || orphan.name !== 'Nuevo cliente sin nombre') {
        return NextResponse.json({ error: 'Solo se borran borradores draft-* sin nombre' }, { status: 400 })
      }
      const { data: grants } = await admin
        .from('mira_project_access')
        .select('id')
        .eq('project_id', orphan.id)
        .limit(1)
      if (grants?.length) {
        return NextResponse.json({ error: 'Tiene usuarios con acceso — no es un huérfano' }, { status: 400 })
      }
      await admin.from('brand_profiles').delete().eq('client_id', orphan.id)
      await admin.from('onboarding_sessions').delete().eq('client_id', orphan.id)
      const { error } = await admin.from('clients').delete().eq('id', orphan.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, deleted: orphan.id })
    }

    // ── Reintento de solo-login para un cliente ya creado ──
    if (body.mode === 'login_only') {
      const { clientId, email, plan } = body
      if (!clientId || !email) return NextResponse.json({ error: 'Faltan clientId/email' }, { status: 400 })
      const login = await createClientLoginAccess(clientId, email, typeof plan === 'string' ? plan : 'starter')
      return 'error' in login
        ? NextResponse.json({ error: login.error }, { status: 500 })
        : NextResponse.json({ success: true, login })
    }

    // ── Creación completa ──
    const { basics, brand, project, login } = body ?? {}
    const companyName = typeof basics?.company_name === 'string' ? basics.company_name.trim() : ''
    if (!companyName) return NextResponse.json({ error: 'Falta el nombre de la empresa' }, { status: 400 })

    const errors: Record<string, string> = {}
    const result: Record<string, unknown> = {}

    // 1. Cliente con slug único
    const baseSlug = slugify(typeof basics?.slug === 'string' && basics.slug.trim() ? basics.slug : companyName) || 'cliente'
    let clientId: string | null = null
    for (let attempt = 0; attempt < 5 && !clientId; attempt++) {
      const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`
      const { data, error } = await admin
        .from('clients')
        .insert({
          name: companyName,
          slug: candidate,
          ...(typeof brand?.primary_color === 'string' && brand.primary_color ? { primary_color: brand.primary_color } : {}),
          ...(typeof brand?.logo_url === 'string' && brand.logo_url ? { logo_url: brand.logo_url } : {}),
        })
        .select('id, slug')
        .single()
      if (!error && data) {
        clientId = data.id
        result.client = data
      } else if (!String(error?.message || '').includes('duplicate')) {
        return NextResponse.json({ error: `No se pudo crear el cliente: ${error?.message}` }, { status: 500 })
      }
    }
    if (!clientId) return NextResponse.json({ error: 'No se encontró slug libre' }, { status: 500 })

    // 2. Brand profile base + merge vía executor compartido
    const { error: bpError } = await admin
      .from('brand_profiles')
      .insert({ client_id: clientId, name: companyName })
    if (bpError) {
      errors.brand = bpError.message
    } else {
      try {
        await applyBrainChange(clientId, {
          target: 'brand_profile',
          op: 'merge',
          payload: {
            name: companyName,
            ...(brand?.mission ? { mission: brand.mission } : {}),
            ...(brand?.proposition ? { proposition: brand.proposition } : {}),
            ...(brand?.tone_of_voice ? { tone_of_voice: brand.tone_of_voice } : {}),
            ...(Array.isArray(brand?.values) && brand.values.length ? { values: brand.values } : {}),
            brand_data: {
              identity: {
                name: companyName,
                ...(basics?.website_url ? { website_url: basics.website_url } : {}),
                ...(basics?.sector ? { sector: basics.sector } : {}),
                ...(brand?.tagline ? { tagline: brand.tagline } : {}),
                ...(brand?.one_liner ? { one_liner: brand.one_liner } : {}),
                ...(brand?.mission ? { mission: brand.mission } : {}),
                ...(brand?.vision ? { vision: brand.vision } : {}),
              },
              ...(brand?.primary_color || brand?.secondary_color || brand?.logo_url
                ? {
                    visual_identity: {
                      colors: {
                        ...(brand?.primary_color ? { primary: brand.primary_color } : {}),
                        ...(brand?.secondary_color ? { secondary: brand.secondary_color } : {}),
                      },
                      ...(brand?.logo_url ? { logo: { primary_url: brand.logo_url } } : {}),
                    },
                  }
                : {}),
            },
          },
        })
        result.brand = 'ok'
      } catch (e) {
        errors.brand = e instanceof Error ? e.message : 'Error guardando la marca'
      }
    }

    // 3. Proyecto opcional (auto-provisiona mira_users del admin)
    if (typeof project?.name === 'string' && project.name.trim()) {
      try {
        let { data: miraUser } = await admin
          .from('mira_users')
          .select('id')
          .eq('auth_id', user.id)
          .maybeSingle()
        if (!miraUser) {
          const { data: created } = await admin
            .from('mira_users')
            .insert({ auth_id: user.id, email: user.email ?? '', company_name: 'MIRA Agency' })
            .select('id')
            .single()
          miraUser = created
        }
        if (!miraUser) throw new Error('No se pudo provisionar mira_users')
        const pSlugBase = slugify(project.name) || 'proyecto'
        let created = null
        for (let attempt = 0; attempt < 5 && !created; attempt++) {
          const candidate = attempt === 0 ? pSlugBase : `${pSlugBase}-${attempt + 1}`
          const { data, error } = await admin
            .from('mira_projects')
            .insert({
              user_id: miraUser.id,
              client_id: clientId,
              name: project.name.trim(),
              slug: candidate,
              description: project.description || null,
              status: 'active',
              agents_count: 0,
            })
            .select('id, slug, name')
            .single()
          if (!error && data) created = data
          else if (!String(error?.message || '').includes('duplicate')) throw new Error(error?.message)
        }
        if (created) result.project = created
        else errors.project = 'No se encontró slug libre para el proyecto'
      } catch (e) {
        errors.project = e instanceof Error ? e.message : 'Error creando el proyecto'
      }
    }

    // 4. Acceso del cliente
    if (typeof login?.email === 'string' && login.email.trim()) {
      const access = await createClientLoginAccess(
        clientId,
        login.email.trim(),
        typeof login.plan === 'string' ? login.plan : 'starter'
      )
      if ('error' in access) errors.login = String(access.error)
      else result.login = access
    }

    // 5. Registro de sesión (best-effort)
    try {
      await admin.from('onboarding_sessions').insert({
        client_id: clientId,
        name: companyName,
        status: 'completed',
      })
    } catch { /* no crítico */ }

    return NextResponse.json({
      success: Object.keys(errors).length === 0,
      client_id: clientId,
      result,
      ...(Object.keys(errors).length ? { errors } : {}),
    })
  } catch (error) {
    console.error('onboarding/create error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error creando el cliente' },
      { status: 500 }
    )
  }
}
