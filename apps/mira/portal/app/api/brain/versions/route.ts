import { createServiceClient } from '@/lib/supabase-admin'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { NextRequest, NextResponse } from 'next/server'

interface SaveVersionRequest {
  clientId: string
  changeSummary: string
  triggeredBy: 'user' | 'agent' | 'system'
  triggeredByAgentId?: string
}

interface RollbackRequest {
  clientId: string
  versionNumber: number
}

async function getCurrentVersionNumber(clientId: string) {
  const db = createServiceClient()
  const { data } = await db
    .from('brand_profiles')
    .select('current_version_number')
    .eq('id', clientId)
    .single()

  return data?.current_version_number || 1
}

async function getBrandSnapshot(clientId: string) {
  const db = createServiceClient()
  const { data } = await db
    .from('brand_profiles')
    .select('*')
    .eq('id', clientId)
    .single()

  if (!data) throw new Error('Brand profile not found')

  // Remove internal fields
  const { id, user_id, created_at, updated_at, current_version_number, ...snapshot } = data
  return snapshot
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveVersionRequest
    const { clientId, changeSummary, triggeredBy, triggeredByAgentId } = body

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const db = createServiceClient()

    // Get current version and increment
    const currentVersion = await getCurrentVersionNumber(clientId)
    const nextVersion = currentVersion + 1

    // Get current brain snapshot
    const snapshot = await getBrandSnapshot(clientId)

    // Save version
    const { error: versionError } = await db.from('brain_versions').insert({
      client_id: clientId,
      version_number: nextVersion,
      snapshot,
      change_summary: changeSummary,
      triggered_by: triggeredBy,
      triggered_by_agent_id: triggeredByAgentId || null,
    })

    if (versionError) throw versionError

    // Update brand_profiles with new version number
    const { error: updateError } = await db
      .from('brand_profiles')
      .update({
        current_version_number: nextVersion,
        version_last_updated: new Date().toISOString(),
      })
      .eq('id', clientId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, version: nextVersion })
  } catch (error) {
    console.error('Save version error:', error)
    return NextResponse.json({ error: 'Failed to save version' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as RollbackRequest
    const { clientId, versionNumber } = body

    if (!clientId) {
      return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    }

    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    const db = createServiceClient()

    // Get the version to restore
    const { data: targetVersion, error: versionError } = await db
      .from('brain_versions')
      .select('snapshot')
      .eq('client_id', clientId)
      .eq('version_number', versionNumber)
      .single()

    if (versionError || !targetVersion) throw new Error('Version not found')

    // Get current version for comparison
    const currentVersion = await getCurrentVersionNumber(clientId)

    // Update brand_profiles with snapshot data + create new version entry
    const { error: updateError } = await db
      .from('brand_profiles')
      .update({
        ...targetVersion.snapshot,
        current_version_number: currentVersion + 1,
        version_last_updated: new Date().toISOString(),
      })
      .eq('id', clientId)

    if (updateError) throw updateError

    // Create a new version record for the rollback
    await db.from('brain_versions').insert({
      client_id: clientId,
      version_number: currentVersion + 1,
      snapshot: targetVersion.snapshot,
      change_summary: `Restored from version ${versionNumber}`,
      triggered_by: 'user',
    })

    return NextResponse.json({ success: true, version: currentVersion + 1 })
  } catch (error) {
    console.error('Rollback error:', error)
    return NextResponse.json({ error: 'Failed to rollback version' }, { status: 500 })
  }
}
