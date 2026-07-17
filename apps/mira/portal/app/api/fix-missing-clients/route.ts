import { NextResponse, NextRequest } from 'next/server'
import { requireAuthGate } from '@/lib/auth-gate'

export async function POST(req: NextRequest) {
  try {
    await requireAuthGate()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    error: 'This endpoint is deprecated and disabled.',
    message: 'Use populate-all-clients or client-specific endpoints (populate-salsa, populate-dadybox, etc.) instead.',
    status: 410
  }, { status: 410 })
}
