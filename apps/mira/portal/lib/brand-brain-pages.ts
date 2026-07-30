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
  brand_identity: '🎯 Identidad de Marca',
  audience_market: '👥 Audiencia y Mercado',
  voice_visual: '💬 Voz y Visual',
  content_strategy: '📚 Estrategia de Contenido',
  business_ops: '💼 Negocio y Operaciones',
}

export const BRAND_BRAIN_PAGES: BrandBrainPageDef[] = [
  // Columnas planas de brand_profiles (fuera del jsonb brand_data)
  { fieldPath: 'name', label: 'Nombre de marca', tab: 'brand_identity' },
  { fieldPath: 'mission', label: 'Misión', tab: 'brand_identity' },
  { fieldPath: 'description', label: 'Descripción', tab: 'brand_identity' },
  { fieldPath: 'proposition', label: 'Propuesta', tab: 'brand_identity' },
  { fieldPath: 'values', label: 'Valores', tab: 'brand_identity' },
  { fieldPath: 'tone_of_voice', label: 'Tono de voz (resumen)', tab: 'voice_visual' },

  // Secciones de brand_data -- brand_identity
  { fieldPath: 'identity', label: 'Identidad (tagline, mission, vision...)', tab: 'brand_identity' },
  { fieldPath: 'what_it_is', label: 'Qué es la marca', tab: 'brand_identity' },
  { fieldPath: 'value_proposition', label: 'Propuesta de valor', tab: 'brand_identity' },
  { fieldPath: 'hero_features', label: 'Hero Features', tab: 'brand_identity' },

  // audience_market
  { fieldPath: 'competitive_positioning', label: 'Posicionamiento competitivo', tab: 'audience_market' },
  { fieldPath: 'audiences', label: 'Audiencias', tab: 'audience_market' },
  { fieldPath: 'open_questions', label: 'Preguntas abiertas', tab: 'audience_market' },

  // voice_visual
  { fieldPath: 'tone_and_voice', label: 'Tono de voz', tab: 'voice_visual' },
  { fieldPath: 'voice_vocabulary', label: 'Vocabulario', tab: 'voice_visual' },
  { fieldPath: 'voice_archetypes', label: 'Arquetipos de voz', tab: 'voice_visual' },
  { fieldPath: 'voice_principles', label: 'Principios de voz', tab: 'voice_visual' },
  { fieldPath: 'banned_phrases', label: 'Frases prohibidas', tab: 'voice_visual' },
  { fieldPath: 'visual_identity', label: 'Identidad visual', tab: 'voice_visual' },
  { fieldPath: 'languages', label: 'Idiomas', tab: 'voice_visual' },

  // business_ops
  { fieldPath: 'business_model', label: 'Modelo de negocio', tab: 'business_ops' },
  { fieldPath: 'offer', label: 'Oferta', tab: 'business_ops' },
  { fieldPath: 'channels', label: 'Canales', tab: 'business_ops' },
  { fieldPath: 'channels_to_avoid', label: 'Canales a evitar', tab: 'business_ops' },
  { fieldPath: 'constraints', label: 'Restricciones', tab: 'business_ops' },
  { fieldPath: 'what_flopped', label: 'Qué no funcionó', tab: 'business_ops' },

  // content_strategy
  { fieldPath: 'go_to_market', label: 'Go-to-market', tab: 'content_strategy' },
  { fieldPath: 'strategy_roadmap', label: 'Estrategia y hoja de ruta', tab: 'content_strategy' },
  { fieldPath: 'editorial_rhythm', label: 'Ritmo editorial', tab: 'content_strategy' },
  { fieldPath: 'qa_rules', label: 'Reglas de calidad', tab: 'content_strategy' },
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
