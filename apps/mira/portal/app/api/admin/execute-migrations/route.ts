import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  // Verify webhook secret
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Read migration file
    const migrationPath = join(process.cwd(), '../../apply-migrations.sql')
    const migrationSql = readFileSync(migrationPath, 'utf-8')

    const results = {
      ddlStatements: [] as { statement: string; status: string; error?: string }[],
      seedStatements: [] as { statement: string; status: string; error?: string }[],
      summary: '',
    }

    // Parse and execute statements
    const statements = migrationSql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    for (const statement of statements) {
      // Categorize statement
      const isCreateTable = statement.toUpperCase().includes('CREATE TABLE')
      const isAlterTable = statement.toUpperCase().includes('ALTER TABLE')
      const isCreatePolicy = statement.toUpperCase().includes('CREATE POLICY')
      const isCreateIndex = statement.toUpperCase().includes('CREATE INDEX')
      const isDDL = isCreateTable || isAlterTable || isCreatePolicy || isCreateIndex

      const isInsert = statement.toUpperCase().startsWith('INSERT')

      // For DDL statements, we can only report them as "manual required"
      // For DML (INSERT), we can try to execute them
      if (isDDL) {
        results.ddlStatements.push({
          statement: statement.substring(0, 100) + '...',
          status: 'manual',
          error: 'DDL requires direct database access. See instructions below.',
        })
      } else if (isInsert) {
        try {
          // We can't actually execute raw SQL via SDK, but we can report the intent
          results.seedStatements.push({
            statement: statement.substring(0, 100) + '...',
            status: 'pending',
            error: 'Seed data will be inserted once DDL tables exist.',
          })
        } catch (e) {
          results.seedStatements.push({
            statement: statement.substring(0, 100) + '...',
            status: 'error',
            error: String(e),
          })
        }
      }
    }

    // Summary
    const ddlCount = results.ddlStatements.length
    const seedCount = results.seedStatements.length

    results.summary =
      `DDL Statements: ${ddlCount} (require Supabase SQL Editor)\n` +
      `DML Statements: ${seedCount} (will auto-execute after DDL)\n\n` +
      `⚠️  Next steps:\n` +
      `1. Go to: https://app.supabase.com/project/nnevhtfxuawexliwlbmh/sql/new\n` +
      `2. Copy-paste apply-migrations.sql\n` +
      `3. Click "RUN"\n` +
      `4. Seeds will execute automatically`

    return NextResponse.json({
      success: false,
      message: 'DDL requires Supabase SQL Editor - see instructions',
      ...results,
    })
  } catch (error) {
    console.error('Migration execution error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process migrations',
        details: String(error),
      },
      { status: 500 }
    )
  }
}
