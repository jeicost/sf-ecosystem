import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { retrieveAgentContext } from '@/lib/agent-context'
import Anthropic from '@anthropic-ai/sdk'

interface MarketingCampaignRequest {
  client_id: string
  audience: string
  budget: number
  channels: string
  objective: string
}

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const body: MarketingCampaignRequest = await req.json()
    const { client_id, audience, budget, channels, objective } = body

    if (!client_id || !audience || !budget || !channels) {
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

    // Fetch client documentation context
    const docContext = await retrieveAgentContext({
      client_id,
      context_type: 'brand',
      query: 'brand voice, target audience, key messages, visual identity',
      limit: 3,
    })

    const brandContext = docContext?.documents
      ?.map((d: any) => d.excerpt)
      .join('\n') || 'No documentation available'

    // Generate campaign via Claude
    const message = await claude.messages.create({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a marketing strategist. Generate a comprehensive 30-day marketing campaign.

CLIENT CONTEXT:
${brandContext}

CAMPAIGN BRIEF:
- Target Audience: ${audience}
- Budget: €${budget}
- Channels: ${channels}
- Objective: ${objective}

Provide the campaign in this exact JSON format:
{
  "campaign_overview": "1-2 sentence summary",
  "week_1": {"focus": "...", "activities": ["..."], "budget_allocation": "..."},
  "week_2": {"focus": "...", "activities": ["..."], "budget_allocation": "..."},
  "week_3": {"focus": "...", "activities": ["..."], "budget_allocation": "..."},
  "week_4": {"focus": "...", "activities": ["..."], "budget_allocation": "..."},
  "channel_distribution": {
    "LinkedIn": {"percentage": 35, "focus": "..."},
    "Email": {"percentage": 25, "focus": "..."},
    "Content+SEO": {"percentage": 20, "focus": "..."},
    "Events+Community": {"percentage": 20, "focus": "..."}
  },
  "kpis": {
    "reach_target": 50000,
    "engagement_rate": 0.05,
    "ctr_target": 0.02,
    "conversion_rate": 0.005,
    "cac_target": 60
  },
  "success_metrics": ["...", "...", "..."]
}`,
        },
      ],
    })

    // Parse Claude's response
    let campaign = {}
    const textContent = message.content[0]
    if (textContent.type === 'text') {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        campaign = JSON.parse(jsonMatch[0])
      }
    }

    const generationTime = Date.now() - startTime

    // Save to database
    const { data: result, error: dbError } = await db
      .from('toolkit_results')
      .insert({
        client_id,
        user_id: userData.user.id,
        tool_type: 'marketing_campaign',
        tool_name: 'Marketing Campaign Generator',
        input_data: { audience, budget, channels, objective },
        output_data: campaign,
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
      campaign,
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
