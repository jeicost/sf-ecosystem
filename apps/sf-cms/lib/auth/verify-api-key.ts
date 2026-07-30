import { createHash, timingSafeEqual } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Verifies an incoming x-api-key against a project by slug. Supports both
 * legacy plaintext keys (api_key column, pre-2026-07-30) and hashed keys
 * (api_key_hash, projects created after — MT-03/SEC-02). Never returns which
 * form matched or why a mismatch failed, to avoid leaking which key style a
 * project uses.
 */
export async function verifyProjectApiKey(
  projectSlug: string,
  apiKey: string,
): Promise<{ id: string; slug: string } | null> {
  const client = createAdminClient()
  const { data: project, error } = await client
    .from('projects')
    .select('id, slug, api_key, api_key_hash')
    .eq('slug', projectSlug)
    .single()

  if (error || !project) return null

  if (project.api_key) {
    const a = Buffer.from(project.api_key)
    const b = Buffer.from(apiKey)
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return { id: project.id, slug: project.slug }
    }
    return null
  }

  if (project.api_key_hash) {
    const hash = createHash('sha256').update(apiKey).digest('hex')
    const a = Buffer.from(project.api_key_hash)
    const b = Buffer.from(hash)
    if (a.length === b.length && timingSafeEqual(a, b)) {
      return { id: project.id, slug: project.slug }
    }
    return null
  }

  return null
}
