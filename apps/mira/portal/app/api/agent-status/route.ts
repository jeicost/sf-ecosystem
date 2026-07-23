import { NextRequest, NextResponse } from 'next/server'
import { getAgentStatusesForClient } from '@/lib/agent-status'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const agentIdsParam = searchParams.get('agentIds')

    if (!clientId || !agentIdsParam) {
      return NextResponse.json({ error: 'Missing clientId or agentIds' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const agentIds = agentIdsParam.split(',').filter(Boolean)
    const statuses = await getAgentStatusesForClient(clientId, agentIds)

    return NextResponse.json(statuses)
  } catch (error) {
    console.error('Error in agent-status:', error)
    return NextResponse.json({ error: 'Failed to fetch agent statuses' }, { status: 500 })
  }
}
