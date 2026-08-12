import { adminClient } from '@/lib/supabase'
import { canAddSeat } from '@/lib/seats'

// Login-access creation for a newly-onboarded client — the Tier 2, explicit-
// confirm-only step of the onboarding chat. Logic lifted from
// scripts/onboard-full-client.mjs's ensureAuthUser/ensureProjectAccess (kept
// idempotent the same way: safe to call again if it partially failed), with
// the retry pattern from app/api/admin/users/plan/route.ts for the GoTrue
// Admin API's intermittent "unrecognized JWT kid" failures (see memory:
// supabase-service-role-gotrue-quirk) — that script has no retry at all,
// which is fine for a human re-running a CLI command but not for a chat flow.
//
// DEVUELVE errores, no los lanza. Las dos rutas que la llaman ya escribían
// `'error' in access ? ...` esperando eso, pero la función lanzaba: la rama de
// recuperación parcial era código muerto y el botón "reintentar solo el acceso"
// inalcanzable. Peor todavía en el alta completa — un fallo aquí subía hasta el
// catch de la ruta y devolvía 500 después de haber creado ya el cliente, la
// marca y el proyecto, así que el operador veía "ha fallado" sobre un cliente
// que SÍ existía en la base de datos.

const RESET_PASSWORD_REDIRECT = 'https://mira-portal-nu.vercel.app/reset-password'

export interface CreateLoginAccessResult {
  userId: string
  email: string
  userCreated: boolean
  grantCreated: boolean
  recoveryLink: string | null
  /** Asientos tras conceder el acceso, para poder enseñarlo en la UI. */
  seats?: { used: number; max: number }
}

export interface CreateLoginAccessError {
  error: string
  /** 'seats_full' permite a la UI ofrecer ampliar en vez de solo dar un error. */
  reason?: 'seats_full' | 'auth_failed' | 'grant_failed'
  seats?: { used: number; max: number }
}

type RetryResult<T> = { ok: true; value: T } | { ok: false; error: string }

async function withRetry<T>(
  fn: () => Promise<{ data: T | null; error: { message: string } | null }>,
  attempts = 3
): Promise<RetryResult<T>> {
  let lastError: string | undefined
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await fn()
    if (data) return { ok: true, value: data }
    lastError = error?.message
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800))
  }
  return { ok: false, error: lastError || 'Failed after retries' }
}

export async function createClientLoginAccess(
  clientId: string,
  email: string,
  plan: string = 'starter',
  role: 'owner' | 'admin' | 'editor' | 'viewer' = 'owner'
): Promise<CreateLoginAccessResult | CreateLoginAccessError> {
  const admin = adminClient()

  const listed = await withRetry(() =>
    admin.auth.admin.listUsers({ perPage: 1000 }).then((r) => ({ data: r.data, error: r.error }))
  )
  if (!listed.ok) return { error: listed.error, reason: 'auth_failed' }
  const existingUser = listed.value.users.find((u) => u.email === email)

  // Los asientos se comprueban ANTES de crear la cuenta: si no cabe, no
  // dejamos un usuario huérfano por el camino. Un usuario que YA tiene acceso
  // no gasta asiento, así que reintentar un alta a medias sigue pasando.
  // Sin esta comprobación el alta de agencia era la puerta trasera por la que
  // el límite que sí aplica /api/team se saltaba entero.
  const seatCheck = await canAddSeat(clientId, existingUser?.id ?? '00000000-0000-0000-0000-000000000000')
  if (!seatCheck.ok) {
    return {
      error: seatCheck.message,
      reason: seatCheck.reason === 'seats_full' ? 'seats_full' : undefined,
      ...(seatCheck.usage ? { seats: { used: seatCheck.usage.used, max: seatCheck.usage.max } } : {}),
    }
  }

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
    if (!created.ok) return { error: created.error, reason: 'auth_failed' }
    userId = created.value.id
    userCreated = true
  }

  // El enlace de recuperación es un extra: que falle no invalida una cuenta
  // que ya existe y a la que ya se puede dar acceso.
  const link = await withRetry(() =>
    admin.auth.admin
      .generateLink({ type: 'recovery', email, options: { redirectTo: RESET_PASSWORD_REDIRECT } })
      .then((r) => ({ data: r.data, error: r.error }))
  )
  const recoveryLink = link.ok ? link.value.properties?.action_link ?? null : null

  const { data: existingGrant } = await admin
    .from('mira_project_access')
    .select('id')
    .eq('user_id', userId)
    .eq('project_id', clientId)
    .maybeSingle()

  let grantCreated = false
  if (!existingGrant) {
    const { error: grantError } = await admin
      .from('mira_project_access')
      .insert({ user_id: userId, project_id: clientId, role })
    if (grantError) return { error: `Grant creation failed: ${grantError.message}`, reason: 'grant_failed' }
    grantCreated = true
  }

  return {
    userId,
    email,
    userCreated,
    grantCreated,
    recoveryLink,
    seats: { used: seatCheck.usage.used + (grantCreated ? 1 : 0), max: seatCheck.usage.max },
  }
}
