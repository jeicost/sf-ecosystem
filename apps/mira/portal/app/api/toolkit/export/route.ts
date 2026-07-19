import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { generateEditorialHTML } from '@/lib/export/editorial-template'
import { getAdapter } from '@/lib/export/adapters'
import { TOOLKIT_TOOLS } from '@/lib/toolkit-tools'

export async function GET(req: NextRequest) {
  try {
    // Session auth — export requires a logged-in user (iframe is same-origin, cookies flow)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            )
          },
        },
      }
    )
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const queue_id = searchParams.get('queue_id')
    const inline = searchParams.get('inline') === '1'

    if (!queue_id) {
      return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })
    }

    const admin = adminClient()

    const { data: queueData, error: queueError } = await admin
      .from('generation_queue')
      .select('*')
      .eq('id', queue_id)
      .single()

    if (queueError || !queueData || queueData.status !== 'completed') {
      return NextResponse.json({ error: 'Generation not yet completed' }, { status: 400 })
    }

    const { data: brandData } = await admin
      .from('brand_profiles')
      .select('name, brand_data')
      .eq('client_id', queueData.client_id)
      .single()

    const { data: clientRow } = await admin
      .from('clients')
      .select('name')
      .eq('id', queueData.client_id)
      .single()

    const clientName = brandData?.name || clientRow?.name || 'Cliente'
    const result = queueData.result_data || {}
    const brandColor =
      result.brandColor ||
      brandData?.brand_data?.visual_identity?.colors?.primary ||
      '#8B5CF6'
    const tool = TOOLKIT_TOOLS.find((t) => t.slug === queueData.tool_slug)
    const toolTitle = tool?.name || queueData.tool_slug

    const adapter = getAdapter(queueData.tool_slug)
    const sections = adapter(result)

    const html = generateEditorialHTML({
      clientName,
      brandColor,
      toolTitle,
      sections,
    })

    const filename = `${queueData.tool_slug}_${clientName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': inline ? 'inline' : `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
