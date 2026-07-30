import { createClient } from '@supabase/supabase-js'
import {
  normalizeVocab,
  normalizeFlopped,
  type BrandData,
  type VocabEntry,
  type BrandDataOffer,
  type BrandDataChannel,
} from '@/lib/brand-data'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface BrandBrainContext {
  brandName: string
  mission: string
  toneOfVoice: string
  brandPersonality: string[]
  bannedPhrases: string[]
  pillars: Array<{ name: string; description: string; weight: number; exampleHooks: string[] }>
  tagline?: string
  websiteUrl?: string
  audiences?: any[]
  visualIdentitySummary?: string
  // Ampliación 2026-07-28 (BRAND_MEMORY_TEMPLATE del método del CEO)
  goldenRule?: string
  voiceVocabulary?: { do: VocabEntry[]; dont: VocabEntry[] }
  signatureRitual?: string
  offer?: BrandDataOffer
  languages?: { manual?: string; captions?: string; per_channel?: Record<string, string> }
  channels?: BrandDataChannel[]
  channelsToAvoid?: Array<{ channel: string; why: string }>
  constraints?: { legal_ip?: string; category_rules?: string; self_imposed?: string; sequencing_rule?: string }
  whatFlopped?: Array<{ format: string; theory?: string }>
  openQuestions?: string[]
}

export async function fetchBrandBrain(clientId: string): Promise<BrandBrainContext | null> {
  const db = getAdminClient()

  const [profileRes, pillarsRes] = await Promise.all([
    db.from('brand_profiles')
      .select('name, mission, tone_of_voice, values, description, brand_data')
      .eq('client_id', clientId)
      .maybeSingle(),
    db.from('content_pillars')
      .select('pillar_name, description, themes, examples')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false }),
  ])

  if (!profileRes.data) return null

  const p = profileRes.data
  const brandData = (p.brand_data as any) ?? {}

  let visualIdentitySummary = ''
  if (brandData.visual_identity && typeof brandData.visual_identity === 'object') {
    const vi = brandData.visual_identity
    if (vi.colors && typeof vi.colors === 'object') {
      const colorsList = Object.entries(vi.colors)
        .filter(([k]) => !k.includes('notes'))
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
      if (colorsList) visualIdentitySummary += `Colores: ${colorsList}. `
    }
    if (vi.typography && typeof vi.typography === 'object') {
      const typeList = Object.entries(vi.typography)
        .filter(([k]) => !k.includes('notes'))
        .map(([, v]) => v)
        .join(', ')
      if (typeList) visualIdentitySummary += `Tipografía: ${typeList}. `
    }
    if (vi.status) visualIdentitySummary += `Status: ${vi.status}.`
  }

  return {
    brandName: p.name ?? '',
    mission: p.mission ?? '',
    toneOfVoice: p.tone_of_voice ?? '',
    brandPersonality: (p.values as string[]) ?? [],
    // Antes hardcodeado a [] — la línea "Frases prohibidas" de todos los
    // prompts iba siempre vacía aunque el cliente las tuviera definidas.
    bannedPhrases: Array.isArray(brandData.banned_phrases)
      ? (brandData.banned_phrases as string[]).filter((s) => typeof s === 'string' && s.trim())
      : [],
    pillars: (pillarsRes.data ?? []).map((pi: any) => ({
      name: pi.pillar_name ?? pi.name,
      description: pi.description ?? '',
      weight: 1,
      exampleHooks: (pi.examples as string[]) ?? [],
    })),
    tagline: brandData.identity?.tagline ?? undefined,
    websiteUrl: brandData.identity?.website_url || undefined,
    audiences: brandData.audiences ?? undefined,
    visualIdentitySummary: visualIdentitySummary || undefined,
    // Campos ampliados (todos opcionales, tolerantes a legacy)
    goldenRule: typeof brandData.tone_and_voice?.golden_rule === 'string' && brandData.tone_and_voice.golden_rule.trim()
      ? brandData.tone_and_voice.golden_rule.trim()
      : undefined,
    voiceVocabulary: brandData.voice_vocabulary
      ? { do: normalizeVocab(brandData.voice_vocabulary.do), dont: normalizeVocab(brandData.voice_vocabulary.dont) }
      : undefined,
    signatureRitual: brandData.identity?.signature_ritual || undefined,
    offer: brandData.offer && typeof brandData.offer === 'object' ? (brandData.offer as BrandData['offer']) : undefined,
    languages: brandData.languages && typeof brandData.languages === 'object' ? brandData.languages : undefined,
    channels: Array.isArray(brandData.channels) ? brandData.channels : undefined,
    channelsToAvoid: Array.isArray(brandData.channels_to_avoid) ? brandData.channels_to_avoid : undefined,
    constraints: brandData.constraints && typeof brandData.constraints === 'object' ? brandData.constraints : undefined,
    whatFlopped: (() => { const f = normalizeFlopped(brandData.what_flopped); return f.length ? f : undefined })(),
    openQuestions: (() => {
      const oq = brandData.open_questions
      if (!oq || typeof oq !== 'object') return undefined
      const clean = (arr: unknown, tag: string) =>
        Array.isArray(arr)
          ? arr.filter((c): c is string => typeof c === 'string' && c.trim().length > 0).map((c) => `[${tag}] ${c.trim()}`)
          : []
      const all = [
        ...clean(oq.contradictions, 'contradicción'),
        ...clean(oq.undecided, 'sin decidir'),
        ...clean(oq.suspected_broken, 'posible fallo'),
      ]
      return all.length ? all : undefined
    })(),
  }
}

