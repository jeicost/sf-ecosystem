import { NextRequest, NextResponse } from 'next/server'
import { getApiValidator } from '@/lib/integrations/api-validators'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toolId, apiKey } = body

    if (!toolId || !apiKey) {
      return NextResponse.json({ error: 'Missing toolId or apiKey' }, { status: 400 })
    }

    // Validate API key
    const validator = getApiValidator(toolId)
    const result = await validator(apiKey)

    return NextResponse.json({
      valid: result.valid,
      error: result.error,
      accountInfo: result.accountInfo,
    })
  } catch (error) {
    console.error('API key validation error:', error)
    return NextResponse.json(
      { error: 'Validation failed', valid: false },
      { status: 500 }
    )
  }
}
