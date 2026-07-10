import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

// Demo endpoint: Create a test quick action without authentication
// Usage: curl -X POST http://localhost:3005/api/quick-actions/demo

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Demo endpoint not available in production' }, { status: 403 })
  }

  try {
    const { department, action_type, input_data } = await req.json()

    if (!department || !action_type || !input_data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = adminClient()

    // Get a test user/client (first one available or hardcoded)
    const { data: projectAccess } = await admin.from('mira_project_access').select('user_id, client_id').limit(1).single()

    if (!projectAccess) {
      return NextResponse.json({ error: 'No test user/client found in database' }, { status: 500 })
    }

    // Insert test action
    const { data: result, error: insertError } = await admin
      .from('quick_actions_results')
      .insert({
        client_id: projectAccess.client_id,
        user_id: projectAccess.user_id,
        department,
        action_type,
        input_data,
        output_data: {},
        output_type: determineOutputType(action_type),
        resource_name: generateResourceName(department, action_type),
        liked_by_user: false,
        memory_saved: false,
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      action_id: result.id,
      message: 'Demo action created. Use /api/quick-actions/test?action_id=<id> to generate mock output',
      next_step: `/api/quick-actions/test?action_id=${result.id}`,
    })
  } catch (error) {
    console.error('Demo error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function determineOutputType(actionType: string): string {
  const imageActions = ['crear_post', 'crear_carousel', 'crear_campaña_ads']
  const documentActions = ['crear_propuesta', 'crear_newsletter', 'crear_faq', 'generar_reporte', 'analizar_competencia']
  const videoActions = ['crear_video_brief']

  if (imageActions.includes(actionType)) return 'image'
  if (documentActions.includes(actionType)) return 'document'
  if (videoActions.includes(actionType)) return 'video'
  return 'json'
}

function generateResourceName(department: string, actionType: string): string {
  const names: Record<string, Record<string, string>> = {
    comercial: {
      crear_campaña: 'Campaña Outreach',
      generar_icp: 'ICP Analysis',
      crear_propuesta: 'Sales Proposal',
      calificar_reply: 'Lead Qualification',
    },
    marketing: {
      crear_post: 'Social Media Post',
      crear_newsletter: 'Newsletter',
      crear_video_brief: 'Video Script',
      crear_carousel: 'Carousel Design',
      crear_campaña_ads: 'Ads Campaign',
    },
    strategy: {
      generar_reporte: 'Weekly Report',
      analizar_competencia: 'Competitive Analysis',
      brainstorm_ideas: 'Brainstorm Session',
      proyectar_revenue: 'Revenue Forecast',
    },
    community: {
      responder_ticket: 'Support Response',
      crear_faq: 'FAQ Document',
      crear_tutorial: 'Tutorial',
    },
  }

  return names[department]?.[actionType] || `${department}-${actionType}`
}
