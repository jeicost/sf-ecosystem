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
}

export async function fetchBrandBrain(clientId: string): Promise<BrandBrainContext | null> {
  const db = getAdminClient()

  const [profileRes, pillarsRes] = await Promise.all([
    db.from('brand_profiles')
      .select('brand_name, mission, tone_of_voice, brand_personality, banned_phrases')
      .eq('client_id', clientId)
      .maybeSingle(),
    db.from('content_pillars')
      .select('name, description, weight, example_hooks')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('weight', { ascending: false }),
  ])

  if (!profileRes.data) return null

  const p = profileRes.data
  return {
    brandName: p.brand_name ?? '',
    mission: p.mission ?? '',
    toneOfVoice: (p.tone_of_voice as Record<string, string>) ?? {},
    brandPersonality: (p.brand_personality as string[]) ?? [],
    bannedPhrases: (p.banned_phrases as string[]) ?? [],
    pillars: (pillarsRes.data ?? []).map((pi: { name: string; description: string; weight: number; example_hooks: string[] }) => ({
      name: pi.name,
      description: pi.description,
      weight: pi.weight,
      exampleHooks: (pi.example_hooks as string[]) ?? [],
    })),
  }
}

export function formatBrandBrainForPrompt(brain: BrandBrainContext): string {
  const toneStr = Object.entries(brain.toneOfVoice)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')

  const pillarsStr = brain.pillars
    .map(p => `- ${p.name} (${Math.round(p.weight * 100)}%): ${p.description}`)
    .join('\n')

  return `
## BRAND BRAIN — ${brain.brandName}

**Misión:** ${brain.mission}

**Tono de voz:** ${toneStr}

**Personalidad de marca:** ${brain.brandPersonality.join(', ')}

**Frases prohibidas:** ${brain.bannedPhrases.join(', ')}

**Pilares de contenido:**
${pillarsStr}
`.trim()
}

export async function logAgentActivity(params: {
  clientId: string
  agentName: string
  agentRole: string
  taskType: string
  status: 'working' | 'completed' | 'failed'
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
