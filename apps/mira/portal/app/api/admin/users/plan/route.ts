import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser } from '@/lib/resolve-client'

const VALID_PLANS = ['consulta', 'starter', 'growth', 'scale', 'admin', 'super_admin']

// Super Admin: change a real user's plan (user_metadata.plan). The GoTrue
// Admin API intermittently fails with "unrecognized JWT kid" for write calls
// (see memory: supabase-service-role-gotrue-quirk) — retry a few times
// before giving up rather than surfacing a transient failure as real.
export async function PATCH(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser()
    if (!sessionUser || sessionUser.user_metadata?.plan !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, plan } = await request.json()
    if (!userId || !plan) {
      return NextResponse.json({ error: 'Missing userId or plan' }, { status: 400 })
    }
    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json({ error: `Invalid plan: ${plan}` }, { status: 400 })
    }

    const admin = adminClient()

    const { data: existing, error: fetchError } = await admin.auth.admin.getUserById(userId)
    if (fetchError || !existing?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const nextMetadata = { ...existing.user.user_metadata, plan }

    let lastError: string | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: nextMetadata,
      })
      if (data?.user) {
        return NextResponse.json({ success: true, userId, plan, metadata: data.user.user_metadata })
      }
      lastError = error?.message
      await new Promise((r) => setTimeout(r, 800))
    }

    return NextResponse.json(
      { error: `Failed to update plan after retries: ${lastError}` },
      { status: 502 }
    )
  } catch (error) {
    console.error('admin/users/plan error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update plan' },
      { status: 500 }
    )
  }
}
