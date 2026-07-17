import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getLeads, getCrmContacts } from '@/lib/db'
import { getWorkspace } from '@/lib/workspaces'
import { getHotScore } from '@/lib/utils'
import { handleApiError } from '@/lib/api-errors'

export async function GET() {
  try {
    const session = await requireAuth()
    const workspace = getWorkspace(session.workspace.id)

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    let metrics = {
      totalLeads: 0,
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0,
      conversionRate: 0,
    }

    if (workspace.type === 'sf') {
      if (!workspace.clientId) {
        return NextResponse.json({ ...metrics })
      }
      const { data } = await getLeads(workspace.clientId, { limit: 1000 })
      metrics.totalLeads = data.length
      data.forEach((lead: any) => {
        const score = getHotScore(lead.hot_score ?? 0)
        if (score === 'hot') metrics.hotLeads++
        else if (score === 'warm') metrics.warmLeads++
        else metrics.coldLeads++
      })
    } else {
      const result = await getCrmContacts(workspace.id, { limit: 1000 })
      metrics.totalLeads = result.data.length
      result.data.forEach((contact: any) => {
        const score = getHotScore(contact.score ?? 0)
        if (score === 'hot') metrics.hotLeads++
        else if (score === 'warm') metrics.warmLeads++
        else metrics.coldLeads++
      })
    }

    if (metrics.totalLeads > 0) {
      metrics.conversionRate = (metrics.hotLeads / metrics.totalLeads) * 100
    }

    return NextResponse.json(metrics)
  } catch (error) {
    return handleApiError(error, 'Failed to fetch metrics')
  }
}
