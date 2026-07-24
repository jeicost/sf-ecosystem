import { adminClient } from '@/lib/supabase'

// Login-access creation for a newly-onboarded client — the Tier 2, explicit-
// confirm-only step of the onboarding chat. Logic lifted from
// scripts/onboard-full-client.mjs's ensureAuthUser/ensureProjectAccess (kept
// idempotent the same way: safe to call again if it partially failed), with
// the retry pattern from app/api/admin/users/plan/route.ts for the GoTrue
// Admin API's intermittent "unrecognized JWT kid" failures (see memory:
// supabase-service-role-gotrue-quirk) — that script has no retry at all,
// which is fine for a human re-running a CLI command but not for a chat flow.

const RESET_PASSWORD_REDIRECT = 'https://mira-portal-nu.vercel.app/reset-password'

export interface CreateLoginAccessResult {
  userId: string
  email: string
  userCreated: boolean
  grantCreated: boolean
  recoveryLink: string | null
}

async function withRetry<T>(fn: () => Promise<{ data: T | null; error: { message: string } | null }>, attempts = 3): Promise<T> {
  let lastError: string | undefined
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await fn()
    if (data) return data
    lastError = error?.message
    await new Promise((r) => setTimeout(r, 800))
  }
  throw new Error(lastError || 'Failed after retries')
}

export async function createClientLoginAccess(
  clientId: string,
  email: string,
  plan: string = 'starter',
  role: 'owner' | 'admin' | 'editor' | 'viewer' = 'owner'
): Promise<CreateLoginAccessResult> {
  const admin = adminClient()

  const existingUsers = await withRetry(() => admin.auth.admin.listUsers({ perPage: 1000 }).then((r) => ({ data: r.data, error: r.error })))
  const existingUser = existingUsers.users.find((u) => u.email === email)

  let userId: string
  let userCreated = false

  if (existingUser) {
    userId = existingUser.id
  } else {
    const tempPassword = Math.random().toString(36).slice(-12)
    const created = await withRetry(() =>
      admin.auth.admin
        .createUser({ email, password: tempPassword, email_confirm: true, user_metadata: { plan, client_id: clientId } })
        .then((r) => ({ data: r.data?.user ?? null, error: r.error }))
    )
    userId = created.id
    userCreated = true
  }

  let recoveryLink: string | null = null
  try {
    const link = await withRetry(() =>
      admin.auth.admin
        .generateLink({ type: 'recovery', email, options: { redirectTo: RESET_PASSWORD_REDIRECT } })
        .then((r) => ({ data: r.data, error: r.error }))
    )
    recoveryLink = link.properties?.action_link ?? null
  } catch {
    // Recovery link generation failing shouldn't block the account itself existing.
  }

  const { data: existingGrant } = await admin
    .from('mira_project_access')
    .select('id')
    .eq('user_id', userId)
    .eq('project_id', clientId)
    .maybeSingle()

  let grantCreated = false
  if (!existingGrant) {
    const { error: grantError } = await admin.from('mira_project_access').insert({ user_id: userId, project_id: clientId, role })
    if (grantError) throw new Error(`Grant creation failed: ${grantError.message}`)
    grantCreated = true
  }

  return { userId, email, userCreated, grantCreated, recoveryLink }
}
