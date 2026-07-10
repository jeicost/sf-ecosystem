import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { adminClient } from '@/lib/supabase'

// Quick Action Handler - Unified endpoint for all departments
export async function POST(req: NextRequest) {
  try {
    const { department, action_type, input_data } = await req.json()

    if (!department || !action_type || !input_data) {
      return NextResponse.json(
        { error: 'Missing required fields: department, action_type, input_data' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get client_id from user access
    const admin = adminClient()
    const { data: accessData, error: accessError } = await admin
      .from('mira_project_access')
      .select('client_id')
      .eq('user_id', user.id)
      .single()

    if (accessError || !accessData) {
      return NextResponse.json({ error: 'No client access found' }, { status: 403 })
    }

    // Insert into quick_actions_results (store in memory)
    const { data: result, error: insertError } = await admin
      .from('quick_actions_results')
      .insert({
        client_id: accessData.client_id,
        user_id: user.id,
        department,
        action_type,
        input_data,
        output_data: {}, // Will be filled by n8n webhook
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

    // Trigger n8n webhook for async processing
    const n8nUrl = process.env.N8N_WEBHOOK_URL
    if (n8nUrl) {
      try {
        await fetch(n8nUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_id: result.id,
            department,
            action_type,
            input_data,
            client_id: accessData.client_id,
            user_id: user.id,
          }),
        })
      } catch (err) {
        console.error('N8n webhook error:', err)
        // Don't fail the request if n8n fails - just log it
      }
    }

    return NextResponse.json({
      success: true,
      action_id: result.id,
      message: 'Quick action queued for processing',
      status: 'processing',
    })
  } catch (error) {
    console.error('Quick action error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Webhook endpoint for n8n to return results
export async function PUT(req: NextRequest) {
  try {
    const { action_id, output_data, output_type } = await req.json()

    if (!action_id || !output_data) {
      return NextResponse.json(
        { error: 'Missing required fields: action_id, output_data' },
        { status: 400 }
      )
    }

    const admin = adminClient()

    // Update the result with generated data
    const { error: updateError } = await admin
      .from('quick_actions_results')
      .update({
        output_data,
        output_type: output_type || 'json',
      })
      .eq('id', action_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Quick action result saved',
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Helper: Determine output type based on action
function determineOutputType(actionType: string): string {
  const imageActions = ['crear_post', 'crear_carousel', 'crear_campaña_ads']
  const documentActions = ['crear_propuesta', 'crear_newsletter', 'crear_faq', 'generar_reporte', 'analizar_competencia']
  const videoActions = ['crear_video_brief']

  if (imageActions.includes(actionType)) return 'image'
  if (documentActions.includes(actionType)) return 'document'
  if (videoActions.includes(actionType)) return 'video'
  return 'json'
}

// Helper: Generate resource name
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

// GET: Fetch quick action results
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const actionId = searchParams.get('action_id')
    const department = searchParams.get('department')

    // Get authenticated user
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = adminClient()

    if (actionId) {
      // Get specific action result
      const { data, error } = await admin
        .from('quick_actions_results')
        .select('*')
        .eq('id', actionId)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }

    if (department) {
      // Get all actions for a department
      const { data, error } = await admin
        .from('quick_actions_results')
        .select('*')
        .eq('department', department)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
