import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

// Real n8n webhook integration
// Receives quick action request, calls Claude, returns result

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

export async function POST(req: NextRequest) {
  try {
    const { action_id, action_type, department, input_data, client_id, user_id } = await req.json()

    if (!action_id || !action_type || !input_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    // Generate prompt based on action type
    const prompt = generatePrompt(action_type, input_data)

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
      },
      body: JSON.stringify({
        model: 'claude-opus-4-1',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!claudeResponse.ok) {
      const error = await claudeResponse.text()
      console.error('Claude API error:', error)
      return NextResponse.json({ error: 'Claude API call failed' }, { status: 500 })
    }

    const claudeData = await claudeResponse.json()
    const claudeOutput = claudeData.content[0].text

    // Parse Claude output into structured data
    const outputData = parseClaudeOutput(action_type, claudeOutput, input_data)

    // Update Supabase with result
    const admin = adminClient()
    const { error: updateError } = await admin
      .from('quick_actions_results')
      .update({
        output_data: outputData,
        output_type: getOutputType(action_type),
      })
      .eq('id', action_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Return webhook response
    return NextResponse.json({
      success: true,
      action_id,
      message: 'Result generated and saved',
      output_data: outputData,
    })
  } catch (error) {
    console.error('Claude webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generatePrompt(actionType: string, inputData: any): string {
  switch (actionType) {
    case 'crear_campaña':
      return `Generate an outreach campaign for ${inputData.client_name} in ${inputData.industry}.
      Create:
      1. A list of ${inputData.target_count || 10} target prospect emails
      2. 3-5 personalized icebreaker emails

      Format as JSON with "leads" and "icebreakers" arrays.`

    case 'generar_icp':
      return `Score this lead against our ideal customer profile:
      Lead: ${JSON.stringify(inputData.lead_data)}
      Our company: ${inputData.company_info}

      Provide a JSON response with:
      - icp_score (0-100)
      - category (hot/warm/cold)
      - bant scores (budget, authority, need, timeline)
      - reasoning
      - next_steps (array)`

    case 'crear_propuesta':
      return `Generate a professional sales proposal outline for ${inputData.prospect_name}.
      Context: ${inputData.call_brief}
      Budget: ${inputData.budget_estimate}

      Provide sections, key points, and pricing strategy as JSON.`

    case 'calificar_reply':
      return `Analyze this prospect reply: "${inputData.prospect_reply}"
      Original context: ${inputData.context}

      Score BANT (budget, authority, need, timeline 0-10), sentiment, and next action.
      Return as JSON.`

    case 'crear_post':
      return `Write a ${inputData.platform} social media post about ${inputData.topic} in ${inputData.tone} tone.
      Include copy, relevant hashtags, and image description.
      Return as JSON with "copy", "hashtags", and "image_prompt".`

    case 'crear_newsletter':
      return `Generate ${inputData.article_count || 5} article titles and summaries for a ${inputData.tone} newsletter about ${inputData.theme}.
      Include a call-to-action.
      Return as JSON array with "title", "summary", "link" for each.`

    case 'crear_video_brief':
      return `Write a ${inputData.duration} video script for ${inputData.product} in ${inputData.style} style.
      Include scene-by-scene breakdown with voiceover.
      Return as JSON with "script", "scenes" array, and "music_suggestions".`

    case 'crear_carousel':
      return `Design a carousel concept: ${inputData.idea}
      Brand colors: ${inputData.brand_colors || 'vibrant'}
      ${inputData.slide_count || 5} slides.

      Provide slide copy, design notes, and Figma brief as JSON.`

    case 'crear_campaña_ads':
      return `Create an ads strategy:
      Goal: ${inputData.goal}
      Budget: $${inputData.budget}
      Audience: ${inputData.audience}

      Return JSON with: strategy, budget_allocation, ad_variations, targeting, expected_performance.`

    case 'generar_reporte':
      return `Generate a ${inputData.period || 'monthly'} business report with KPIs.
      Include summary, key metrics, highlights, and recommendations.
      Return as JSON.`

    case 'analizar_competencia':
      return `Analyze competitors: ${inputData.competitors?.join(', ') || 'competitors'}
      Focus: ${inputData.focus || 'features, pricing, positioning'}

      Return matrix, opportunities, threats, and recommendations as JSON.`

    case 'brainstorm_ideas':
      return `Brainstorm 100 ideas for: ${inputData.topic}
      Constraints: ${inputData.constraints || 'none'}

      Return top 5 ranked ideas, categories, and implementation tips as JSON.`

    case 'proyectar_revenue':
      return `Project revenue for next ${inputData.months || 12} months.
      Current MRR: $${inputData.current_mrr}
      Growth rate: ${inputData.growth_rate}% monthly

      Return conservative/realistic/optimistic scenarios as JSON.`

    case 'responder_ticket':
      return `Write a professional support response to: "${inputData.issue}"
      Customer type: ${inputData.customer_type}

      Provide empathetic, solution-focused response as JSON.`

    case 'crear_faq':
      return `Create FAQ for ${inputData.topic} in ${inputData.product_area}.
      Provide 5-7 Q&As that address common issues.
      Return as JSON array with "question" and "answer".`

    case 'crear_tutorial':
      return `Write a ${inputData.skill_level} tutorial for ${inputData.feature}.
      Include steps, video script snippet, and estimated time.
      Return as JSON with "steps" array and "video_script".`

    default:
      return `Generate helpful content for: ${JSON.stringify(inputData)}`
  }
}

function parseClaudeOutput(actionType: string, claudeOutput: string, inputData: any): any {
  // Try to parse as JSON first
  try {
    const jsonMatch = claudeOutput.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (e) {
    console.warn('Could not parse JSON from Claude output, returning as text')
  }

  // Fallback: return structured response
  return {
    raw_output: claudeOutput,
    parsed_at: new Date().toISOString(),
    note: 'Check raw_output for unstructured content',
  }
}

function getOutputType(actionType: string): string {
  const imageActions = ['crear_post', 'crear_carousel', 'crear_campaña_ads']
  const documentActions = ['crear_propuesta', 'crear_newsletter', 'crear_faq', 'generar_reporte', 'analizar_competencia']
  const videoActions = ['crear_video_brief']

  if (imageActions.includes(actionType)) return 'image'
  if (documentActions.includes(actionType)) return 'document'
  if (videoActions.includes(actionType)) return 'video'
  return 'json'
}
