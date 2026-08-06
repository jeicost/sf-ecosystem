// Executors del Brain con dos modos (P6 Fase 2, 2026-07-29):
//   apply   → escribe en BD (la lógica extraída de lib/onboarding/tools.ts)
//   propose → devuelve el patch SIN escribir (lo usan el chat "Cuéntale a
//             MIRA" y el wizard de alta: nada cambia hasta confirmar)
// El onboarding actual sigue llamando a executeOnboardingTool sin cambios.

import { adminClient } from '@/lib/supabase'

export type BrainChangeTarget = 'brand_profile' | 'project_memory' | 'content_pillar' | 'brand_reference'

export interface BrainChange {
  target: BrainChangeTarget
  op: 'merge' | 'add'
  payload: Record<string, any>
}

export function deepMerge(base: Record<string, any>, patch: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = { ...base }
  for (const [key, value] of Object.entries(patch)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      result[key] &&
      typeof result[key] === 'object' &&
      !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], value)
    } else {
      result[key] = value
    }
  }
  return result
}

export interface BrainChangeProvenance {
  sourceType: 'chat' | 'drive_sync' | 'document_analysis' | 'manual' | 'lint' | 'onboarding'
  sourceRef?: string
}

/** Aplica UN cambio confirmado. Lanza Error con mensaje legible si falla. */
export async function applyBrainChange(
  clientId: string,
  change: BrainChange,
  projectId?: string | null,
  provenance?: BrainChangeProvenance
): Promise<string> {
  const db = adminClient()

  switch (change.target) {
    case 'brand_profile': {
      const { name, mission, description, proposition, values, tone_of_voice, brand_data } = change.payload
      const { data: current, error: fetchError } = await db
        .from('brand_profiles')
        .select('id, brand_data')
        .eq('client_id', clientId)
        .maybeSingle()
      if (fetchError) throw new Error(`Could not read brand_data: ${fetchError.message}`)
      if (!current) throw new Error('This client has no brand_profiles row yet')

      const update: Record<string, any> = { updated_at: new Date().toISOString() }
      if (name !== undefined) update.name = name
      if (mission !== undefined) update.mission = mission
      if (description !== undefined) update.description = description
      if (proposition !== undefined) update.proposition = proposition
      if (Array.isArray(values)) update.values = values
      if (tone_of_voice !== undefined) update.tone_of_voice = tone_of_voice
      if (brand_data && typeof brand_data === 'object') {
        update.brand_data = deepMerge((current.brand_data as Record<string, any>) || {}, brand_data)
      }
      const { error } = await db.from('brand_profiles').update(update).eq('id', current.id)
      if (error) throw new Error(`Could not update the brain: ${error.message}`)
      const saved = Object.keys(update).filter((k) => k !== 'updated_at')

      // Provenance (Fase 2): de qué SECCIÓN vino cada cambio -- best-effort,
      // un fallo aquí nunca debe deshacer el cambio real ya aplicado.
      if (provenance) {
        const touchedFieldPaths = saved.filter((k) => k !== 'brand_data')
        if (brand_data && typeof brand_data === 'object') touchedFieldPaths.push(...Object.keys(brand_data))
        if (touchedFieldPaths.length) {
          try {
            await db.from('brain_field_provenance').upsert(
              touchedFieldPaths.map((fieldPath) => ({
                client_id: clientId,
                project_id: projectId ?? null,
                field_path: fieldPath,
                source_type: provenance.sourceType,
                source_ref: provenance.sourceRef ?? null,
                updated_at: new Date().toISOString(),
              })),
              { onConflict: 'client_id,field_path' }
            )
          } catch (provenanceError) {
            console.error('applyBrainChange: failed to record provenance:', provenanceError)
          }
        }
      }

      return `Brain updated: ${saved.join(', ')}`
    }

    case 'content_pillar': {
      const { pillar_name, description, themes, examples } = change.payload
      if (!pillar_name) throw new Error('The pillar needs a pillar_name')
      const row = {
        client_id: clientId,
        pillar_name,
        description: description ?? null,
        themes: Array.isArray(themes) ? themes : [],
        examples: Array.isArray(examples) ? examples : [],
      }
      let { error } = await db.from('content_pillars').upsert(row, { onConflict: 'client_id,pillar_name' })
      // Fallback si la constraint única (client_id,pillar_name) todavía no
      // existe en producción (ver migración 0062, nota sobre content_pillars):
      // el upsert falla con 42P10 en vez de hacer merge — degrada a insert
      // (mismo comportamiento que antes) en vez de romper la creación de pilares.
      if (error?.code === '42P10') {
        ;({ error } = await db.from('content_pillars').insert(row))
      }
      if (error) throw new Error(`Could not save the pillar: ${error.message}`)
      return `Pillar created: ${pillar_name}`
    }

    case 'brand_reference': {
      const { url, title, pillar, why_worked, what_to_repeat } = change.payload
      if (!url || !title) throw new Error('The reference needs url and title')
      const { error } = await db
        .from('brand_references')
        .upsert({ client_id: clientId, url, title, pillar: pillar ?? null, why_worked: why_worked ?? null, what_to_repeat: what_to_repeat ?? null }, { onConflict: 'client_id,url' })
      if (error) throw new Error(`Could not save the reference: ${error.message}`)
      return `Reference saved: ${title}`
    }

    case 'project_memory': {
      const { title, category, summary, full_content, tags } = change.payload
      if (!title || !summary) throw new Error('The memory needs title and summary')
      const VALID = ['insight', 'decision', 'action', 'metric', 'content']
      const { error } = await db.from('project_memory').insert({
        client_id: clientId,
        project_id: projectId ?? null,
        title,
        category: VALID.includes(category) ? category : 'insight',
        summary,
        full_content: full_content ?? null,
        tags: Array.isArray(tags) ? tags : [],
        source_department: 'brain-chat',
      })
      if (error) throw new Error(`Could not save the memory: ${error.message}`)
      return `Memory saved: ${title}`
    }

    default:
      throw new Error(`Unknown target: ${(change as BrainChange).target}`)
  }
}

/** Aplica una lista de cambios; devuelve los resúmenes. Falla al primer error. */
export async function applyBrainChanges(
  clientId: string,
  changes: BrainChange[],
  projectId?: string | null,
  provenance?: BrainChangeProvenance
): Promise<string[]> {
  const results: string[] = []
  for (const change of changes) {
    results.push(await applyBrainChange(clientId, change, projectId, provenance))
  }
  return results
}
