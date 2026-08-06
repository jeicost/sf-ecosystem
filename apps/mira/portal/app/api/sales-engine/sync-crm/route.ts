import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { resolveRequestClient } from '@/lib/resolve-client'
import { promoteLeadToCrm } from '@/lib/comercial/promote-lead'

interface SyncRequest {
  client_id: string
  enrichment_result_ids: string[]
}

interface ApolloPerson {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  title?: string | null
  linkedin_url?: string | null
  geography?: string | null
}

/**
 * Sales Engine CRM Sync (Fase C).
 *
 * Reescrito sobre el módulo canónico del puente: cada enrichment se materializa
 * como fila de staging en `leads` y se promueve con promoteLeadToCrm()
 * (lib/comercial/promote-lead.ts) — un ÚNICO camino escribe en crm_contacts,
 * con el mismo mapeo tenant (client_workspaces) y la misma dedup.
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

    // Auth de sesión + tenant (patrón Fase A) — antes esta ruta era anon
    const resolved = await resolveRequestClient(client_id)
    if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status })
    const clientId = resolved.clientId

    const db = adminClient()

    // Fetch enrichment results — scoped al cliente validado
    const { data: enrichments, error: enrichError } = await db
      .from('apollo_enrichment_results')
      .select('*')
      .in('id', enrichment_result_ids)
      .eq('client_id', clientId)

    if (enrichError || !enrichments || enrichments.length === 0) {
      return NextResponse.json(
        { error: 'Enrichment results not found' },
        { status: 404 }
      )
    }

    const syncedLeads = []

    for (const enrichment of enrichments) {
      const person: ApolloPerson = enrichment.apollo_data?.persons?.[0] ?? {}

      // 1. Staging: upsert en `leads` (mismo conflict target que el discovery Tavily)
      const { data: stagedLead, error: stageError } = await db
        .from('leads')
        .upsert(
          {
            client_id: clientId,
            first_name: person.first_name ?? null,
            last_name: person.last_name ?? null,
            title: person.title ?? null,
            email: person.email ?? null,
            linkedin_url: person.linkedin_url ?? null,
            company_name: enrichment.company_name,
            company_website: enrichment.website ?? null,
            industry: enrichment.industry ?? null,
            geography: person.geography ?? null,
            stage: 'prospected',
            hot_score: enrichment.heat_score ?? 0,
            source: 'sales_engine_enrich',
          },
          { onConflict: 'client_id,company_name', ignoreDuplicates: false }
        )
        .select('id')
        .single()

      if (stageError || !stagedLead) {
        syncedLeads.push({
          enrichment_id: enrichment.id,
          company: enrichment.company_name,
          status: 'failed',
          error: stageError?.message ?? 'The staging lead could not be created',
        })
        continue
      }

      // 2. Promoción canónica leads → crm_contacts
      const promo = await promoteLeadToCrm(db, stagedLead.id, clientId)

      if (promo.ok) {
        await db
          .from('apollo_enrichment_results')
          .update({
            crm_contact_id: promo.crmContactId,
            crm_sync_status: 'synced',
            synced_at: new Date().toISOString(),
          })
          .eq('id', enrichment.id)

        syncedLeads.push({
          enrichment_id: enrichment.id,
          crm_contact_id: promo.crmContactId,
          company: enrichment.company_name,
          status: 'synced',
        })
      } else {
        syncedLeads.push({
          enrichment_id: enrichment.id,
          company: enrichment.company_name,
          status: 'failed',
          error: promo.error,
        })
      }
    }

    const successCount = syncedLeads.filter(l => l.status === 'synced').length

    return NextResponse.json({
      success: true,
      synced_count: successCount,
      total_count: syncedLeads.length,
      leads: syncedLeads,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
