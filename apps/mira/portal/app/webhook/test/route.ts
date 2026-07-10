import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

// Public test webhook - simulates n8n processing
// No authentication required (only in dev)

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoint not available in production' }, { status: 403 })
  }

  try {
    const { department, action_type, input_data } = await req.json()

    if (!department || !action_type || !input_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = adminClient()

    // Get a test user/client
    const { data: projectAccess } = await admin.from('mira_project_access').select('user_id, client_id').limit(1).single()

    if (!projectAccess) {
      return NextResponse.json({ error: 'No test data in database' }, { status: 500 })
    }

    // Create action
    const { data: result, error: insertError } = await admin
      .from('quick_actions_results')
      .insert({
        client_id: projectAccess.client_id,
        user_id: projectAccess.user_id,
        department,
        action_type,
        input_data,
        output_data: {},
        output_type: getOutputType(action_type),
        resource_name: getResourceName(department, action_type),
        liked_by_user: false,
        memory_saved: false,
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const actionId = result.id

    // Generate mock output and update immediately
    const mockOutput = generateMockOutput(action_type, input_data)

    const { error: updateError } = await admin
      .from('quick_actions_results')
      .update({
        output_data: mockOutput.output_data,
        output_type: mockOutput.output_type,
      })
      .eq('id', actionId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      action_id: actionId,
      message: 'Demo action created and populated with mock output',
      output_data: mockOutput.output_data,
      output_type: mockOutput.output_type,
    })
  } catch (error) {
    console.error('Webhook test error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getOutputType(actionType: string): string {
  const map: Record<string, string> = {
    crear_post: 'image',
    crear_carousel: 'image',
    crear_campaña_ads: 'image',
    crear_propuesta: 'document',
    crear_newsletter: 'document',
    crear_faq: 'document',
    generar_reporte: 'document',
    analizar_competencia: 'document',
    crear_video_brief: 'video',
  }
  return map[actionType] || 'json'
}

function getResourceName(department: string, actionType: string): string {
  const names: Record<string, Record<string, string>> = {
    comercial: {
      crear_campaña: 'Campaign Outreach',
      generar_icp: 'ICP Analysis',
      crear_propuesta: 'Sales Proposal',
      calificar_reply: 'Lead Qualification',
    },
    marketing: {
      crear_post: 'Social Post',
      crear_newsletter: 'Newsletter',
      crear_video_brief: 'Video Brief',
      crear_carousel: 'Carousel',
      crear_campaña_ads: 'Ads Campaign',
    },
    strategy: {
      generar_reporte: 'Report',
      analizar_competencia: 'Competitive Analysis',
      brainstorm_ideas: 'Brainstorm',
      proyectar_revenue: 'Revenue Forecast',
    },
    community: {
      responder_ticket: 'Support Reply',
      crear_faq: 'FAQ',
      crear_tutorial: 'Tutorial',
    },
  }
  return names[department]?.[actionType] || `${department} - ${actionType}`
}

function generateMockOutput(actionType: string, inputData: any) {
  const baseOutput = {
    timestamp: new Date().toISOString(),
    action: actionType,
  }

  switch (actionType) {
    case 'crear_campaña':
      return {
        output_type: 'document',
        output_data: {
          ...baseOutput,
          leads: ['prospect1@company.com', 'prospect2@company.com', 'prospect3@company.com'],
          icebreakers: ['Hi, I noticed...', 'Great work on...', 'Your company seems...'],
        },
      }

    case 'generar_icp':
      return {
        output_type: 'json',
        output_data: {
          ...baseOutput,
          icp_score: 87,
          category: 'hot',
          recommendation: 'High priority',
        },
      }

    case 'crear_propuesta':
      return {
        output_type: 'document',
        output_data: {
          ...baseOutput,
          title: `Proposal for ${inputData.prospect_name}`,
          pages: 8,
        },
      }

    case 'calificar_reply':
      return {
        output_type: 'json',
        output_data: {
          ...baseOutput,
          sentiment: 'positive',
          bant_score: 28,
          recommendation: 'Schedule call',
        },
      }

    case 'crear_post':
      return {
        output_type: 'image',
        output_data: {
          ...baseOutput,
          copy: 'Check out our latest feature! 🚀',
          image_url: 'https://via.placeholder.com/1080x1080',
          hashtags: ['#AI', '#Automation'],
        },
      }

    case 'crear_newsletter':
      return {
        output_type: 'document',
        output_data: {
          ...baseOutput,
          articles: [
            { title: 'Article 1', summary: 'Summary...' },
            { title: 'Article 2', summary: 'Summary...' },
          ],
        },
      }

    case 'crear_video_brief':
      return {
        output_type: 'video',
        output_data: {
          ...baseOutput,
          script: 'Scene 1: Intro...',
          scenes: [
            { time: '0-5s', action: 'Intro', voiceover: 'Welcome' },
            { time: '5-30s', action: 'Demo', voiceover: 'Here is...' },
          ],
        },
      }

    case 'crear_carousel':
      return {
        output_type: 'json',
        output_data: {
          ...baseOutput,
          slides: [
            { text: 'Slide 1', design: 'Bold colors' },
            { text: 'Slide 2', design: 'Minimal' },
          ],
        },
      }

    case 'crear_campaña_ads':
      return {
        output_type: 'document',
        output_data: {
          ...baseOutput,
          strategy: 'Focus on awareness',
          budget_allocation: { google: 40, meta: 60 },
        },
      }

    case 'generar_reporte':
      return {
        output_type: 'document',
        output_data: {
          ...baseOutput,
          summary: 'Strong growth metrics',
          kpis: { revenue: '$425k', mrr: '$42.5k', churn: '2.1%' },
        },
      }

    case 'analizar_competencia':
      return {
        output_type: 'document',
        output_data: {
          ...baseOutput,
          competitors: 3,
          opportunities: ['Add AI features', 'Improve UX'],
        },
      }

    case 'brainstorm_ideas':
      return {
        output_type: 'json',
        output_data: {
          ...baseOutput,
          total_ideas: 100,
          top_5: ['Idea 1', 'Idea 2', 'Idea 3', 'Idea 4', 'Idea 5'],
        },
      }

    case 'proyectar_revenue':
      return {
        output_type: 'json',
        output_data: {
          ...baseOutput,
          current_mrr: 42500,
          projection_12m: 125000,
          scenarios: ['conservative', 'realistic', 'optimistic'],
        },
      }

    case 'responder_ticket':
      return {
        output_type: 'json',
        output_data: {
          ...baseOutput,
          response: 'Thank you for reaching out...',
          tone: 'professional',
        },
      }

    case 'crear_faq':
      return {
        output_type: 'document',
        output_data: {
          ...baseOutput,
          faqs: [
            { question: 'How to get started?', answer: 'Sign up and connect your data...' },
            { question: 'Is there a free trial?', answer: 'Yes, 14 days free...' },
          ],
        },
      }

    case 'crear_tutorial':
      return {
        output_type: 'json',
        output_data: {
          ...baseOutput,
          title: `Tutorial: ${inputData.feature}`,
          steps: [
            { step: 1, title: 'Sign up', time: '2 min' },
            { step: 2, title: 'Setup', time: '5 min' },
          ],
        },
      }

    default:
      return {
        output_type: 'json',
        output_data: { ...baseOutput, message: 'Test output' },
      }
  }
}
