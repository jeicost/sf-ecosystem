import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    console.log('Verifying migration status...')
    const db = adminClient()

    // Check if tables exist
    const tableCheckQueries = [
      'generation_queue',
      'deliverables',
      'quick_actions_results',
    ]

    const verified: Record<string, boolean> = {}

    for (const table of tableCheckQueries) {
      try {
        const { error } = await db
          .from(table)
          .select('count()', { count: 'exact', head: true })
        verified[table] = !error
        console.log(`${table}: ${verified[table] ? '✓' : '✗'}`)
      } catch (e) {
        verified[table] = false
        console.error(`${table} check error:`, e)
      }
    }

    const allTablesExist = Object.values(verified).every(v => v === true)

    if (allTablesExist) {
      return NextResponse.json({
        success: true,
        message: 'Migration already applied',
        tables_verified: verified,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Some tables not found. Please apply migration manually via Supabase SQL Editor.',
          tables_verified: verified,
          instructions: {
            step1: 'Go to https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql',
            step2: 'Click "New Query"',
            step3: 'Copy & paste the migration SQL from /admin/migrations page',
            step4: 'Click "Run"',
            step5: 'Return here and click "Verify Tables"',
          },
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to verify migrations',
    instructions: 'Use the /admin/migrations page to manage database migrations',
  })
}
