// Tipo CANÓNICO de brand_profiles.brand_data — compartido por el editor, el
// formateador de prompts, el onboarding y los Business Reports. Antes el shape
// vivía duplicado (interface local del editor + prosa en onboarding/tools.ts).
//
// Ampliado 2026-07-28 con el BRAND_MEMORY_TEMPLATE del método del CEO
// (Brand_Content_System_GPT): golden rule, vocabulario con porqué, oferta con
// precios reales, idiomas, canales con "job", restricciones y open questions.
// Todo tolerante a datos legacy (jsonb sin migración).

export interface VocabEntry {
  phrase: string
  /** El porqué es la enseñanza; la frase es solo el ejemplo. */
  why?: string
}

export interface BrandDataOffer {
  /** Máx 3 — "never sell more than three things at once" */
  hero_items?: Array<{ name: string; price?: string; note?: string }>
  full_list_note?: string
  promo_mechanics?: string
  purchase_channels?: string[]
}

export interface BrandDataChannel {
  channel: string
  /** Para qué existe el canal — "a channel without a job gets abandoned" */
  job?: string
  owner?: string
}

export interface BrandData {
  identity?: {
    name?: string
    /** Web canónica de la empresa — los informes la usan si el form no trae otra */
    website_url?: string
    tagline?: string
    one_liner?: string
    mission?: string
    vision?: string
    enemy?: string
    /** El ritual o experiencia firma — a menudo el activo más ownable */
    signature_ritual?: string
    [key: string]: string | undefined
  }
  what_it_is?: string
  value_proposition?: string
  competitive_positioning?: string
  /** Record clásico + clave especial golden_rule ("Si X pudiera publicarlo, no es {marca}") */
  tone_and_voice?: Record<string, string>
  voice_vocabulary?: {
    do?: Array<string | VocabEntry>
    dont?: Array<string | VocabEntry>
  }
  voice_archetypes?: string[]
  voice_principles?: Array<{ name: string; example: string }>
  banned_phrases?: string[]
  visual_identity?: {
    status?: string
    colors?: Record<string, string>
    typography?: Record<string, string>
    logo?: Record<string, string>
    imagery_style?: string
    [key: string]: unknown
  }
  /** Audiencias — items pueden llevar incentive y language_behaviour */
  audiences?: any[]
  hero_features?: Record<string, string>
  business_model?: string
  go_to_market?: string
  offer?: BrandDataOffer
  languages?: {
    manual?: string
    captions?: string
    per_channel?: Record<string, string>
  }
  channels?: BrandDataChannel[]
  channels_to_avoid?: Array<{ channel: string; why: string }>
  constraints?: {
    legal_ip?: string
    category_rules?: string
    self_imposed?: string
    sequencing_rule?: string
  }
  what_flopped?: Array<{ format: string; theory?: string }> | string
  open_questions?: {
    contradictions?: string[]
    undecided?: string[]
    suspected_broken?: string[]
  }
  qa_rules?: { formula?: string; checklist?: string[]; what_to_avoid?: string[] }
  strategy_roadmap?: string
  editorial_rhythm?: string
  [key: string]: unknown
}

/** Normaliza vocabulario legacy (strings sueltos) al shape {phrase, why}. */
export function normalizeVocab(list?: Array<string | VocabEntry>): VocabEntry[] {
  if (!Array.isArray(list)) return []
  return list
    .map((item) => {
      if (typeof item === 'string') return item.trim() ? { phrase: item.trim() } : null
      if (item && typeof item === 'object' && typeof item.phrase === 'string' && item.phrase.trim()) {
        return { phrase: item.phrase.trim(), why: item.why?.trim() || undefined }
      }
      return null
    })
    .filter((v): v is VocabEntry => v !== null)
}

/** what_flopped tolera string legacy o array estructurado. */
export function normalizeFlopped(
  value?: Array<{ format: string; theory?: string }> | string
): Array<{ format: string; theory?: string }> {
  if (!value) return []
  if (typeof value === 'string') return value.trim() ? [{ format: value.trim() }] : []
  return value.filter((f) => f && typeof f.format === 'string' && f.format.trim())
}
