import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createDiscoveryRun, getDiscoveryRuns } from '@/lib/db'
import { handleApiError, isSchemaMissingError } from '@/lib/api-errors'

// Verified live (2026-08-03): discovery_runs in project nnevhtfxuawexliwlbmh
// follows apps/sf-sales-engine/supabase/migrations/003_data_pipeline.sql
// (client_id, sources_used, leads_found, ...). It has NO workspace_id, company,
// status or results columns, so the queries below fail with 42703 until the
// CRM-shaped schema is provisioned. Both handlers degrade gracefully instead
// of returning a cryptic 500.

export async function GET() {
  try {
    const session = await requireAuth()
    const { data } = await getDiscoveryRuns(session.workspace.id, { limit: 100 })
    return NextResponse.json({ data })
  } catch (error) {
    if (isSchemaMissingError(error)) {
      return NextResponse.json({
        data: [],
        warning: 'discovery_runs table does not match the schema this app expects (live table has client_id, no workspace_id)',
        hint: 'live schema is apps/sf-sales-engine/supabase/migrations/003_data_pipeline.sql; scripts/migrations/03_sf-crm-schema.sql was never applied and has drifted — rework it before applying via the Supabase SQL editor',
      })
    }
    return handleApiError(error, 'Failed to fetch discovery runs')
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { company, workspaceId, icpId } = await request.json()

    if (!company || company.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Create discovery run record in pending status
    const run = await createDiscoveryRun({
      workspaceId: workspaceId || session.workspace.id,
      clientId: session.workspace.clientId,
      company: company.trim(),
      status: 'running',
      results: {},
    })

    // Fire off discovery via SF-Sales-Engine (non-blocking)
    const salesEngineUrl = process.env.SALES_ENGINE_API_URL || 'http://localhost:8000'
    const salesEngineKey = process.env.SALES_ENGINE_API_KEY

    if (salesEngineKey && salesEngineKey !== 'dev-local-test-key-2026') {
      // Call discovery endpoint in background (don't wait for response)
      fetch(`${salesEngineUrl}/discovery/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': salesEngineKey,
        },
        body: JSON.stringify({
          client_id: session.workspace.clientId,
          icp_id: icpId,
          query: company.trim(),
        }),
      }).catch((err) => {
        console.error('Background discovery call failed:', err)
      })
    }

    return NextResponse.json({
      success: true,
      run: {
        ...run,
        status: 'running',
        message: 'Discovery started. Results will update as they come in.',
      },
    })
  } catch (error) {
    if (isSchemaMissingError(error)) {
      return NextResponse.json(
        {
          error: 'discovery_runs table not provisioned for CRM-triggered runs yet',
          hint: 'live discovery_runs (apps/sf-sales-engine/supabase/migrations/003_data_pipeline.sql) has no workspace_id/company/status columns; rework scripts/migrations/03_sf-crm-schema.sql and apply it via the Supabase SQL editor',
        },
        { status: 501 }
      )
    }
    return handleApiError(error, 'Failed to start discovery run')
  }
}
