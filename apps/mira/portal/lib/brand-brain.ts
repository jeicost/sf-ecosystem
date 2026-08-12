import { createServiceRoleClient } from '@sf/supabase'
import {
  normalizeVocab,
  normalizeFlopped,
  type BrandData,
  type VocabEntry,
  type BrandDataOffer,
  type BrandDataChannel,
} from '@/lib/brand-data'
import { fenceUntrusted } from '@/lib/grounding/untrusted'

function getAdminClient() {
  return createServiceRoleClient(
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
  audiences?: any[] | { primary?: any[]; not_our_audience?: string }
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
  /**
   * Secciones de brand_data que el editor SÍ deja rellenar pero que nunca
   * llegaban a ningún prompt (auditoría 2026-08-05): el usuario escribía la
   * visión, la propuesta de valor, el posicionamiento competitivo, el modelo
   * de negocio, los arquetipos de voz, la hoja de ruta, el ritmo editorial o
   * las reglas de calidad, y el modelo generaba como si nada de eso existiera.
   * Se emiten como texto plano etiquetado — sin tipar cada forma, porque
   * varias vienen del onboarding con claves libres.
   */
  extraSections?: Array<{ label: string; text: string }>
}

/**
 * Secciones de brand_data que se vuelcan al prompt tal cual, con su etiqueta.
 * El orden es el del documento: qué somos → qué ofrecemos → cómo hablamos →
 * cómo trabajamos.
 */
const EXTRA_PROMPT_SECTIONS: Array<{ key: string; label: string }> = [
  { key: 'what_it_is', label: 'What the brand is' },
  { key: 'value_proposition', label: 'Value proposition' },
  { key: 'competitive_positioning', label: 'Competitive positioning' },
  { key: 'hero_features', label: 'Hero features' },
  { key: 'business_model', label: 'Business model' },
  { key: 'go_to_market', label: 'Go-to-market' },
  { key: 'strategy_roadmap', label: 'Strategy & roadmap' },
  { key: 'voice_archetypes', label: 'Voice archetypes' },
  { key: 'voice_principles', label: 'Voice principles' },
  { key: 'editorial_rhythm', label: 'Editorial rhythm' },
  { key: 'qa_rules', label: 'Quality rules' },
  // Del cuestionario de intake: se escribían y no las leía nadie
  { key: 'company_facts', label: 'Company facts' },
  { key: 'problem_solved', label: 'Problem solved' },
  { key: 'competitors', label: 'Competitors' },
  { key: 'traction', label: 'Traction' },
  { key: 'metrics', label: 'Business metrics' },
  { key: 'strategy', label: 'Strategy notes' },
  { key: 'resources', label: 'Resources' },
]

/** Primer valor de texto no vacío, para resolver brand_data → columna plana. */
function firstNonEmpty(...values: unknown[]): string {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

/** Texto plano de un valor de brand_data que puede ser string, array u objeto. */
function asPromptText(value: unknown, depth = 0): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map((v) => asPromptText(v, depth + 1)).filter(Boolean).join(depth > 0 ? ', ' : ' · ')
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => {
        const text = asPromptText(v, depth + 1)
        return text ? `${k.replace(/_/g, ' ')}: ${text}` : ''
      })
      .filter(Boolean)
      .join(depth > 0 ? '; ' : ' · ')
  }
  return ''
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
    // Los filtros `!k.includes('notes')` que había aquí descartaban justo lo
    // que el cuestionario de intake escribe en visual_identity.notes y
    // colors.notes -- información que el cliente había dado a mano y que
    // desaparecía sin dejar rastro. Ahora se incluyen.
    if (vi.colors && typeof vi.colors === 'object') {
      const colorsList = Object.entries(vi.colors)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
      if (colorsList) visualIdentitySummary += `Colors: ${colorsList}. `
    }
    if (vi.typography && typeof vi.typography === 'object') {
      const typeList = Object.entries(vi.typography)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ')
      if (typeList) visualIdentitySummary += `Typography: ${typeList}. `
    }
    if (vi.imagery_style) visualIdentitySummary += `Imagery style: ${asPromptText(vi.imagery_style)}. `
    if (vi.notes) visualIdentitySummary += `Notes: ${asPromptText(vi.notes)}. `
    if (vi.status) visualIdentitySummary += `Status: ${vi.status}.`
  }

  return {
    // ⚠️ El editor de la UI escribe en brand_data.identity.{name,mission}
    // (BrandBrainEditor, pestaña "Mission & Vision"), pero esto leía SOLO las
    // columnas planas brand_profiles.name/mission, que la UI no muestra ni
    // permite editar. Resultado: rellenabas la misión en el Brand Brain y no
    // llegaba a NINGÚN prompt -- ni agentes, ni informes, ni documentos.
    // Se prefiere lo que hay en brand_data (es lo que el usuario edita) y se
    // cae a la columna plana, que es lo que rellena el alta por onboarding.
    brandName: firstNonEmpty(brandData.identity?.name, p.name),
    mission: firstNonEmpty(brandData.identity?.mission, p.mission),
    toneOfVoice: firstNonEmpty(brandData.tone_and_voice?.summary, p.tone_of_voice),
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
        ...clean(oq.contradictions, 'contradiction'),
        ...clean(oq.undecided, 'undecided'),
        ...clean(oq.suspected_broken, 'possibly broken'),
      ]
      return all.length ? all : undefined
    })(),
    extraSections: (() => {
      const sections = EXTRA_PROMPT_SECTIONS
        .map(({ key, label }) => ({ label, text: asPromptText(brandData[key]) }))
        .filter((s) => s.text.length > 0)
      // Las claves libres que el onboarding invita a inventar
      // (lib/onboarding/tools.ts) también se vuelcan: hoy se escribían en
      // brand_data y no las leía absolutamente nadie.
      const known = new Set([
        ...EXTRA_PROMPT_SECTIONS.map((s) => s.key),
        'identity', 'audiences', 'visual_identity', 'tone_and_voice', 'voice_vocabulary',
        'offer', 'languages', 'channels', 'channels_to_avoid', 'constraints',
        'what_flopped', 'open_questions', 'banned_phrases', 'content_pillars', 'status',
      ])
      for (const [key, value] of Object.entries(brandData)) {
        if (known.has(key)) continue
        const text = asPromptText(value)
        if (text) sections.push({ label: key.replace(/_/g, ' '), text })
      }
      return sections.length ? sections : undefined
    })(),
  }
}

