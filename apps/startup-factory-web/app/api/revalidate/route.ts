import { revalidatePath } from 'next/cache'
import { timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

// Fail closed: with no secret configured this endpoint must refuse to work,
// never fall back to a guessable default (the old 'dev-secret-unsafe').
function secretMatches(provided: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET
  if (!expected || !provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  if (!process.env.REVALIDATE_SECRET) {
    return new Response('Revalidation not configured', { status: 503 })
  }

  if (!secretMatches(request.headers.get('x-revalidate-secret'))) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { type, slug } = await request.json()

  try {
    if (type === 'post' && slug) {
      revalidatePath(`/blog/${slug}`)
      revalidatePath('/blog')
    } else if (type === 'page' && slug) {
      revalidatePath(`/${slug}`)
    } else if (type === 'all') {
      revalidatePath('/', 'layout')
    }

    return Response.json(
      { revalidated: true, timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch (err) {
    return Response.json(
      { error: `Revalidation failed: ${String(err)}` },
      { status: 500 }
    )
  }
}
