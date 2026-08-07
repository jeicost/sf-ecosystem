// Relectura completa del conocimiento ya sincronizado contra el Brand Brain.
//
// Por qué existe (2026-08-07): la síntesis de Drive solo se dispara con los
// documentos que han CAMBIADO desde el último sync (`changedDocs` en
// lib/drive-sync.ts). Es lo correcto para el cron — no tiene sentido pagar una
// llamada a Sonnet por documentos que ya se leyeron — pero deja un agujero:
// si el sintetizador mejora, o si un hueco del Brain estaba vacío por un fallo
// nuestro, no hay forma de volver a leer lo que ya está en la base. La única
// salida era tocar los ficheros en Drive para que cambiara su hash.
//
// Caso real: Salsa tenía 167.000 caracteres sincronizados (brand book, guía de
// voz, menú maestro, estrategia de lanzamiento) y 17 de los 25 huecos del
// Brand Brain vacíos, porque la síntesis que los leyó en su día no sabía que
// esos huecos existían. Sin esta función, esa información se quedaba
// congelada para siempre.
//
// Igual que el sync: NUNCA aplica nada. Deja una propuesta pendiente de
// confirmación humana en la bandeja de /brand-brain.

import { adminClient } from '@/lib/supabase'
import { synthesizeDriveKnowledge, type DriveSynthesisDocument } from './drive-synthesis'

/** Tope de caracteres por documento que se manda al sintetizador. */
const PER_DOC_CHARS = 12000
/** Tope total, para que un cliente con mucho material no dispare el coste. */
const TOTAL_CHARS = 90000
/** Mínimo para considerar que un documento aporta algo. */
const MIN_DOC_CHARS = 200

export interface RelearnResult {
  documentsRead: number
  charactersRead: number
  changes: number
  contradictions: number
  proposalId: string | null
  /** Motivo por el que no se creó propuesta, para poder decírselo al usuario. */
  reason?: string
}

/**
 * Vuelve a leer TODO el conocimiento ya guardado del cliente y propone qué
 * debería aprender el Brand Brain, con el catálogo de huecos vacíos delante.
 */
export async function relearnBrainFromKnowledge(clientId: string): Promise<RelearnResult> {
  const admin = adminClient()

  const { data: docs, error } = await admin
    .from('agent_documents')
    .select('id, title, extracted_text, analysis_summary, source_metadata, project_id')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw new Error(`Could not read the stored documents: ${error.message}`)

  const usable = (docs ?? []).filter((d) => (d.extracted_text ?? '').trim().length >= MIN_DOC_CHARS)
  if (!usable.length) {
    return {
      documentsRead: 0,
      charactersRead: 0,
      changes: 0,
      contradictions: 0,
      proposalId: null,
      reason: 'There are no documents with readable text yet. Connect Google Drive or upload a document first.',
    }
  }

  // Los más largos primero: un brand book llena más huecos que una nota suelta,
  // y el presupuesto total se reparte antes de que se agote.
  const ordered = [...usable].sort(
    (a, b) => (b.extracted_text ?? '').length - (a.extracted_text ?? '').length
  )

  const documents: DriveSynthesisDocument[] = []
  let used = 0
  for (const doc of ordered) {
    if (used >= TOTAL_CHARS) break
    const text = (doc.extracted_text ?? '').trim()
    const excerpt = text.slice(0, Math.min(PER_DOC_CHARS, TOTAL_CHARS - used))
    const meta = (doc.source_metadata ?? {}) as { path?: string }
    documents.push({
      documentId: doc.id,
      path: meta.path || doc.title || 'document',
      title: doc.title || 'Untitled',
      summary: doc.analysis_summary || '',
      excerpt,
    })
    used += excerpt.length
  }

  const synthesis = await synthesizeDriveKnowledge({
    clientId,
    folderName: 'everything already stored for this client',
    documents,
    relearn: true,
  })

  if (!synthesis || (!synthesis.changes.length && !synthesis.contradictions.length)) {
    return {
      documentsRead: documents.length,
      charactersRead: used,
      changes: 0,
      contradictions: 0,
      proposalId: null,
      reason: 'Everything these documents say is already in the Brand Brain.',
    }
  }

  let proposalId: string | null = null
  if (synthesis.changes.length > 0) {
    const projectId = ordered.find((d) => d.project_id)?.project_id ?? null
    const { data: inserted, error: proposalError } = await admin
      .from('brain_change_proposals')
      .insert({
        client_id: clientId,
        project_id: projectId,
        origin: 'drive_sync',
        summary: `Full re-read of ${documents.length} stored document${documents.length > 1 ? 's' : ''}`,
        changes: synthesis.changes,
        source_document_ids: documents.map((d) => d.documentId),
      })
      .select('id')
      .single()

    if (proposalError) throw new Error(`Could not save the proposal: ${proposalError.message}`)
    proposalId = inserted?.id ?? null
  }

  // Mismo dedup que el sync: una contradicción abierta sobre un campo ya está
  // señalada hasta que alguien la resuelva.
  let contradictionsCreated = 0
  for (const c of synthesis.contradictions) {
    const { data: alreadyOpen } = await admin
      .from('brain_contradictions')
      .select('id')
      .eq('client_id', clientId)
      .eq('field_path', c.field_path)
      .eq('status', 'open')
      .limit(1)
    if (alreadyOpen?.length) continue

    const { error: contradictionError } = await admin.from('brain_contradictions').insert({
      client_id: clientId,
      field_path: c.field_path,
      existing_value_excerpt: c.existing_value_excerpt ?? null,
      proposed_value_excerpt: c.proposed_value_excerpt ?? null,
      note: c.note,
      source_type: 'drive_sync',
    })
    if (!contradictionError) contradictionsCreated += 1
  }

  return {
    documentsRead: documents.length,
    charactersRead: used,
    changes: synthesis.changes.length,
    contradictions: contradictionsCreated,
    proposalId,
  }
}
