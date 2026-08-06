// Registro estático de "páginas" del Brand Brain (Fase 2, 2026-07-30).
// NO migra brand_data a tablas -- sigue siendo un único jsonb por cliente.
// Esto es solo una capa de navegación/agrupación sobre las claves que ya
// existen, reutilizando las 6 categorías que ya usa BrandBrainEditor.tsx (no
// se inventa una taxonomía nueva). Sirve para: (a) agrupar filas de
// brain_field_provenance/brain_contradictions por "página" en el índice
// navegable, (b) dar una etiqueta legible a un field_path crudo.

export type BrandBrainTab =
  | 'brand_identity'
  | 'audience_market'
  | 'voice_visual'
  | 'content_strategy'
  | 'business_ops'

export interface BrandBrainPageDef {
  /** Coincide con una clave de primer nivel de BrandData, o una columna plana de brand_profiles */
  fieldPath: string
  label: string
  tab: BrandBrainTab
}

export const BRAND_BRAIN_TAB_LABELS: Record<BrandBrainTab, string> = {
  brand_identity: '🎯 Brand Identity',
  audience_market: '👥 Audience & Market',
  voice_visual: '💬 Voice & Visual',
  content_strategy: '📚 Content Strategy',
  business_ops: '💼 Business & Operations',
}

export const BRAND_BRAIN_PAGES: BrandBrainPageDef[] = [
  // Columnas planas de brand_profiles (fuera del jsonb brand_data)
  { fieldPath: 'name', label: 'Brand name', tab: 'brand_identity' },
  { fieldPath: 'mission', label: 'Mission', tab: 'brand_identity' },
  { fieldPath: 'description', label: 'Description', tab: 'brand_identity' },
  { fieldPath: 'proposition', label: 'Proposition', tab: 'brand_identity' },
  { fieldPath: 'values', label: 'Values', tab: 'brand_identity' },
  { fieldPath: 'tone_of_voice', label: 'Tone of voice (summary)', tab: 'voice_visual' },

  // Secciones de brand_data -- brand_identity
  { fieldPath: 'identity', label: 'Identity (tagline, mission, vision…)', tab: 'brand_identity' },
  { fieldPath: 'what_it_is', label: 'What the brand is', tab: 'brand_identity' },
  { fieldPath: 'value_proposition', label: 'Value proposition', tab: 'brand_identity' },
  { fieldPath: 'hero_features', label: 'Hero Features', tab: 'brand_identity' },

  // audience_market
  { fieldPath: 'competitive_positioning', label: 'Competitive positioning', tab: 'audience_market' },
  { fieldPath: 'audiences', label: 'Audiences', tab: 'audience_market' },
  { fieldPath: 'open_questions', label: 'Open questions', tab: 'audience_market' },

  // voice_visual
  { fieldPath: 'tone_and_voice', label: 'Tone of voice', tab: 'voice_visual' },
  { fieldPath: 'voice_vocabulary', label: 'Vocabulary', tab: 'voice_visual' },
  { fieldPath: 'voice_archetypes', label: 'Voice archetypes', tab: 'voice_visual' },
  { fieldPath: 'voice_principles', label: 'Voice principles', tab: 'voice_visual' },
  { fieldPath: 'banned_phrases', label: 'Banned phrases', tab: 'voice_visual' },
  { fieldPath: 'visual_identity', label: 'Visual identity', tab: 'voice_visual' },
  { fieldPath: 'languages', label: 'Languages', tab: 'voice_visual' },

  // business_ops
  { fieldPath: 'business_model', label: 'Business model', tab: 'business_ops' },
  { fieldPath: 'offer', label: 'Offer', tab: 'business_ops' },
  { fieldPath: 'channels', label: 'Channels', tab: 'business_ops' },
  { fieldPath: 'channels_to_avoid', label: 'Channels to avoid', tab: 'business_ops' },
  { fieldPath: 'constraints', label: 'Constraints', tab: 'business_ops' },
  { fieldPath: 'what_flopped', label: 'What did not work', tab: 'business_ops' },

  // content_strategy
  { fieldPath: 'go_to_market', label: 'Go-to-market', tab: 'content_strategy' },
  { fieldPath: 'strategy_roadmap', label: 'Strategy & roadmap', tab: 'content_strategy' },
  { fieldPath: 'editorial_rhythm', label: 'Editorial rhythm', tab: 'content_strategy' },
  { fieldPath: 'qa_rules', label: 'Quality rules', tab: 'content_strategy' },
]

const PAGES_BY_FIELD_PATH: Record<string, BrandBrainPageDef> = Object.fromEntries(
  BRAND_BRAIN_PAGES.map((p) => [p.fieldPath, p])
)

/** Busca la página por su field_path exacto. */
export function getPageDef(fieldPath: string): BrandBrainPageDef | undefined {
  return Object.prototype.hasOwnProperty.call(PAGES_BY_FIELD_PATH, fieldPath)
    ? PAGES_BY_FIELD_PATH[fieldPath]
    : undefined
}

/**
 * Contradicciones/provenance pueden usar field_path anidado (p.ej.
 * 'identity.tagline', 'offer.hero_items') -- esto resuelve a la página de la
 * SECCIÓN raíz ('identity', 'offer') para poder agrupar en el índice.
 */
export function getPageForFieldPath(fieldPath: string): BrandBrainPageDef | undefined {
  const root = fieldPath.split('.')[0]
  return getPageDef(root)
}
