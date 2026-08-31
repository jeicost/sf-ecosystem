// Visuales del Monthly Content System — la parte que el deck manual de la
// agencia tiene y el informe no tenía (feedback del CEO, 31-ago-2026, con el
// deck de Salsa de julio como referencia): cada pilar enseña creatividades
// REALES de la marca («OWN REFERENCES», organizadas por colección) y las
// piezas hero llevan visual. Aquí se construyen las dos cosas:
//
//   a) REFERENCIAS: las imágenes del cliente ya sincronizadas de Drive viven
//      en agent_documents con su descripción por visión — pero los píxeles
//      están en Drive. Se clasifican por pilar (una llamada a Haiku, cacheada
//      en source_metadata.pillar_hint), se descargan, se convierten a
//      miniatura y se re-hospedan en generated-assets para servirlas por el
//      proxy /api/assets. Idempotente: thumb_path también se cachea.
//   b) HERO COVERS: una imagen generada por hero brief (máx 3) por el mismo
//      camino que el Estudio Visual (identidad + pilar en el prompt).
//
// Todo best-effort: un fallo en una imagen nunca tumba el resto, y sin Drive
// conectado el resultado es honesto (referencias vacías), no un error.
//
// CONTRATO (lo pintan el adapter HTML y el PPTX):
//   result_data.visuals = {
//     generated_at, hero_covers: [{brief_index, image_path}],
//     pillar_references: [{pillar_name, items: [{doc_id, thumb_path, collection, caption}]}]
//   }
// Siempre paths del bucket, jamás signed URLs (caducan a los 7 días — el bug
// que ya tenía with_covers en la bandeja).

import { createServiceClient } from '@/lib/supabase-admin'
import { createMessageForClient } from '@/lib/anthropic-client'
import { getClientDriveAccessToken } from '@/lib/drive-sync'
import { extractJson } from '@/lib/generation/extract-json'

const BUCKET = 'generated-assets'
const MAX_REFS_PER_PILLAR = 4
const MAX_DOCS_TO_CLASSIFY = 60

export interface MonthlyVisuals {
  generated_at: string
  hero_covers: Array<{ brief_index: number; image_path: string }>
  pillar_references: Array<{
    pillar_name: string
    items: Array<{ doc_id: string; thumb_path: string; collection: string; caption: string }>
  }>
}

export interface VisualsSummary {
  hero_covers: number
  references: number
  pillars_with_references: number
  skipped: string[]
}

interface ImageDoc {
  id: string
  extracted_text: string | null
  source_metadata: Record<string, any> | null
}

/** La «colección» del deck = la carpeta de Drive, legible. */
function collectionOf(doc: ImageDoc): string {
  const path = String(doc.source_metadata?.path ?? '')
  const parts = path.split('/').filter(Boolean)
  return parts[parts.length - 1] || 'References'
}

/**
 * Clasifica las imágenes del cliente en los pilares activos del informe.
 * Una sola llamada a Haiku con todas las descripciones; el veredicto se
 * cachea en source_metadata.pillar_hint para que el mes siguiente sea gratis
 * (solo se re-clasifica si el hint apunta a un pilar que ya no existe).
 */
async function classifyReferences(
  clientId: string,
  docs: ImageDoc[],
  pillars: Array<{ name: string; promise?: string }>,
  opts: { dryRun?: boolean }
): Promise<Map<string, string>> {
  const admin = createServiceClient()
  const pillarNames = new Set(pillars.map((p) => p.name))
  const assigned = new Map<string, string>()
  const pending: ImageDoc[] = []

  for (const doc of docs) {
    const hint = doc.source_metadata?.pillar_hint
    if (typeof hint === 'string' && pillarNames.has(hint)) assigned.set(doc.id, hint)
    else pending.push(doc)
  }

  if (pending.length) {
    const list = pending
      .slice(0, MAX_DOCS_TO_CLASSIFY)
      .map((d, i) => `${i}. [${collectionOf(d)}] ${String(d.extracted_text ?? '').replace(/\s+/g, ' ').slice(0, 220)}`)
      .join('\n')
    const pillarList = pillars
      .map((p) => `- "${p.name}"${p.promise ? `: ${String(p.promise).slice(0, 140)}` : ''}`)
      .join('\n')
    try {
      const msg = await createMessageForClient(clientId, 'toolkit/monthly-visuals/classify', {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: `These are vision descriptions of a brand's real creatives. Assign each to the ONE content pillar it best illustrates, or null if none fits.

PILLARS:
${pillarList}

CREATIVES:
${list}

Return ONLY JSON: {"assignments": {"<index>": "<exact pillar name or null>"}}`,
          },
        ],
      })
      const text = msg.content.map((b: any) => ('text' in b ? b.text : '')).join('')
      const parsed = extractJson(text) as any
      const assignments = parsed?.assignments ?? {}
      for (const [idx, name] of Object.entries(assignments)) {
        const doc = pending[Number(idx)]
        if (!doc || typeof name !== 'string' || !pillarNames.has(name)) continue
        assigned.set(doc.id, name)
        if (!opts.dryRun) {
          await admin
            .from('agent_documents')
            .update({ source_metadata: { ...(doc.source_metadata ?? {}), pillar_hint: name } })
            .eq('id', doc.id)
        }
      }
    } catch (err) {
      console.warn('monthly-visuals: classification failed, using cached hints only:', err)
    }
  }
  return assigned
}

