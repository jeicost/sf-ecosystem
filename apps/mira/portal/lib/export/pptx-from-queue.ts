// Fila de generation_queue → PPTX. Único sitio que sabe qué presentación le
// corresponde a cada tipo de informe y cómo construirla.
//
// Historia: "Abrir en Google Slides" solo funcionaba para dos slugs del
// toolkit (monthly-content-system y brand-book) porque export-slides tenía
// la decisión cableada dentro; los decks del Centro de Documentos (doc-deck)
// y el resto de informes del toolkit generaban PPTX por otros caminos
// (app/api/toolkit/export?format=pptx y app/api/export/canva) cada uno con su
// propia copia de "result → slides → generateDeckPptx". El CEO lo vivió como
// "el botón no funciona ni aparece". Aquí se junta la resolución para que
// cualquier ruta (Slides, Canva, descarga) pregunte lo mismo: ¿esta fila
// tiene PPTX? ¿cuál? — y lo construya sin duplicar la generación.
//
// Los generadores viven donde vivían (monthly-pptx, voice-guide-pptx,
// templates/deck-pptx); esto solo decide y llama.

import type { BrandTypographyInput } from './brand-typography'
import { getAdapter } from './adapters'
import type { Section } from './editorial-template'
import { generateDeckPptx } from './templates/deck-pptx'
import type { DeckSlide } from './templates/deck-template'
import { buildMonthlyDeckPptx } from './monthly-pptx'
import { buildVoiceGuidePptx } from './voice-guide-pptx'
import { verifyMonthlyDeck, type DeckVerification } from './verify-deck'
import { normalizeDocMode, type DocMode } from './doc-theme'
import { TOOLKIT_TOOLS } from '@/lib/toolkit-tools'

export type PptxArtifact = 'monthly-deck' | 'voice-guide' | 'deck'

export interface QueueRowForPptx {
  tool_slug: string
  result_data: unknown
  // Solo para leer `_theme` (el tema con el que se generó el documento).
  input_data?: unknown
}

export interface PptxBrand {
  clientName: string
  primaryColor: string
  logoUrl: string | null
  /** brand_data.visual_identity.typography tal cual; los motores la resuelven. */
  typography?: BrandTypographyInput
}

export type PptxResolution =
  | { available: true; artifact: PptxArtifact; label: string }
  | { available: false; reason: string }

export type PptxBuildResult =
  | {
      ok: true
      artifact: PptxArtifact
      buffer: Buffer
      fileName: string
      verification: DeckVerification | null
    }
  | { ok: false; status: number; error: string; verification?: DeckVerification }

// Documentos del Centro que NO son presentaciones: se explica al usuario por
// qué no hay Slides en vez de fallar con un 400 críptico.
const NON_DECK_DOC_LABEL: Record<string, string> = {
  'doc-playbook': 'playbook',
  'doc-results': 'results report',
  'doc-onepager': 'one-pager',
}

function asRecord(v: unknown): Record<string, any> {
  return v && typeof v === 'object' ? (v as Record<string, any>) : {}
}

/**
 * Decide qué PPTX le corresponde a la fila (sin construir nada — sirve para
 * que la UI sepa si pintar el botón antes de que el usuario haga clic).
 * `requested` fuerza un artefacto concreto (p.ej. la vista "Presentación" de
 * un brand-book quiere el deck, no el Voice Guide de una página).
 */
export function resolvePptxArtifact(
  row: Pick<QueueRowForPptx, 'tool_slug' | 'result_data'>,
  requested?: string | null
): PptxResolution {
  const slug = row.tool_slug
  const result = asRecord(row.result_data)

  if (slug === 'monthly-content-system') {
    // El deck mensual ES la presentación de este informe; aunque pidan
    // "deck" se sirve el mensual, que es el rico (F4).
    if (requested === 'voice-guide') {
      return { available: false, reason: 'The Voice Guide only exists in brand-book reports' }
    }
    return { available: true, artifact: 'monthly-deck', label: 'Monthly content deck' }
  }

  if (requested === 'monthly-deck') {
    return { available: false, reason: 'monthly-deck is only available for monthly-content-system reports' }
  }

  if (slug === 'brand-book') {
    if (requested === 'deck') {
      return { available: true, artifact: 'deck', label: 'Brand book deck' }
    }
    if (result.voice_guide_onepager) {
      return { available: true, artifact: 'voice-guide', label: 'Voice Guide one-pager' }
    }
    if (requested === 'voice-guide') {
      return { available: false, reason: 'This report has no Voice Guide' }
    }
    return { available: true, artifact: 'deck', label: 'Brand book deck' }
  }

  if (requested === 'voice-guide') {
    return { available: false, reason: 'The Voice Guide only exists in brand-book reports' }
  }

  if (slug === 'doc-deck') {
    if (!Array.isArray(result.slides) || result.slides.length === 0) {
      return { available: false, reason: 'This deck has no slides yet' }
    }
    return { available: true, artifact: 'deck', label: 'Presentation deck' }
  }

  if (slug.startsWith('doc-')) {
    const what = NON_DECK_DOC_LABEL[slug] || 'document'
    return {
      available: false,
      reason: `Only presentation decks can be opened in Google Slides — this is a ${what}.`,
    }
  }

  // Resto del toolkit: el mismo deck que la vista "Presentación" del informe
  // (adaptador → secciones → slides). Cualquier informe completado lo tiene.
  return { available: true, artifact: 'deck', label: 'Report deck' }
}

