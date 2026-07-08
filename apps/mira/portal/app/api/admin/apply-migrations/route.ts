import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (token !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Supabase REST API does not support raw SQL execution.
  // Migrations must be run manually via the Supabase SQL Editor:
  // https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql
  // File: apps/mira/apply-migrations.sql
  return Response.json({
    success: false,
    manual_required: true,
    message: 'Raw SQL cannot be executed via REST API. Run apply-migrations.sql manually in the Supabase SQL Editor.',
    url: 'https://supabase.com/dashboard/project/nnevhtfxuawexliwlbmh/sql',
  }, { status: 501 })
}