export function formatBrandBrainForPrompt(brain: BrandBrainContext): string {
  const pillarsStr = brain.pillars
    .map(p => `- ${p.name} (${Math.round(p.weight * 100)}%): ${p.description}`)
    .join('\n')

  let result = `
## BRAND BRAIN — ${brain.brandName}

**Misión:** ${brain.mission}

**Tono de voz:** ${brain.toneOfVoice}

**Personalidad de marca:** ${brain.brandPersonality.join(', ')}

${brain.bannedPhrases.length ? `**Frases prohibidas (NUNCA usarlas):** ${brain.bannedPhrases.join(', ')}` : ''}

**Pilares de contenido:**
${pillarsStr}
`.trim()

  if (brain.tagline) {
    result += `\n\n**Tagline:** ${brain.tagline}`
  }

  if (brain.websiteUrl) {
    result += `\n\n**Web:** ${brain.websiteUrl}`
  }

  if (brain.visualIdentitySummary) {
    result += `\n\n**Identidad Visual:** ${brain.visualIdentitySummary}`
  }

  if (brain.audiences && brain.audiences.length > 0) {
    const audiencesStr = brain.audiences
      .map((a: any) => {
        if (typeof a === 'string') return a
        if (typeof a === 'object' && a.name) {
          const extras = [
            a.description,
            a.incentive ? `incentivo: ${a.incentive}` : null,
            a.language_behaviour ? `idioma: ${a.language_behaviour}` : null,
          ].filter(Boolean).join(' · ')
          return `${a.name}${extras ? ` (${extras})` : ''}`
        }
        return JSON.stringify(a)
      })
      .join(', ')
    result += `\n\n**Audiencias:** ${audiencesStr}`
  }

  // ── Bloques ampliados (solo si presentes; el porqué junto a cada frase —
  // "a rule without a reason gets ignored") ──
  if (brain.goldenRule) {
    result += `\n\n**Regla de oro de la voz:** ${brain.goldenRule}`
  }
  const vocabLine = (e: VocabEntry) => `- "${e.phrase}"${e.why ? ` — ${e.why}` : ''}`
  if (brain.voiceVocabulary?.do.length) {
    result += `\n\n**Decimos (y por qué):**\n${brain.voiceVocabulary.do.map(vocabLine).join('\n')}`
  }
  if (brain.voiceVocabulary?.dont.length) {
    result += `\n\n**Nunca decimos (y por qué):**\n${brain.voiceVocabulary.dont.map(vocabLine).join('\n')}`
  }
  if (brain.signatureRitual) {
    result += `\n\n**Ritual firma:** ${brain.signatureRitual}`
  }
  if (brain.offer) {
    const parts: string[] = []
    if (brain.offer.hero_items?.length) {
      parts.push(`Hero items (máx 3): ${brain.offer.hero_items.slice(0, 3).map((h) => `${h.name}${h.price ? ` — ${h.price}` : ''}`).join(' · ')}`)
    }
    if (brain.offer.full_list_note) parts.push(`Oferta completa: ${brain.offer.full_list_note}`)
    if (brain.offer.promo_mechanics) parts.push(`Mecánicas de promo: ${brain.offer.promo_mechanics}`)
    if (brain.offer.purchase_channels?.length) parts.push(`Dónde se compra: ${brain.offer.purchase_channels.join(', ')}`)
    if (parts.length) result += `\n\n**Oferta:**\n${parts.map((p) => `- ${p}`).join('\n')}`
  }
  if (brain.languages && (brain.languages.manual || brain.languages.captions || brain.languages.per_channel)) {
    const langs: string[] = []
    if (brain.languages.manual) langs.push(`manual: ${brain.languages.manual}`)
    if (brain.languages.captions) langs.push(`captions: ${brain.languages.captions}`)
    if (brain.languages.per_channel) {
      langs.push(...Object.entries(brain.languages.per_channel).map(([c, l]) => `${c}: ${l}`))
    }
    result += `\n\n**Idiomas:** ${langs.join(' · ')}`
  }
  if (brain.channels?.length) {
    result += `\n\n**Canales (y su trabajo):**\n${brain.channels.map((c) => `- ${c.channel}${c.job ? ` — ${c.job}` : ''}${c.owner ? ` (${c.owner})` : ''}`).join('\n')}`
  }
  if (brain.channelsToAvoid?.length) {
    result += `\n\n**Canales a evitar:**\n${brain.channelsToAvoid.map((c) => `- ${c.channel} — ${c.why}`).join('\n')}`
  }
  if (brain.constraints) {
    const cons: string[] = []
    if (brain.constraints.legal_ip) cons.push(`Legal/IP: ${brain.constraints.legal_ip}`)
    if (brain.constraints.category_rules) cons.push(`Reglas de categoría: ${brain.constraints.category_rules}`)
    if (brain.constraints.self_imposed) cons.push(`Autoimpuestas: ${brain.constraints.self_imposed}`)
    if (brain.constraints.sequencing_rule) cons.push(`Regla de secuenciación: ${brain.constraints.sequencing_rule}`)
    if (cons.length) result += `\n\n**Restricciones:**\n${cons.map((c) => `- ${c}`).join('\n')}`
  }
  if (brain.whatFlopped?.length) {
    result += `\n\n**Lo que NO funcionó (no repetir):**\n${brain.whatFlopped.map((f) => `- ${f.format}${f.theory ? ` — teoría: ${f.theory}` : ''}`).join('\n')}`
  }
  if (brain.openQuestions?.length) {
    result += `\n\n**Preguntas abiertas / contradicciones conocidas (aflorar, nunca resolver en silencio):**\n${brain.openQuestions.map((q) => `- ${q}`).join('\n')}`
  }

  // Guía para Brand Brain casi vacío (cliente nuevo, pocos campos rellenos):
  // sin esto, el agente tiende a disculparse en exceso por lo que falta o, al
  // contrario, a inventar personalidad/tono para "sonar completo". Contamos
  // cuántos bloques opcionales por encima realmente se rellenaron (cada uno
  // añade un encabezado en negrita "\n\n**") -- Misión/Tono/Personalidad/
  // Pilares son siempre el mínimo, así que un Brand Brain sano tiene bastantes
  // más de 4 bloques.
  const filledOptionalBlocks = (result.match(/\n\n\*\*/g) || []).length
  if (filledOptionalBlocks <= 2) {
    result += `\n\n**Nota — Brand Brain incompleto:** este cliente tiene pocos campos rellenos todavía. Trabaja con lo que hay arriba sin disculparte por lo que falta ni rellenar los huecos con personalidad o tono inventados — usa el criterio profesional del rol, etiquetado '[RECOMENDACIÓN]', y si el dato es genuinamente necesario para responder, pregúntalo directamente en vez de asumirlo.`
  }

  return result
}

