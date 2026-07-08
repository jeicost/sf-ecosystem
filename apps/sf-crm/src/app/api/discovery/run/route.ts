import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createDiscoveryRun } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { company, workspaceId } = await request.json()

    if (!company || company.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Create discovery run record
    const run = await createDiscoveryRun({
      workspaceId: workspaceId || session.workspace.id,
      clientId: session.workspace.clientId,
      company: company.trim(),
      status: 'pending',
      results: {},
      startedAt: new Date().toISOString(),
    })

    // In production, this would:
    // 1. Call Sales Engine discovery API
    // 2. Update run status to 'running'
    // 3. Process results asynchronously
    // 4. Update run with results and status 'completed'

    // For now, return mock pending status
    return NextResponse.json({
      success: true,
      run: {
        ...run,
        status: 'pending',
      },
    })
  } catch (error) {
    console.error('Discovery run error:', error)
    return NextResponse.json(
      { error: 'Failed to start discovery run' },
      { status: 500 }
    )
  }
}
