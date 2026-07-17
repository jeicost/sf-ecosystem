import { NextResponse } from 'next/server'
import { AuthError } from './auth'

export function handleApiError(error: unknown, fallbackMessage: string): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message || 'Unauthorized' },
      { status: 401 }
    )
  }

  const message = error instanceof Error ? error.message : fallbackMessage
  console.error('API error:', error)
  return NextResponse.json(
    { error: message },
    { status: 500 }
  )
}
