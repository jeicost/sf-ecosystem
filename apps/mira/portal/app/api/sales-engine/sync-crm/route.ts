import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

interface SyncRequest {
  client_id: string
  enrichment_result_ids: string[]
}

/**
 * Sales Engine CRM Sync Endpoint (Opción 3, Phase 3)
 *
 * Syncs enriched leads to crm_contacts table
 * Creates contact records that Dadybox can see and manage in their CRM UI
 *
 * Maps:
 * - apollo_enrichment_results → crm_contacts
 * - personalized_email → initial_outreach
 * - heat_score → hot_score
 */
export async function POST(req: NextRequest) {
  try {
    const body: SyncRequest = await req.json()
    const { client_id, enrichment_result_ids } = body

    if (!client_id || !enrichment_result_ids || enrichment_result_ids.length === 0) {
      return NextResponse.json(
        { error: 'client_id and enrichment_result_ids required' },
        { status: 400 }
      )
    }

    const db = createClient()
    const { data: userData } = await db.auth.getUser()

    if (!userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch enrichment results
    const { data: enrichments, error: enrichError } = await db
      .from('apollo_enrichment_results')
      .select('*')
      .in('id', enrichment_result_ids)
      .eq('client_id', client_id)

    if (enrichError || !enrichments || enrichments.length === 0) {
      return NextResponse.json(
        { error: 'Enrichment results not found' },
        { status: 404 }
      )
    }

    // Sync each enrichment to crm_contacts
    const syncedLeads = []

    for (const enrichment of enrichments) {
      const crmData = {
        client_id,
        company_name: enrichment.company_name,
        industry: enrichment.industry,
        website: enrichment.website,
        hot_score: enrichment.heat_score,  // Map heat_score → hot_score
        status: 'prospect',
        source: 'sales-engine-tavily-discovery',
        contact_info: enrichment.apollo_data?.persons?.[0] || {},
        notes: `Discovered via Dadybox Sales Engine\nPersonalized email generated: ${enrichment.personalization_email?.substring(0, 100)}...`,
        engagement_stage: 'initial',
        last_contacted_at: new Date().toISOString(),
      }

      // Insert into crm_contacts
      const { data: crmContact, error: crmError } = await db
        .from('crm_contacts')
        .insert(crmData)
        .select()
        .single()

      if (!crmError && crmContact) {
        // Update enrichment_result with CRM sync status
        await db
          .from('apollo_enrichment_results')
          .update({
            crm_contact_id: crmContact.id,
            crm_sync_status: 'synced',
            synced_at: new Date().toISOString(),
          })
          .eq('id', enrichment.id)

        syncedLeads.push({
          enrichment_id: enrichment.id,
          crm_contact_id: crmContact.id,
          company: enrichment.company_name,
          status: 'synced',
        })
      } else {
        syncedLeads.push({
          enrichment_id: enrichment.id,
          company: enrichment.company_name,
          status: 'failed',
          error: crmError?.message,
        })
      }
    }

    const successCount = syncedLeads.filter(l => l.status === 'synced').length

    return NextResponse.json({
      success: true,
      synced_count: successCount,
      total_count: syncedLeads.length,
      leads: syncedLeads,
      next_action: `View ${successCount} new prospects in Dadybox CRM (/ws-dadybox/crm/contacts)`,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
