import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const secret = process.env.NEXT_PUBLIC_REVALIDATE_SECRET

  if (!secret) {
    return NextResponse.json(
      { error: 'REVALIDATE_SECRET not configured' },
      { status: 500 }
    )
  }

  const providedSecret = request.headers.get('x-revalidate-secret')
  if (providedSecret !== secret) {
    return NextResponse.json(
      { error: 'Invalid secret' },
      { status: 401 }
    )
  }

  try {
    const payload = await request.json() as any

    // Supabase webhook format
    if (payload.table && payload.record) {
      const slug = payload.record.slug as string | undefined
      if (slug) {
        if (payload.table === 'posts') {
          revalidatePath(`/blog/${slug}`)
          revalidatePath('/blog')
        } else if (payload.table === 'pages') {
          revalidatePath(`/${slug}`)
        }
      }
    }
    // Custom {paths: [...]} format
    else if (payload.paths && Array.isArray(payload.paths)) {
      for (const path of payload.paths) {
        revalidatePath(path)
      }
    }
    // Revalidate all
    else if (payload.type === 'all') {
      revalidatePath('/', 'layout')
    }

    return NextResponse.json(
      { revalidated: true, timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Revalidation failed: ${message}` },
      { status: 500 }
    )
  }
}
