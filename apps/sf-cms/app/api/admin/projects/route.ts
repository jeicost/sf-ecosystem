import { createAdminClient } from '@/lib/supabase/admin'
import { requireSession } from '@/lib/auth/require-session'
import crypto from 'crypto'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = createAdminClient()
    const { data, error } = await client
      .from('projects')
      .select('id, name, slug, domain, api_key, vercel_hook_url, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error

    return Response.json({ projects: data || [] }, { status: 200 })
  } catch (err) {
    console.error('Error fetching projects:', err)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    if (token !== adminSecret) {
      return Response.json({ error: 'Invalid authorization token' }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, domain, client_slug } = body

    if (!name || !slug) {
      return Response.json({ error: 'Missing required fields: name, slug' }, { status: 400 })
    }

    // Generate unique API key
    const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`

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
        api_key: apiKey,
      })
      .select()
      .single()

    if (error) {
      console.error('DB error:', error)
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
    console.error('Error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