export function formatBrandBrainForPrompt(brain: BrandBrainContext): string {
  // Todo este bloque estaba escrito en español ("**Misión:**", "**Pilares de
  // contenido:**"...) y se inyecta en TODOS los prompts del sistema -- agentes,
  // quick actions, informes y documentos. Era el ancla de idioma más fuerte que
  // había: aunque el brief viniera en inglés, el modelo veía un contexto
  // íntegramente en español y respondía en español (verificado con el deck de
  // Salsa del 2026-08-05, pedido en inglés y generado entero en español).
  const pillarsStr = brain.pillars
    .map(p => `- ${p.name} (${Math.round(p.weight * 100)}%): ${p.description}`)
    .join('\n')

  let result = `
## BRAND BRAIN — ${brain.brandName}

**Mission:** ${brain.mission}

**Tone of voice:** ${brain.toneOfVoice}

**Brand personality:** ${brain.brandPersonality.join(', ')}

${brain.bannedPhrases.length ? `**Banned phrases (NEVER use them):** ${brain.bannedPhrases.join(', ')}` : ''}

**Content pillars:**
${pillarsStr}
`.trim()

  // Cuenta de secciones REALES rellenas. Antes se contaban los `\n\n**` del
  // texto ya montado, pero la plantilla base de arriba ya emite 4-5
  // encabezados fijos aunque estén todos vacíos, así que el umbral `<= 2` no
  // se alcanzaba nunca y el aviso de "Brand Brain incompleto" no llegó a
  // dispararse jamás -- justo para el cliente nuevo que más lo necesitaba.
  let filledSections = 0
  const section = (text: string) => { filledSections++; result += text }

  if (brain.mission) filledSections++
  if (brain.toneOfVoice) filledSections++
  if (brain.brandPersonality.length) filledSections++
  if (brain.pillars.length) filledSections++

  if (brain.tagline) section(`\n\n**Tagline:** ${brain.tagline}`)
  if (brain.websiteUrl) section(`\n\n**Website:** ${brain.websiteUrl}`)
  if (brain.visualIdentitySummary) section(`\n\n**Visual identity:** ${brain.visualIdentitySummary}`)

  // Las audiencias se han escrito de dos formas distintas según quién dio de
  // alta al cliente: como ARRAY de segmentos, o como OBJETO {primary:[…],
  // not_our_audience}. Solo se contemplaba el array, así que un cliente con la
  // forma de objeto tenía sus audiencias detalladas INVISIBLES para todos los
  // agentes (verificado el 12-ago en Discoolver 360: 3 segmentos con dolores y
  // necesidades que no llegaban a ningún prompt).
  const audienceList: unknown[] = Array.isArray(brain.audiences)
    ? brain.audiences
    : Array.isArray((brain.audiences as { primary?: unknown[] } | undefined)?.primary)
      ? (brain.audiences as unknown as { primary: unknown[] }).primary
      : []
  if (audienceList.length > 0) {
    const audiencesStr = audienceList
      .map((a: any) => {
        if (typeof a === 'string') return a
        // 'segment' es la clave que usa la forma de objeto; 'name', la del array.
        const label = a?.name ?? a?.segment
        if (typeof a === 'object' && label) {
          const extras = [
            a.description,
            a.pains ? `pains: ${a.pains}` : null,
            a.wants ? `wants: ${a.wants}` : null,
            a.need ? `need: ${a.need}` : null,
            a.message ? `message: ${a.message}` : null,
            a.incentive ? `incentive: ${a.incentive}` : null,
            a.language_behaviour ? `language: ${a.language_behaviour}` : null,
          ].filter(Boolean).join(' · ')
          return `${label}${extras ? ` (${extras})` : ''}`
        }
        return JSON.stringify(a)
      })
      .join(', ')
    section(`\n\n**Audiences:** ${audiencesStr}`)
  }

  // ── Bloques ampliados (solo si presentes; el porqué junto a cada frase --
  // "a rule without a reason gets ignored") ──
  if (brain.goldenRule) section(`\n\n**Voice golden rule:** ${brain.goldenRule}`)

  const vocabLine = (e: VocabEntry) => `- "${e.phrase}"${e.why ? ` — ${e.why}` : ''}`
  if (brain.voiceVocabulary?.do.length) {
    section(`\n\n**We say (and why):**\n${brain.voiceVocabulary.do.map(vocabLine).join('\n')}`)
  }
  if (brain.voiceVocabulary?.dont.length) {
    section(`\n\n**We never say (and why):**\n${brain.voiceVocabulary.dont.map(vocabLine).join('\n')}`)
  }
  if (brain.signatureRitual) section(`\n\n**Signature ritual:** ${brain.signatureRitual}`)

  if (brain.offer) {
    const parts: string[] = []
    if (brain.offer.hero_items?.length) {
      parts.push(`Hero items (max 3): ${brain.offer.hero_items.slice(0, 3).map((h) => `${h.name}${h.price ? ` — ${h.price}` : ''}`).join(' · ')}`)
    }
    if (brain.offer.full_list_note) parts.push(`Full offer: ${brain.offer.full_list_note}`)
    if (brain.offer.promo_mechanics) parts.push(`Promo mechanics: ${brain.offer.promo_mechanics}`)
    if (brain.offer.purchase_channels?.length) parts.push(`Where to buy: ${brain.offer.purchase_channels.join(', ')}`)
    if (parts.length) section(`\n\n**Offer:**\n${parts.map((p) => `- ${p}`).join('\n')}`)
  }

  if (brain.languages && (brain.languages.manual || brain.languages.captions || brain.languages.per_channel)) {
    const langs: string[] = []
    if (brain.languages.manual) langs.push(`manual: ${brain.languages.manual}`)
    if (brain.languages.captions) langs.push(`captions: ${brain.languages.captions}`)
    if (brain.languages.per_channel) {
      langs.push(...Object.entries(brain.languages.per_channel).map(([c, l]) => `${c}: ${l}`))
    }
    section(`\n\n**Languages:** ${langs.join(' · ')}`)
  }

  if (brain.channels?.length) {
    section(`\n\n**Channels (and their job):**\n${brain.channels.map((c) => `- ${c.channel}${c.job ? ` — ${c.job}` : ''}${c.owner ? ` (${c.owner})` : ''}`).join('\n')}`)
  }
  if (brain.channelsToAvoid?.length) {
    section(`\n\n**Channels to avoid:**\n${brain.channelsToAvoid.map((c) => `- ${c.channel} — ${c.why}`).join('\n')}`)
  }

  if (brain.constraints) {
    const cons: string[] = []
    if (brain.constraints.legal_ip) cons.push(`Legal/IP: ${brain.constraints.legal_ip}`)
    if (brain.constraints.category_rules) cons.push(`Category rules: ${brain.constraints.category_rules}`)
    if (brain.constraints.self_imposed) cons.push(`Self-imposed: ${brain.constraints.self_imposed}`)
    if (brain.constraints.sequencing_rule) cons.push(`Sequencing rule: ${brain.constraints.sequencing_rule}`)
    // `constraints.notes` es donde escribe el cuestionario de intake y no se
    // emitía por ningún sitio.
    const notes = (brain.constraints as Record<string, unknown>).notes
    if (typeof notes === 'string' && notes.trim()) cons.push(`Notes: ${notes.trim()}`)
    if (cons.length) section(`\n\n**Constraints:**\n${cons.map((c) => `- ${c}`).join('\n')}`)
  }

  if (brain.whatFlopped?.length) {
    section(`\n\n**What did NOT work (do not repeat):**\n${brain.whatFlopped.map((f) => `- ${f.format}${f.theory ? ` — theory: ${f.theory}` : ''}`).join('\n')}`)
  }
  if (brain.openQuestions?.length) {
    section(`\n\n**Open questions / known contradictions (surface them, never resolve them silently):**\n${brain.openQuestions.map((q) => `- ${q}`).join('\n')}`)
  }

  // Secciones que el editor deja rellenar y que hasta 2026-08-05 no llegaban a
  // ningún prompt (visión, propuesta de valor, posicionamiento, modelo de
  // negocio, arquetipos de voz, roadmap, ritmo editorial, reglas de calidad,
  // y todo lo que el cuestionario de intake escribía en claves que nadie leía).
  if (brain.extraSections?.length) {
    for (const s of brain.extraSections) {
      section(`\n\n**${s.label}:** ${s.text}`)
    }
  }

  // Guía para Brand Brain casi vacío (cliente nuevo, pocos campos rellenos):
  // sin esto, el agente tiende a disculparse en exceso por lo que falta o, al
  // contrario, a inventar personalidad/tono para "sonar completo".
  if (filledSections <= 4) {
    result += `\n\n**Note — incomplete Brand Brain:** this client has only a few fields filled in so far. Work with what is above without apologising for what is missing and without filling the gaps with invented personality or tone — use the role's professional judgement, tagged '[RECOMMENDATION]', and if a fact is genuinely needed to answer, ask for it directly instead of assuming it.`
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

  // F4: camino legacy (se usa cuando el conocimiento unificado no devuelve nada).
  // Es contenido subido por el cliente, así que va vallado igual que en knowledge.ts.
  return fenceUntrusted('UPLOADED DOCUMENTS', docContext)
}
