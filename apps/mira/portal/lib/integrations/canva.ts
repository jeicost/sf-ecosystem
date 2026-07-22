// Canva Connect helpers — token access (with lazy refresh) and PPTX design import.
// Auth flow lives in the generic OAuth framework:
//   app/api/integrations/oauth/[tool]/start  →  PKCE authorize
//   app/api/integrations/oauth/callback      →  token exchange + tool_connections upsert
// Tokens are persisted in tool_connections.metadata: { access_token, refresh_token, expires_at }.

import { createServiceClient } from '@/lib/supabase-admin'
import { getOAuthConfig } from '@/lib/integrations/oauth-config'

const CANVA_TOOL_ID = 'canva'
const CANVA_API_BASE = 'https://api.canva.com/rest/v1'
const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'

/** Refresh the token this many ms before it actually expires. */
const EXPIRY_SKEW_MS = 60_000

/** Thrown when the client has no usable Canva connection (routes map it to 409). */
export class CanvaNotConnectedError extends Error {
  constructor(message = 'canva_not_connected') {
    super(message)
    this.name = 'CanvaNotConnectedError'
  }
}

interface CanvaTokenMetadata {
  access_token?: string | null
  refresh_token?: string | null
  expires_at?: string | null
  [key: string]: unknown
}

/**
 * Get a valid Canva access token for a client, refreshing lazily when
 * expires_at has passed. Returns null when there is no connection or the
 * token cannot be refreshed.
 */
export async function getCanvaToken(clientId: string): Promise<string | null> {
  const db = createServiceClient()
  const { data: connection } = await db
    .from('tool_connections')
    .select('id, auth_token, metadata, status')
    .eq('client_id', clientId)
    .eq('tool_id', CANVA_TOOL_ID)
    .single()

  if (!connection || connection.status !== 'connected') return null

  const metadata: CanvaTokenMetadata = (connection.metadata as CanvaTokenMetadata) || {}
  const accessToken = metadata.access_token || connection.auth_token || null
  if (!accessToken) return null

  const expiresAt = metadata.expires_at ? new Date(metadata.expires_at).getTime() : null
  const isExpired = expiresAt !== null && expiresAt - EXPIRY_SKEW_MS <= Date.now()
  if (!isExpired) return accessToken

  // Expired → refresh (Canva rotates refresh tokens: always persist the new one)
  const refreshToken = metadata.refresh_token
  if (!refreshToken) return null

  const config = getOAuthConfig(CANVA_TOOL_ID)
  const canvaClientId = process.env[config?.clientIdEnvVar || 'NEXT_PUBLIC_CANVA_CLIENT_ID']
  const canvaClientSecret = process.env[config?.clientSecretEnvVar || 'CANVA_CLIENT_SECRET']
  if (!config?.tokenUrl || !canvaClientId || !canvaClientSecret) return null

  try {
    const res = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + Buffer.from(`${canvaClientId}:${canvaClientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }).toString(),
    })
    if (!res.ok) {
      console.error('Canva token refresh failed:', res.status, await res.text())
      return null
    }
    const tokenData = (await res.json()) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }
    if (!tokenData.access_token) return null

    const newExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null

    await db
      .from('tool_connections')
      .update({
        auth_token: tokenData.access_token,
        metadata: {
          ...metadata,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || refreshToken,
          expires_at: newExpiresAt,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id)

    return tokenData.access_token
  } catch (error) {
    console.error('Canva token refresh error:', error)
    return null
  }
}

interface CanvaImportJob {
  job?: {
    id?: string
    status?: 'in_progress' | 'success' | 'failed'
    error?: { code?: string; message?: string }
    result?: {
      designs?: Array<{
        id?: string
        urls?: { edit_url?: string; view_url?: string }
      }>
    }
  }
}

/**
 * Import a PPTX buffer into Canva as a new editable design.
 * Canva Import API: POST /rest/v1/imports with the raw asset as octet-stream and
 * an `Import-Metadata` header — a JSON object with the base64-encoded title and
 * the source mime type. Then poll GET /rest/v1/imports/{jobId} until the job
 * finishes (max ~60s). Returns the edit URL of the created design.
 */
export async function importDesignFromPptx(
  clientId: string,
  pptxBuffer: Buffer,
  title: string
): Promise<{ editUrl: string }> {
  const accessToken = await getCanvaToken(clientId)
  if (!accessToken) throw new CanvaNotConnectedError()

  const createRes = await fetch(`${CANVA_API_BASE}/imports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'Import-Metadata': JSON.stringify({
        title_base64: Buffer.from(title, 'utf-8').toString('base64'),
        mime_type: PPTX_MIME,
      }),
    },
    body: new Uint8Array(pptxBuffer),
  })

  if (!createRes.ok) {
    const detail = await createRes.text().catch(() => '')
    throw new Error(`Canva import failed (${createRes.status}): ${detail.slice(0, 300)}`)
  }

  let job = ((await createRes.json()) as CanvaImportJob).job
  const jobId = job?.id
  if (!jobId) throw new Error('Canva import: no job id in response')

  // Poll until success/failed, max 60s
  const deadline = Date.now() + 60_000
  while (job?.status === 'in_progress' && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const pollRes = await fetch(`${CANVA_API_BASE}/imports/${jobId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!pollRes.ok) {
      const detail = await pollRes.text().catch(() => '')
      throw new Error(`Canva import poll failed (${pollRes.status}): ${detail.slice(0, 300)}`)
    }
    job = ((await pollRes.json()) as CanvaImportJob).job
  }

  if (job?.status === 'failed') {
    throw new Error(`Canva import failed: ${job.error?.message || job.error?.code || 'unknown error'}`)
  }
  if (job?.status !== 'success') {
    throw new Error('Canva import timed out after 60s')
  }

  const editUrl = job.result?.designs?.[0]?.urls?.edit_url
  if (!editUrl) throw new Error('Canva import succeeded but returned no edit URL')

  return { editUrl }
}
