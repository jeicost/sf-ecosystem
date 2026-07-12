import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export interface BrandBrainContext {
  brandName: string
  mission: string
  toneOfVoice: Record<string, string>
  brandPersonality: string[]
  bannedPhrases: string[]
  pillars: Array<{ name: string; description: string; weight: number; exampleHooks: string[] }>
  tagline?: string
  audiences?: any[]
  visualIdentitySummary?: string
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
    toneOfVoice: (p.tone_of_voice as Record<string, string>) ?? {},
    brandPersonality: (p.values as string[]) ?? [],
    bannedPhrases: [],
    pillars: (pillarsRes.data ?? []).map((pi: any) => ({
      name: pi.pillar_name ?? pi.name,
      description: pi.description ?? '',
      weight: 1,
      exampleHooks: (pi.examples as string[]) ?? [],
    })),
    tagline: brandData.identity?.tagline ?? undefined,
    audiences: brandData.audiences ?? undefined,
    visualIdentitySummary: visualIdentitySummary || undefined,
  }
}

export function formatBrandBrainForPrompt(brain: BrandBrainContext): string {
  const toneStr = Object.entries(brain.toneOfVoice)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')

  const pillarsStr = brain.pillars
    .map(p => `- ${p.name} (${Math.round(p.weight * 100)}%): ${p.description}`)
    .join('\n')

  let result = `
## BRAND BRAIN — ${brain.brandName}

**Misión:** ${brain.mission}

**Tono de voz:** ${toneStr}

**Personalidad de marca:** ${brain.brandPersonality.join(', ')}

**Frases prohibidas:** ${brain.bannedPhrases.join(', ')}

**Pilares de contenido:**
${pillarsStr}
`.trim()

  if (brain.tagline) {
    result += `\n\n**Tagline:** ${brain.tagline}`
  }

  if (brain.visualIdentitySummary) {
    result += `\n\n**Identidad Visual:** ${brain.visualIdentitySummary}`
  }

  if (brain.audiences && brain.audiences.length > 0) {
    const audiencesStr = brain.audiences
      .map((a: any) => {
        if (typeof a === 'string') return a
        if (typeof a === 'object' && a.name) return `${a.name}${a.description ? ': ' + a.description : ''}`
        return JSON.stringify(a)
      })
      .join(', ')
    result += `\n\n**Audiencias:** ${audiencesStr}`
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
