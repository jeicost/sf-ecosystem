import { NextResponse } from 'next/server'
import { AuthError } from './auth'

// Postgres / PostgREST error codes that mean the live DB is missing schema
// this code expects (table or column not provisioned):
//   PGRST205 = table not found in schema cache
//   PGRST204 = column not found in schema cache (writes)
//   42P01    = undefined_table
//   42703    = undefined_column
const SCHEMA_MISSING_CODES = new Set(['PGRST205', 'PGRST204', '42P01', '42703'])

export function isSchemaMissingError(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code
  return typeof code === 'string' && SCHEMA_MISSING_CODES.has(code)
}

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