// Convierte las secciones editoriales en slides para los informes del toolkit
// (misma regla que la vista template=deck de app/api/toolkit/export/route.ts,
// que conserva su copia hasta que se apunte aquí — no cambiar una sin la otra).
export function sectionsToSlides(title: string, subtitle: string, sections: Section[]): DeckSlide[] {
  const slides: DeckSlide[] = [{ layout: 'cover', title, subtitle }]
  for (const s of sections) {
    if (s.stats?.length) {
      slides.push({ layout: 'stats', title: s.title, stats: s.stats })
    } else if (s.cards?.length) {
      slides.push({
        layout: 'content',
        title: s.title,
        bullets: s.cards.slice(0, 4).map((c) => `${c.title}`),
      })
    } else if (s.listItems?.length) {
      slides.push({ layout: 'content', title: s.title, bullets: s.listItems.slice(0, 4).map(stripHtml) })
    } else if (s.phases?.length) {
      slides.push({ layout: 'content', title: s.title, bullets: s.phases.slice(0, 4).map((p) => p.title) })
    } else {
      slides.push({ layout: 'section', title: s.title, subtitle: s.subtitle })
    }
  }
  slides.push({ layout: 'closing', title, subtitle: 'Ready to execute' })
  return slides
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').slice(0, 140)
}

/**
 * Construye el PPTX de la fila. El deck mensual se verifica estructuralmente
 * antes de devolverse (verify-deck): un deck a medias no llega al cliente.
 * `mode` (tema del deck) manda sobre el `_theme` persistido al generar.
 */
export async function buildPptxFromQueueRow(params: {
  row: QueueRowForPptx
  brand: PptxBrand
  requested?: string | null
  mode?: DocMode | null
}): Promise<PptxBuildResult> {
  const { row, brand } = params
  const resolution = resolvePptxArtifact(row, params.requested)
  if (!resolution.available) {
    return { ok: false, status: 400, error: resolution.reason }
  }

  const result = asRecord(row.result_data)
  const dateStamp = new Date().toISOString().split('T')[0]

  if (resolution.artifact === 'monthly-deck') {
    const buffer = await buildMonthlyDeckPptx({
      brandName: brand.clientName,
      primaryColor: brand.primaryColor,
      result,
    })
    const verification = await verifyMonthlyDeck(buffer, {
      captions: Array.isArray(result.captions) ? result.captions.length : 0,
      pillars: Array.isArray(result.pillars) ? result.pillars.length : 0,
    })
    if (!verification.ok) {
      console.error('Monthly deck failed verification:', verification.issues)
      return {
        ok: false,
        status: 500,
        error: `The deck failed its structural check: ${verification.issues.join(' · ')}`,
        verification,
      }
    }
    return {
      ok: true,
      artifact: 'monthly-deck',
      buffer,
      fileName: `Sistema de Contenidos — ${result.month_label || result.month || dateStamp}`,
      verification,
    }
  }

  if (resolution.artifact === 'voice-guide') {
    const buffer = await buildVoiceGuidePptx({
      brandName: brand.clientName,
      primaryColor: brand.primaryColor,
      typography: brand.typography,
      guide: result.voice_guide_onepager,
    })
    return {
      ok: true,
      artifact: 'voice-guide',
      buffer,
      fileName: `Voice Guide — ${brand.clientName}`,
      verification: null,
    }
  }

  // 'deck': doc-deck trae sus slides; el toolkit las deriva del adaptador.
  const tool = TOOLKIT_TOOLS.find((t) => t.slug === row.tool_slug)
  let title: string
  let subtitle: string
  let slides: DeckSlide[]
  if (row.tool_slug === 'doc-deck') {
    title = (result.title as string) || 'Presentation'
    subtitle = (result.subtitle as string) || brand.clientName
    slides = result.slides as DeckSlide[]
  } else {
    title = tool?.name || row.tool_slug
    subtitle = brand.clientName
    slides = sectionsToSlides(title, subtitle, getAdapter(row.tool_slug)(result))
  }
  const mode = params.mode ?? normalizeDocMode(asRecord(row.input_data)['_theme'])
  const buffer = await generateDeckPptx({
    ...(mode ? { mode } : {}),
    brand,
    title,
    subtitle,
    slides,
  })
  return {
    ok: true,
    artifact: 'deck',
    buffer,
    fileName: `${title} — ${brand.clientName}`,
    verification: null,
  }
}
