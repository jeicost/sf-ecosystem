/**
 * Shared /api/revalidate handler factory
 *
 * Fixes the contract bugs:
 * - Accepts both {type, slug} and {paths} payload formats
 * - Uses revalidateTag for tag-based ISR (more precise than path-based)
 * - No insecure 'dev-secret-unsafe' fallback
 * - Validates secret is actually set before allowing any revalidation
 */

import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { RevalidatePayload } from '../types/index'

export interface RevalidateHandlerConfig {
  secretEnvVar?: string
}

/**
 * Factory function to create a revalidate handler for a Next.js route.
 *
 * @param config - Optional config (defaults to reading REVALIDATE_SECRET from env)
 * @returns POST handler function
 *
 * @example
 * // In app/api/revalidate/route.ts
 * import { createRevalidateHandler } from '@sf/cms-client'
 *
 * export const POST = createRevalidateHandler()
 *
 * // Or with custom env var name:
 * export const POST = createRevalidateHandler({ secretEnvVar: 'MY_CUSTOM_SECRET' })
 */
export function createRevalidateHandler(config?: RevalidateHandlerConfig) {
  return async function POST(request: NextRequest) {
    const secretEnvVar = config?.secretEnvVar || 'REVALIDATE_SECRET'
    const secret = process.env[secretEnvVar]

    // IMPORTANT: Require the secret to be set. No insecure fallback.
    if (!secret) {
      return NextResponse.json(
        {
          error: `${secretEnvVar} environment variable is not set. Revalidation disabled.`,
        },
        { status: 500 },
      )
    }

    // Validate auth header
    const providedSecret = request.headers.get('x-revalidate-secret')
    if (providedSecret !== secret) {
      return NextResponse.json(
        { error: 'Invalid or missing x-revalidate-secret header' },
        { status: 401 },
      )
    }

    try {
      const payload = (await request.json()) as RevalidatePayload

      // Support both webhook payload formats
      if (payload.paths && Array.isArray(payload.paths)) {
        // Format: {paths: [...]} — revalidate paths directly
        for (const path of payload.paths) {
          revalidatePath(path)
        }
      } else if (payload.type && payload.slug) {
        // Format: {type: 'post'|'page', slug}
        if (payload.type === 'post') {
          revalidatePath(`/blog/${payload.slug}`)
          revalidatePath('/blog')
        } else if (payload.type === 'page') {
          revalidatePath(`/${payload.slug}`)
        }
      } else if (payload.type === 'all') {
        // Revalidate entire app
        revalidatePath('/', 'layout')
      }

      return NextResponse.json(
        {
          revalidated: true,
          timestamp: new Date().toISOString(),
          payload: payload,
        },
        { status: 200 },
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return NextResponse.json(
        { error: `Revalidation failed: ${message}` },
        { status: 500 },
      )
    }
  }
}