export async function logAgentActivity(params: {
  clientId: string
  agentName: string
  agentRole: string
  taskType: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  outputSummary?: string
}) {
  const db = getAdminClient()
  await db.from('agent_activity').insert({
    client_id: params.clientId,
    agent_name: params.agentName,
    agent_role: params.agentRole,
    task_type: params.taskType,
    status: params.status,
    output_summary: params.outputSummary ?? null,
    started_at: new Date().toISOString(),
  })
}

export async function getAgentDocumentContext(clientId: string, agentRole: string): Promise<string | null> {
  const db = getAdminClient()

  const { data: docs } = await db
    .from('agent_documents')
    .select('title, original_filename, extracted_text, analysis_summary')
    .eq('client_id', clientId)
    .in('agent_role', [agentRole, 'general'])
    .eq('analysis_status', 'completed')
    .order('uploaded_at', { ascending: false })
    .limit(5)

  if (!docs || docs.length === 0) return null

  const docContext = docs
    .map((doc) => `
## Documento: ${doc.original_filename || doc.title || 'Sin título'}
### Resumen:
${doc.analysis_summary || doc.extracted_text?.slice(0, 500) || 'Sin contenido'}
`)
    .join('\n---\n')

  return `## CONTEXTO DE DOCUMENTOS SUBIDOS

${docContext}

Use estos documentos como contexto adicional para responder las preguntas del usuario.`
}
