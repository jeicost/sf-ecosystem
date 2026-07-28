import { normalizeVocab, type BrandData } from '@/lib/brand-data'

// Semáforo de completitud del Brand Brain por reporte (Business Reports).
// Filosofía del playbook: "Never block. Build with what exists." — el semáforo
// INFORMA de la calidad esperable y enlaza a completar, pero SIEMPRE se puede
// generar; los huecos salen como open items numerados en el propio informe.

export type ReadinessLevel = 'green' | 'amber' | 'red'

export interface ReadinessItem {
  key: string
  label: string
  level: ReadinessLevel
  /** Tab del Brand Brain donde se completa (deep-link ?tab=) */
  brainTab: string
}

export interface ReportReadinessResult {
  overall: ReadinessLevel
  items: ReadinessItem[]
}

interface Requirement {
  key: string
  label: string
  brainTab: string
  /** required → rojo si falta; recommended → ámbar si falta */
  weight: 'required' | 'recommended'
  check: (brand: BrandData, pillars: Array<{ name: string }>) => boolean
}

const has = (v: unknown): boolean =>
  typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : !!v

const COMMON_VOICE: Requirement[] = [
  { key: 'tone', label: 'Tono de voz', brainTab: 'voice_visual', weight: 'required', check: (b) => has(b.tone_and_voice && Object.values(b.tone_and_voice).some((v) => has(v))) },
  { key: 'golden_rule', label: 'Regla de oro de la voz', brainTab: 'voice_visual', weight: 'recommended', check: (b) => has(b.tone_and_voice?.golden_rule) },
]

export const REPORT_REQUIREMENTS: Record<string, Requirement[]> = {
  'brand-book': [
    { key: 'mission', label: 'Misión / identidad', brainTab: 'brand_identity', weight: 'required', check: (b) => has(b.identity?.mission) || has(b.identity?.name) },
    ...COMMON_VOICE,
    { key: 'primary_color', label: 'Color primario', brainTab: 'voice_visual', weight: 'required', check: (b) => has(b.visual_identity?.colors?.primary) },
    { key: 'logo', label: 'Logo subido', brainTab: 'voice_visual', weight: 'required', check: (b) => has(b.visual_identity?.logo?.primary_url) },
    { key: 'vocab', label: 'Decimos / nunca decimos (con porqué)', brainTab: 'voice_visual', weight: 'recommended', check: (b) => normalizeVocab(b.voice_vocabulary?.do).length > 0 && normalizeVocab(b.voice_vocabulary?.dont).length > 0 },
    { key: 'banned', label: 'Frases prohibidas', brainTab: 'voice_visual', weight: 'recommended', check: (b) => has(b.banned_phrases) },
    { key: 'typography', label: 'Tipografías', brainTab: 'voice_visual', weight: 'recommended', check: (b) => has(b.visual_identity?.typography && Object.values(b.visual_identity.typography).some((v) => has(v))) },
    { key: 'imagery', label: 'Estilo de imagen', brainTab: 'voice_visual', weight: 'recommended', check: (b) => has(b.visual_identity?.imagery_style) },
    { key: 'ritual', label: 'Ritual firma', brainTab: 'brand_identity', weight: 'recommended', check: (b) => has(b.identity?.signature_ritual) },
    { key: 'languages', label: 'Idiomas (manual/captions)', brainTab: 'voice_visual', weight: 'recommended', check: (b) => has(b.languages?.manual) || has(b.languages?.captions) },
    { key: 'constraints', label: 'Restricciones y reglas', brainTab: 'business_ops', weight: 'recommended', check: (b) => has(b.constraints && Object.values(b.constraints).some((v) => has(v))) },
  ],
  'monthly-content-system': [
    { key: 'pillars', label: 'Al menos 1 pilar de contenido', brainTab: 'content_strategy', weight: 'required', check: (_b, pillars) => pillars.length > 0 },
    ...COMMON_VOICE,
    { key: 'audiences', label: 'Audiencias', brainTab: 'audience_market', weight: 'required', check: (b) => has(b.audiences) },
    { key: 'hero_items', label: 'Hero items con precio', brainTab: 'business_ops', weight: 'recommended', check: (b) => has(b.offer?.hero_items) },
    { key: 'promos', label: 'Mecánicas de promo', brainTab: 'business_ops', weight: 'recommended', check: (b) => has(b.offer?.promo_mechanics) },
    { key: 'captions_lang', label: 'Idioma de captions', brainTab: 'voice_visual', weight: 'recommended', check: (b) => has(b.languages?.captions) },
    { key: 'channels', label: 'Canales con trabajo asignado', brainTab: 'business_ops', weight: 'recommended', check: (b) => has(b.channels) },
  ],
  'action-plan': [
    { key: 'mission', label: 'Misión', brainTab: 'brand_identity', weight: 'required', check: (b) => has(b.identity?.mission) },
    { key: 'gtm', label: 'Go-to-market o canales', brainTab: 'business_ops', weight: 'recommended', check: (b) => has(b.go_to_market) || has(b.channels) },
    { key: 'model', label: 'Modelo de negocio', brainTab: 'business_ops', weight: 'recommended', check: (b) => has(b.business_model) },
    { key: 'audiences', label: 'Audiencias', brainTab: 'audience_market', weight: 'recommended', check: (b) => has(b.audiences) },
  ],
  'competitive-analysis': [
    { key: 'positioning', label: 'Propuesta de valor o posicionamiento', brainTab: 'brand_identity', weight: 'required', check: (b) => has(b.value_proposition) || has(b.competitive_positioning) },
  ],
  'seo-audit': [
    { key: 'identity', label: 'Identidad básica', brainTab: 'brand_identity', weight: 'recommended', check: (b) => has(b.identity?.name) },
  ],
  'marketing-audit': [
    { key: 'identity', label: 'Identidad básica', brainTab: 'brand_identity', weight: 'recommended', check: (b) => has(b.identity?.name) },
    { key: 'audiences', label: 'Audiencias', brainTab: 'audience_market', weight: 'recommended', check: (b) => has(b.audiences) },
  ],
  'brand-briefing': [
    { key: 'identity', label: 'Identidad básica (se enriquecerá con el informe)', brainTab: 'brand_identity', weight: 'recommended', check: (b) => has(b.identity?.name) },
  ],
  'investor-deck': [
    { key: 'model', label: 'Modelo de negocio', brainTab: 'business_ops', weight: 'recommended', check: (b) => has(b.business_model) },
    { key: 'positioning', label: 'Propuesta de valor', brainTab: 'brand_identity', weight: 'recommended', check: (b) => has(b.value_proposition) },
  ],
}

export function evaluateReadiness(
  toolSlug: string,
  brand: BrandData,
  pillars: Array<{ name: string }>
): ReportReadinessResult {
  const reqs = REPORT_REQUIREMENTS[toolSlug] ?? []
  const items: ReadinessItem[] = reqs.map((r) => {
    const ok = (() => {
      try { return r.check(brand, pillars) } catch { return false }
    })()
    return {
      key: r.key,
      label: r.label,
      level: ok ? 'green' : r.weight === 'required' ? 'red' : 'amber',
      brainTab: r.brainTab,
    }
  })
  const overall: ReadinessLevel = items.some((i) => i.level === 'red')
    ? 'red'
    : items.some((i) => i.level === 'amber')
      ? 'amber'
      : 'green'
  return { overall, items }
}
