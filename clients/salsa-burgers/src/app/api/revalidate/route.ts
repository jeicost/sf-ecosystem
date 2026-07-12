import { revalidatePath } from 'next/cache'
import type { NextRequest } from 'next/server'

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'dev-secret-unsafe'

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret')

  if (secret !== REVALIDATE_SECRET) {
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
