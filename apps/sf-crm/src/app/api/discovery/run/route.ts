import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createDiscoveryRun, getDiscoveryRuns } from '@/lib/db'
import { handleApiError } from '@/lib/api-errors'

export async function GET() {
  try {
    const session = await requireAuth()
    const { data } = await getDiscoveryRuns(session.workspace.id, { limit: 100 })
    return NextResponse.json({ data })
  } catch (error) {
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
    return handleApiError(error, 'Failed to start discovery run')
  }
}
