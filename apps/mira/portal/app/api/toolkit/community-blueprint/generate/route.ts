import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

interface CommunityBlueprintRequest {
  client_id: string
  current_size: number
  goal: string
  channels: string
  pillars: string
}

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

async function fetchClientContext(clientId: string, query: string) {
  try {
    const res = await fetch('http://localhost:3000/api/agent/context/retrieve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        context_type: 'community',
        query,
        limit: 3,
      }),
    })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const body: CommunityBlueprintRequest = await req.json()
    const { client_id, current_size, goal, channels, pillars } = body

    if (!client_id || !current_size || !goal) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = createClient()
    const { data: userData } = await db.auth.getUser()

    if (!userData?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch client context (community + company)
    const docContext = await fetchClientContext(
      client_id,
      'community values, company culture, member interests, engagement strategy'
    )

    const contextContent = docContext?.documents
      ?.map((d: any) => d.excerpt)
      .join('\n') || 'No documentation available'

    // Generate community blueprint via Claude
    const message = await claude.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `You are a community strategist. Generate a comprehensive 90-day community growth blueprint.

CLIENT CONTEXT:
${contextContent}

COMMUNITY BRIEF:
- Current Size: ${current_size} members
- 90-Day Goal: ${goal}
- Channels: ${channels}
- Content Pillars: ${pillars}

Provide the blueprint in this exact JSON format:
{
  "strategy_summary": "2-3 sentence overview of the growth strategy",
  "month_1_foundation": {
    "theme": "Foundation & Activation",
    "focus": "...",
    "key_initiatives": ["...", "...", "..."],
    "expected_growth": "..."
  },
  "month_2_growth": {
    "theme": "Growth & Engagement",
    "focus": "...",
    "key_initiatives": ["...", "...", "..."],
    "expected_growth": "..."
  },
  "month_3_retention": {
    "theme": "Retention & Monetization",
    "focus": "...",
    "key_initiatives": ["...", "...", "..."],
    "expected_growth": "..."
  },
  "engagement_playbook": {
    "daily_check_ins": "5-10 min, moderators",
    "weekly_ama": "60 min, expert",
    "monthly_workshop": "skill-share or guest",
    "quarterly_event": "networking or celebration"
  },
  "influencer_sourcing": {
    "tier_1_micro": "5k-50k followers - authenticity focus",
    "tier_2_power_users": "most active in community",
    "tier_3_experts": "industry credibility"
  },
  "metrics": {
    "target_members": "...",
    "engagement_rate": 0.50,
    "retention_rate": 0.80,
    "referral_rate": 0.30,
    "monthly_active": "..."
  },
  "risks_and_mitigations": ["Risk: ...", "Mitigation: ..."]
}`,
        },
      ],
    })

    // Parse Claude's response
    let blueprint = {}
    const textContent = message.content[0]
    if (textContent.type === 'text') {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        blueprint = JSON.parse(jsonMatch[0])
      }
    }

    const generationTime = Date.now() - startTime

    // Save to database
    const { data: result, error: dbError } = await db
      .from('toolkit_results')
      .insert({
        client_id,
        user_id: userData.user.id,
        tool_type: 'community_blueprint',
        tool_name: 'Community Growth Blueprint',
        input_data: { current_size, goal, channels, pillars },
        output_data: blueprint,
        output_type: 'json',
        documentation_used: docContext?.documents?.map((d: any) => d.id) || [],
        context_tokens_used: docContext?.total_tokens_used || 0,
        generation_time_ms: generationTime,
        status: 'success',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save result' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      result_id: result.id,
      blueprint,
      generation_time_ms: generationTime,
      tokens_used: docContext?.total_tokens_used || 0,
    })
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Generation failed',
      },
      { status: 500 }
    )
  }
}
