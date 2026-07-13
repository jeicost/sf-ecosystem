import { NextRequest, NextResponse } from 'next/server'
import { getApiValidator } from '@/lib/integrations/api-validators'

export async function POST(request: NextRequest) {
  try {
    const { toolId, apiKey } = await request.json()

    if (!toolId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing toolId or apiKey' },
        { status: 400 }
      )
    }

    const validator = getApiValidator(toolId)
    const result = await validator(apiKey)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error validating API key:', error)
    return NextResponse.json(
      { valid: false, error: 'Validation error' },
      { status: 500 }
    )
  }
}
