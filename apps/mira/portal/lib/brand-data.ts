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

/**
 * Catálogo canónico de huecos del Brand Brain: qué claves existen en
 * `brand_data`, qué va en cada una y con qué forma.
 *
 * Por qué existe (2026-08-07): la síntesis de Drive solo recibía el
 * `brand_data` ACTUAL del cliente con la instrucción "usa estas claves
 * exactas". Con un Brain recién creado eso significa 4 claves, así que el
 * modelo no tenía forma de saber que existen `voice_principles`,
 * `banned_phrases`, `qa_rules` o `business_model`. Resultado medido en Salsa:
 * 167.000 caracteres sincronizados desde Drive — incluido un
 * `SALSA_Brand_Voice_Guide.pdf` y un Brand Book completo — y la pestaña de Voz
 * del editor a 1 campo de 7. Un Brain vacío se quedaba vacío para siempre,
 * porque solo se podía proponer sobre lo que ya estaba lleno.
 *
 * Al declarar los huecos explícitamente, el sintetizador puede colocar lo que
 * lee en su sitio en vez de tener que adivinar el esquema.
 */
export const BRAND_DATA_SLOTS: Array<{ key: string; what: string }> = [
  { key: 'identity', what: 'Object {name, tagline, one_liner, mission, vision, enemy, signature_ritual, website_url} — who the brand is' },
  { key: 'what_it_is', what: 'String, one item per line — the 5-7 things the brand is at the same time' },
  { key: 'value_proposition', what: 'String — problems solved + emotional promise + time/money saved' },
  { key: 'competitive_positioning', what: 'String — where it sits against alternatives and why' },
  { key: 'hero_features', what: 'Object {feature_1, feature_2, feature_3} — the three differentiators that lead the narrative' },
  { key: 'values', what: 'Array of strings — the brand values' },
  { key: 'business_model', what: 'String — how it makes money' },
  { key: 'offer', what: 'Object — products/services, hero items, prices, packages' },
  { key: 'go_to_market', what: 'String — how it reaches the market' },
  { key: 'strategy_roadmap', what: 'String — strategy and what is coming next' },
  { key: 'audiences', what: 'Array of {segment, need, message} — the audience segments' },
  { key: 'channels', what: 'Array of {channel, ...} — the channels in use and how each is used' },
  { key: 'channels_to_avoid', what: 'Array of {channel, why} — channels deliberately not used' },
  { key: 'constraints', what: 'Object {legal_ip, category_rules, self_imposed, sequencing_rule} — what the brand may not do' },
  { key: 'tone_and_voice', what: 'Object {summary, golden_rule} — how the brand sounds, in prose, plus its self-check sentence' },
  { key: 'voice_archetypes', what: 'Array of 2 strings — primary and secondary archetype' },
  { key: 'voice_principles', what: 'Array of {name, example} — voice rules with a real example of each' },
  { key: 'voice_vocabulary', what: 'Object {do: [{phrase, why}], dont: [{phrase, why}]} — words to use and to avoid' },
  { key: 'banned_phrases', what: 'Array of strings — phrases the brand never says' },
  { key: 'languages', what: 'Object {manual, captions, per_channel} — which language is used where' },
  { key: 'visual_identity', what: 'Object {status, colors, typography, logo, imagery_style} — the visual system' },
  { key: 'editorial_rhythm', what: 'String — publishing cadence and content mix' },
  { key: 'qa_rules', what: 'Object {formula, checklist[], what_to_avoid[]} — how to tell a piece is ready' },
  { key: 'what_flopped', what: 'Array of {format, theory} — what was tried and did not work' },
  { key: 'open_questions', what: 'Object {contradictions[], undecided[], suspected_broken[]} — what is still unresolved' },
]

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
  // Los items sueltos en texto (seeds, escrituras de agentes) contaban como
  // basura y se descartaban: eran flops reales que desaparecían de la pantalla.
  return value
    .map((f) => (typeof f === 'string' ? { format: f } : f))
    .filter((f) => f && typeof f.format === 'string' && f.format.trim())
}
