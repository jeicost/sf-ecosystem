import { createServiceClient } from '@/lib/supabase-admin'
import { getClientApiKey } from '@/lib/integrations/getClientApiKey'
import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { requireClientAccess } from '@/lib/auth-server'

export const runtime = 'nodejs'

interface BrainChatRequest {
  clientId: string
  message: string
  mode: 'chat' | 'proposal' // 'chat' = user question, 'proposal' = agent suggests update
  agentId?: string
}

async function getBrandBrainContext(clientId: string) {
  const db = createServiceClient()

  const [{ data: profile }, { data: resources }, { data: learnings }] = await Promise.all([
    db.from('brand_profiles').select('*').eq('id', clientId).single(),
    db.from('brain_resources').select('*').eq('client_id', clientId),
    db.from('brain_learnings').select('*').eq('client_id', clientId).eq('user_validated', true).limit(10),
  ])

  return {
    profile: profile || {},
    resources: resources || [],
    learnings: learnings || [],
  }
}

const ALLOWED_SECTIONS = [
  'tone_of_voice',
  'brand_personality',
  'mission',
  'values',
  'description',
  'proposition',
  'target_audience',
  'unique_value_props',
  'competitors',
  'banned_phrases',
  'banned_topics',
]

const BRAIN_SYSTEM_PROMPT = `You are the Brand Brain AI — the chief marketing strategist and memory keeper of a brand.

Your role:
1. Answer questions about the brand's identity, audience, content strategy, and assets
2. Propose updates to the brand memory when you detect something new or evolving
3. Help users refine their brand voice, messaging, and positioning
4. Never make up information — always reference what's in the brand profile
5. When proposing changes, be specific about WHY (e.g., "engagement data shows...")

ALLOWED SECTIONS FOR SAVING:
You can only save proposals to these brand profile sections:
- tone_of_voice: How the brand communicates (formal, casual, technical, etc.)
- brand_personality: Key character traits (innovative, trustworthy, playful, etc.)
- mission: Core purpose statement
- values: Fundamental principles
- description: What the brand does
- proposition: Unique value proposition
- target_audience: Who the brand serves
- unique_value_props: Specific competitive advantages
- competitors: Key competitors
- banned_phrases: Words/phrases to avoid
- banned_topics: Topics to avoid

Format for proposals:
When suggesting an update, ALWAYS end your message with:
PROPOSAL: [section_name] = [new value]
REASON: [why this matters]

IMPORTANT: [section_name] MUST be one of the allowed sections above.

Examples:
- PROPOSAL: tone_of_voice = Conversational yet professional, avoiding jargon
- PROPOSAL: banned_phrases = "synergy", "leverage", "disrupt"
- PROPOSAL: brand_personality = Innovative, trustworthy, accessible

For regular chat, just answer naturally. Let the user decide if they want to save anything.`

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BrainChatRequest
    const { clientId, message, mode, agentId } = body

    // Validate user has access to this client
    const authResult = await requireClientAccess(request, clientId)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const context = await getBrandBrainContext(clientId)

    const contextPrompt = `
CURRENT BRAND BRAIN:
- Name: ${context.profile.brand_name || 'Not set'}
- Mission: ${context.profile.mission || 'Not set'}
- Tone: ${context.profile.tone_of_voice || 'Not set'}
- Personality: ${context.profile.brand_personality || 'Not set'}
- Banned Phrases: ${context.profile.banned_phrases || 'None'}

CONNECTED RESOURCES:
${context.resources.map((r) => `- ${r.resource_type}${r.channel ? ` (${r.channel})` : ''}: ${r.name}`).join('\n')}

RECENT LEARNINGS:
${context.learnings.map((l) => `- ${l.agent_id}: ${l.learning_text}`).join('\n')}
`

    const userPrompt =
      mode === 'proposal'
        ? `Agent "${agentId}" proposes: ${message}\n\nShould we save this to the brain? Explain your reasoning.`
        : message

    // Resolve client-specific API key, falling back to platform default
    const anthropicKey = await getClientApiKey(
      clientId,
      'anthropic',
      process.env.ANTHROPIC_API_KEY
    )

    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'No Anthropic API key available for this client' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Use native Anthropic SDK for custom API key support
    const client = new Anthropic({ apiKey: anthropicKey })
    const stream = await client.messages.stream({
      model: 'claude-opus-4-7',
      max_tokens: 2048,
      system: BRAIN_SYSTEM_PROMPT + '\n\n' + contextPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      temperature: 0.7,
    })

    return new Response(stream.toReadableStream(), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Brain chat error:', error)
    return new Response(JSON.stringify({ error: 'Failed to process brain chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
