import { createAdminClient } from '@/lib/supabase/admin'
import { withAdminAuth } from '@/lib/auth/with-admin-auth'
import { resolveAccess } from '@/lib/auth/access'
import { captureError } from '@/lib/capture-error'
import crypto from 'crypto'
import type { NextRequest } from 'next/server'

export const GET = withAdminAuth(async (user, request: NextRequest) => {
  try {
    const access = await resolveAccess(user)
    const client = createAdminClient()
    let query = client
      .from('projects')
      .select('id, name, slug, domain, api_key, api_key_hash, api_key_last4, vercel_hook_url, created_at, brief_status')
      .order('created_at', { ascending: false })

    // Editors only see the projects they're assigned to.
    if (!access.isGlobalAdmin) {
      if (access.projectIds.length === 0) return Response.json({ projects: [] }, { status: 200 })
      query = query.in('id', access.projectIds)
    }

    const { data, error } = await query
    if (error) throw error

    // Attach each project's latest deploy-hook outcome (OPS-07 visibility).
    const projects = data || []
    if (projects.length > 0) {
      const { data: recent } = await client
        .from('deploy_events')
        .select('project_id, status, created_at')
        .in('project_id', projects.map((p) => p.id))
        .order('created_at', { ascending: false })
        .limit(200)
      const latest = new Map<string, { status: string; created_at: string }>()
      for (const e of recent ?? []) {
        if (!latest.has(e.project_id)) latest.set(e.project_id, { status: e.status, created_at: e.created_at })
      }
      for (const p of projects as Array<Record<string, unknown>>) {
        p.last_deploy = latest.get(p.id as string) ?? null
      }
    }

    // Never ship the raw or hashed key over the wire (MT-03/SEC-02) — only a
    // last-4 reference for identification, derived server-side either way.
    const sanitized = (projects as Array<Record<string, unknown>>).map((p) => {
      const legacyKey = p.api_key as string | null
      const { api_key: _apiKey, api_key_hash: _apiKeyHash, ...rest } = p
      return {
        ...rest,
        api_key_last4: legacyKey ? legacyKey.slice(-4) : (p.api_key_last4 ?? null),
        api_key_hashed: !legacyKey,
      }
    })

    return Response.json({ projects: sanitized }, { status: 200 })
  } catch (err) {
    await captureError(err, { route: 'GET /api/admin/projects' })
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
})

// NOTE: Deliberately NOT wrapped in withAdminAuth. This is server-to-server
// auth for scripts (e.g. landing-builder) via a Bearer ADMIN_SECRET, not a
// user session — see SF-CMS-GAP-AUDIT-2026-07-21 discussion. Do not touch.
export async function POST(request: Request) {
  try {
    const adminSecret = process.env.ADMIN_SECRET

    if (!adminSecret) {
      console.error('ADMIN_SECRET not configured')
      return Response.json({ error: 'Server misconfigured' }, { status: 500 })
    }

    // Verify admin authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const tokenBuf = Buffer.from(token)
    const secretBuf = Buffer.from(adminSecret)
    const isValid =
      tokenBuf.length === secretBuf.length &&
      crypto.timingSafeEqual(tokenBuf, secretBuf)

    if (!isValid) {
      return Response.json({ error: 'Invalid authorization token' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, domain, client_slug } = body

    if (!name || !slug) {
      return Response.json({ error: 'Missing required fields: name, slug' }, { status: 400 })
    }

    // Generate unique API key — stored hashed (MT-03/SEC-02), never persisted
    // in plaintext. The raw value is only ever in this response, once.
    const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
    const apiKeyLast4 = apiKey.slice(-4)

    const client = createAdminClient()

    // Check if project already exists — return its identity (never api_key)
    // so callers like landing-builder can recover idempotently on re-runs
    const { data: existing } = await client
      .from('projects')
      .select('id, slug, name')
      .eq('slug', slug)
      .single()

    if (existing) {
      return Response.json(
        {
          error: 'Project slug already exists',
          existing: { id: existing.id, slug: existing.slug, name: existing.name },
        },
        { status: 409 },
      )
    }

    // Create project
    const { data: project, error } = await client
      .from('projects')
      .insert({
        name,
        slug,
        domain,
        client_slug,
        api_key_hash: apiKeyHash,
        api_key_last4: apiKeyLast4,
      })
      .select()
      .single()

    if (error) {
      await captureError(error, { route: 'POST /api/admin/projects' })
      return Response.json({ error: 'Failed to create project' }, { status: 500 })
    }

    return Response.json(
      {
        id: project.id,
        slug: project.slug,
        api_key: apiKey,
        name: project.name,
      },
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    await captureError(err, { route: 'POST /api/admin/projects' })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
