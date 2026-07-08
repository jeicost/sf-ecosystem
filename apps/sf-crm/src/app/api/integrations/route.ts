import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    await requireAuth()

    const integrations = {
      apollo: !!process.env.APOLLO_API_KEY && process.env.APOLLO_API_KEY !== 'your_apollo_key_here',
      hunter: !!process.env.HUNTER_API_KEY && process.env.HUNTER_API_KEY !== 'your_hunter_key_here',
      resend: !!process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 'your_resend_key_here',
      salesEngine: !!process.env.SALES_ENGINE_API_KEY && process.env.SALES_ENGINE_API_KEY !== 'your_sales_engine_key_here',
    }

    return NextResponse.json(integrations)
  } catch (error) {
    console.error('Get integrations error:', error)
    return NextResponse.json(
      { error: 'Failed to get integrations' },
      { status: 500 }
    )
  }
}
