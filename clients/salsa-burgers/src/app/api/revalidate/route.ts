import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET

  if (!secret) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET environment variable is not set' },
      { status: 500 },
    )
  }

  const providedSecret = request.headers.get('x-revalidate-secret')
  if (providedSecret !== secret) {
    return NextResponse.json({ error: 'Invalid or missing x-revalidate-secret header' }, { status: 401 })
  }

  try {
    const payload = (await request.json()) as any

    if (payload.paths && Array.isArray(payload.paths)) {
      for (const path of payload.paths) {
        revalidatePath(path)
      }
    } else if (payload.type && payload.slug) {
      if (payload.type === 'post') {
        revalidatePath(`/blog/${payload.slug}`)
        revalidatePath('/blog')
      } else if (payload.type === 'page') {
        revalidatePath(`/${payload.slug}`)
      }
    }

    return NextResponse.json(
      { revalidated: true, timestamp: new Date().toISOString() },
      { status: 200 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Revalidation failed: ${message}` }, { status: 500 })
  }
}
