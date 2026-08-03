import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getOutreachEmails } from '@/lib/db'
import { handleApiError, isSchemaMissingError } from '@/lib/api-errors'

export async function GET() {
  try {
    const session = await requireAuth()
    const { data, total } = await getOutreachEmails(session.workspace.id)
    return NextResponse.json({ data, total })
  } catch (error) {
    if (isSchemaMissingError(error)) {
      // Verified live (2026-08-03): the outreach_emails table does not exist in
      // Supabase project nnevhtfxuawexliwlbmh, and no migration currently
      // defines it (scripts/migrations/03_sf-crm-schema.sql does NOT create it).
      // Degrade to an empty list so the Outreach page keeps rendering.
      return NextResponse.json({
        data: [],
        total: 0,
        warning: 'outreach_emails table not provisioned yet',
        hint: 'no migration defines outreach_emails — add its DDL and apply it via the Supabase SQL editor to enable outreach history',
      })
    }
    return handleApiError(error, 'Failed to fetch outreach emails')
  }
}
