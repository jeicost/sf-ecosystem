import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/capture-error'
import { verifyProjectApiKey } from '@/lib/auth/verify-api-key'

/**
 * Public settings endpoint: GET /api/public/settings
 * Query params: ?project=<slug> (required)
 * Returns: { ga_measurement_id?, gtm_container_id?, ... }
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const projectSlug = searchParams.get('project') || searchParams.get('project_slug')
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return Response.json({ error: 'Missing x-api-key header' }, { status: 401 })
    }

    if (!checkRateLimit(apiKey)) {
      return Response.json({ error: 'Too many requests' }, { status: 429 })
    }

    if (!projectSlug) {
      return Response.json({ error: 'Missing project query parameter' }, { status: 400 })
    }

    const client = createAdminClient()

    // Verify API key belongs to project (legacy plaintext or hashed — MT-03/SEC-02)
    const verified = await verifyProjectApiKey(projectSlug, apiKey)
    if (!verified) {
      return Response.json({ error: 'Invalid API key or project' }, { status: 401 })
    }

    const { data: project } = await client
      .from('projects')
      .select('id, settings')
      .eq('id', verified.id)
      .single()

    // Validate and normalize settings (fallback to empty object if none)
    const settings = project?.settings || {}
    const normalizedSettings = {
      ga_measurement_id: settings.ga_measurement_id ?? null,
      gtm_container_id: settings.gtm_container_id ?? null,
      // Add more fields here as needed (always with null fallback)
    }

    return Response.json(normalizedSettings, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    await captureError(err, { route: 'GET /api/public/settings' })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
