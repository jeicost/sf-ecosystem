'use server'

import { createHash } from 'crypto'
import { requireSessionOrThrow } from '@/lib/auth/require-session'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function createProject(formData: FormData) {
  await requireSessionOrThrow()

  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const domain = formData.get('domain') as string

  if (!name || !slug) {
    return { error: 'Name and slug are required' }
  }

  try {
    const supabase = await createServerClient()

    // Generate API key (hex string from random bytes). Stored hashed
    // (MT-03/SEC-02) — the raw value is returned once below, for the
    // reveal-once UI, and never persisted in plaintext.
    const apiKey = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    const apiKeyHash = createHash('sha256').update(apiKey).digest('hex')
    const apiKeyLast4 = apiKey.slice(-4)

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        slug,
        domain: domain || null,
        api_key_hash: apiKeyHash,
        api_key_last4: apiKeyLast4,
        settings: {},
      })
      .select()
      .single()

    if (error) {
      console.error('Create project error:', error)
      if (error.code === '23505') {
        // Unique constraint violation
        return { error: `Slug "${slug}" already exists` }
      }
      return { error: error.message }
    }

    return { success: true, project: data, apiKey }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { error: message }
  }
}