/** Descarga de Drive → miniatura → generated-assets. Cachea thumb_path. */
async function rehostThumb(
  clientId: string,
  doc: ImageDoc,
  driveToken: string
): Promise<string | null> {
  const admin = createServiceClient()
  const cached = doc.source_metadata?.thumb_path
  if (typeof cached === 'string' && cached) return cached

  const fileId = doc.source_metadata?.google_drive_file_id
  if (!fileId) return null

  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${driveToken}` } }
  )
  if (!res.ok) return null
  let buffer: Buffer = Buffer.from(new Uint8Array(await res.arrayBuffer()))

  // Miniatura con sharp (dependencia de Next). Si no está, el original vale
  // mientras no sea enorme.
  try {
    const sharp = (await import('sharp')).default
    buffer = await sharp(buffer).resize(640, 640, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
  } catch {
    if (buffer.byteLength > 900_000) return null
  }

  const path = `clients/${clientId}/references/${doc.id}.jpg`
  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (error) return null

  await admin
    .from('agent_documents')
    .update({ source_metadata: { ...(doc.source_metadata ?? {}), thumb_path: path } })
    .eq('id', doc.id)
  return path
}

export async function buildMonthlyVisuals(opts: {
  queueId: string
  /** Solo clasificar y reportar el mapeo — sin Drive, sin OpenAI, sin escrituras. */
  dryRun?: boolean
  /** Re-generar hero covers aunque ya existan. */
  force?: boolean
}): Promise<{ summary: VisualsSummary; visuals: MonthlyVisuals | null; mapping?: Record<string, number> }> {
  const admin = createServiceClient()
  const skipped: string[] = []

  const { data: row, error } = await admin
    .from('generation_queue')
    .select('id, client_id, tool_slug, status, result_data')
    .eq('id', opts.queueId)
    .single()
  if (error || !row) throw new Error('Report not found')
  if (row.tool_slug !== 'monthly-content-system') throw new Error('Not a monthly-content-system report')
  if (row.status !== 'completed' || !row.result_data) throw new Error('Report not finished')

  const result = row.result_data as Record<string, any>
  const clientId = row.client_id as string
  const pillars = (Array.isArray(result.pillars) ? result.pillars : [])
    .filter((p: any) => p && typeof p.name === 'string')
    .map((p: any) => ({ name: p.name as string, promise: p.promise as string | undefined }))

  // ── Referencias reales (agent_documents, píxeles en Drive) ────────────────
  const { data: docRows } = await admin
    .from('agent_documents')
    .select('id, extracted_text, source_metadata')
    .eq('client_id', clientId)
    .like('file_mime_type', 'image/%')
    .order('created_at', { ascending: false })
    .limit(120)

  const docs: ImageDoc[] = (docRows ?? []).filter(
    (d: any) => !String(d.source_metadata?.path ?? '').toLowerCase().includes('logo')
  )

  const pillar_references: MonthlyVisuals['pillar_references'] = []
  const mapping: Record<string, number> = {}

  if (docs.length && pillars.length) {
    const assigned = await classifyReferences(clientId, docs, pillars, { dryRun: opts.dryRun })

    let driveToken: string | null = null
    if (!opts.dryRun) {
      const tokenRes = await getClientDriveAccessToken(clientId, admin as any)
      if ('token' in tokenRes) driveToken = tokenRes.token
      else skipped.push(`Drive: ${tokenRes.error} — solo referencias ya re-hospedadas`)
    }

    for (const pillar of pillars) {
      const mine = docs.filter((d) => assigned.get(d.id) === pillar.name).slice(0, MAX_REFS_PER_PILLAR)
      mapping[pillar.name] = mine.length
      if (!mine.length || opts.dryRun) continue
      const items: MonthlyVisuals['pillar_references'][number]['items'] = []
      for (const doc of mine) {
        const cachedThumb = typeof doc.source_metadata?.thumb_path === 'string' ? doc.source_metadata.thumb_path : null
        const thumb = cachedThumb ?? (driveToken ? await rehostThumb(clientId, doc, driveToken).catch(() => null) : null)
        if (!thumb) continue
        items.push({
          doc_id: doc.id,
          thumb_path: thumb,
          collection: collectionOf(doc),
          caption: String(doc.extracted_text ?? '').replace(/\s+/g, ' ').slice(0, 110),
        })
      }
      if (items.length) pillar_references.push({ pillar_name: pillar.name, items })
    }
  } else if (!docs.length) {
    skipped.push('El cliente no tiene imágenes sincronizadas en agent_documents (Drive sync)')
  }

  if (opts.dryRun) {
    return {
      summary: { hero_covers: 0, references: 0, pillars_with_references: 0, skipped },
      visuals: null,
      mapping,
    }
  }

  // ── Hero covers (máx 3, best-effort, cupo mensual respetado) ─────────────
  const hero_covers: MonthlyVisuals['hero_covers'] = []
  const existing: MonthlyVisuals | undefined = result.visuals
  const briefs = Array.isArray(result.hero_briefs) ? result.hero_briefs : []
  try {
    const { generateAndStoreImage } = await import('@/lib/generation/openai-image')
    const { composeBrandImagePrompt } = await import('@/lib/generation/image-studio')
    const { fetchBrandBrain } = await import('@/lib/brand-brain')
    const brain = await fetchBrandBrain(clientId).catch(() => null)

    for (let i = 0; i < Math.min(briefs.length, 3); i++) {
      const prev = existing?.hero_covers?.find((h) => h.brief_index === i)
      if (prev && !opts.force) {
        hero_covers.push(prev)
        continue
      }
      const b = briefs[i] ?? {}
      const shots = (Array.isArray(b.shot_flow) ? b.shot_flow : [])
        .slice(0, 3)
        .map((s: any) => String(s?.action ?? ''))
        .filter(Boolean)
        .join(' · ')
      const pillar = brain?.pillars?.find(
        (pi) => pi.name?.trim().toLowerCase() === String(b.pillar ?? '').trim().toLowerCase()
      )
      const prompt = composeBrandImagePrompt({
        userPrompt: `Hero visual for this content piece. Title: "${String(b.title ?? '')}". Hook: "${String(b.hook ?? '')}". ${shots ? `Key moments: ${shots}.` : ''} Photorealistic, the product is the hero.`,
        visualIdentity: brain?.visualIdentitySummary,
        format: 'wide',
        pillar,
      })
      const stored = await generateAndStoreImage(prompt, clientId, `hero-${opts.queueId.slice(0, 8)}-${i}`, {
        size: '1536x1024',
        pathPrefix: 'monthly-visuals',
        route: 'toolkit/monthly-visuals',
        onExhausted: 'skip',
      }).catch((e) => {
        skipped.push(`hero ${i}: ${e instanceof Error ? e.message : String(e)}`)
        return null
      })
      if (stored?.path) hero_covers.push({ brief_index: i, image_path: stored.path })
      else if (!skipped.some((s) => s.startsWith(`hero ${i}`))) skipped.push(`hero ${i}: sin imagen (cupo o motor)`)
    }
  } catch (err) {
    skipped.push(`hero covers: ${err instanceof Error ? err.message : String(err)}`)
  }

  const visuals: MonthlyVisuals = {
    generated_at: new Date().toISOString(),
    hero_covers,
    pillar_references,
  }

  // Merge sobre el result_data VIVO (releído): materialized_at u otros campos
  // escritos entre medias no se pisan.
  const { data: fresh } = await admin.from('generation_queue').select('result_data').eq('id', opts.queueId).single()
  const freshResult = (fresh?.result_data as Record<string, any>) ?? result
  const { error: upErr } = await admin
    .from('generation_queue')
    .update({ result_data: { ...freshResult, visuals } })
    .eq('id', opts.queueId)
  if (upErr) throw new Error(`No se pudo guardar visuals: ${upErr.message}`)

  return {
    summary: {
      hero_covers: hero_covers.length,
      references: pillar_references.reduce((a, p) => a + p.items.length, 0),
      pillars_with_references: pillar_references.length,
      skipped,
    },
    visuals,
    mapping,
  }
}
