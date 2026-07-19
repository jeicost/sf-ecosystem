import { createServiceClient } from '@/lib/supabase-admin'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { NextRequest, NextResponse } from 'next/server'

interface AffiliateTrackingRequest {
  clientId: string
  toolId: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  referralUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AffiliateTrackingRequest
    const { clientId, toolId, utmSource = 'mira', utmMedium = 'integrations', utmCampaign, referralUrl } = body

    if (!clientId || !toolId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const db = createServiceClient()

    const { error } = await db.from('affiliate_tracking').insert({
      client_id: clientId,
      tool_id: toolId,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign || `${toolId}_onboarding`,
      referral_url: referralUrl || null,
    })

    if (error) throw error

    return NextResponse.json({ success: true, toolId })
  } catch (error) {
    console.error('Affiliate tracking error:', error)
    return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 })
  }
}
