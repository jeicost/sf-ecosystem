// Resolución de imágenes del deck mensual: paths del bucket → data URIs.
//
// El visor web del monthly enseña las creatividades reales (result.visuals,
// generadas por lib/business-reports/monthly-visuals.ts) por el proxy
// /api/assets — pero el PPTX se construye en servidor y pptxgenjs necesita los
// bytes. Este módulo firma cada path contra generated-assets y lo baja a data
// URI, igual que hace resolveSlideImageData en templates/deck-pptx.ts (que se
// queda con su copia privada a propósito: es un template estable y compartir
// helper habría significado tocarlo).
//
// Todo es best-effort: una imagen que falla se omite, jamás rompe el deck.

import { adminClient } from '@/lib/supabase'
import type { MonthlyVisuals } from '@/lib/business-reports/monthly-visuals'

const ASSETS_BUCKET = 'generated-assets'
const MAX_COVERS = 3
const MAX_REFS_PER_PILLAR = 4

export interface MonthlyDeckImages {
  heroCovers: Array<{ briefIndex: number; data: string }>
  pillarReferences: Array<{ pillarName: string; items: Array<{ data: string; caption: string }> }>
}

/** Fetch de una URL de imagen → data URI de pptxgenjs, o null si falla. */
export async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') || 'image/png'
    const mime = contentType.split(';')[0].trim() || 'image/png'
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length === 0) return null
    return `${mime};base64,${buf.toString('base64')}`
  } catch {
    return null
  }
}

async function resolveAssetDataUri(path: string): Promise<string | null> {
  if (!path.trim()) return null
  try {
    const { data } = await adminClient().storage.from(ASSETS_BUCKET).createSignedUrl(path, 600)
    return data?.signedUrl ? fetchImageAsDataUri(data.signedUrl) : null
  } catch {
    return null
  }
}

/** clients.logo_url → data URI para la portada del deck. */
export async function resolveLogoDataUri(logoUrl: string | null | undefined): Promise<string | null> {
  if (typeof logoUrl !== 'string' || !logoUrl.trim()) return null
  return fetchImageAsDataUri(logoUrl)
}

/**
 * result_data.visuals → imágenes embebibles. Devuelve undefined si el informe
 * no tiene visuales generados (el deck sale como hasta ahora, sin sección).
 */
export async function resolveMonthlyDeckImages(
  result: Record<string, unknown>
): Promise<MonthlyDeckImages | undefined> {
  const visuals = result?.visuals as Partial<MonthlyVisuals> | undefined
  if (!visuals || typeof visuals !== 'object') return undefined

  const coverSpecs = (Array.isArray(visuals.hero_covers) ? visuals.hero_covers : [])
    .filter((h) => typeof h?.image_path === 'string')
    .slice(0, MAX_COVERS)
  const refSpecs = (Array.isArray(visuals.pillar_references) ? visuals.pillar_references : [])
    .filter((p) => typeof p?.pillar_name === 'string' && Array.isArray(p?.items))

  if (!coverSpecs.length && !refSpecs.length) return undefined

  const [covers, refs] = await Promise.all([
    Promise.all(
      coverSpecs.map(async (h) => ({
        briefIndex: Number(h.brief_index) || 0,
        data: await resolveAssetDataUri(h.image_path),
      }))
    ),
    Promise.all(
      refSpecs.map(async (p) => ({
        pillarName: p.pillar_name as string,
        items: (
          await Promise.all(
            (p.items as Array<{ thumb_path?: string; caption?: string }>)
              .filter((it) => typeof it?.thumb_path === 'string')
              .slice(0, MAX_REFS_PER_PILLAR)
              .map(async (it) => ({
                data: await resolveAssetDataUri(it.thumb_path as string),
                caption: typeof it.caption === 'string' ? it.caption : '',
              }))
          )
        ).filter((it): it is { data: string; caption: string } => Boolean(it.data)),
      }))
    ),
  ])

  const images: MonthlyDeckImages = {
    heroCovers: covers.filter((c): c is { briefIndex: number; data: string } => Boolean(c.data)),
    pillarReferences: refs.filter((p) => p.items.length > 0),
  }
  if (!images.heroCovers.length && !images.pillarReferences.length) return undefined
  return images
}
