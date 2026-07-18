import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { generateEditorialHTML } from '@/lib/export/editorial-template'
import { TOOLKIT_TOOLS } from '@/lib/toolkit-tools'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const queue_id = searchParams.get('queue_id')

    if (!queue_id) {
      return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })
    }

    const admin = adminClient()

    // Get generation result from queue
    const { data: queueData, error: queueError } = await admin
      .from('generation_queue')
      .select('*')
      .eq('id', queue_id)
      .single()

    if (queueError || !queueData || queueData.status !== 'completed') {
      return NextResponse.json({ error: 'Generation not yet completed' }, { status: 400 })
    }

    // Get client brand info
    const { data: brandData, error: brandError } = await admin
      .from('brand_profiles')
      .select('name, brand_data')
      .eq('client_id', queueData.client_id)
      .single()

    if (brandError || !brandData) {
      return NextResponse.json({ error: 'Client brand data not found' }, { status: 404 })
    }

    const result = queueData.result_data || {}
    const brandColor = result.brandColor || brandData.brand_data?.visual_identity?.colors?.primary || '#8B5CF6'
    const tool = TOOLKIT_TOOLS.find(t => t.slug === queueData.tool_slug)
    const toolTitle = tool?.name || queueData.tool_slug

    // Transform result to sections based on tool type
    const sections = transformResultToSections(queueData.tool_slug, result)

    // Generate HTML
    const html = generateEditorialHTML({
      clientName: brandData.name,
      brandColor,
      toolTitle,
      sections,
    })

    // Return as downloadable HTML
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${queueData.tool_slug}_${brandData.name.replace(/\\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html"`,
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

function transformResultToSections(toolSlug: string, result: any): any[] {
  // Simple transformation: convert result fields to sections
  // Each tool will have its own shape; this is a basic MVP adapter

  switch (toolSlug) {
    case 'seo-audit':
      return [
        {
          number: '01',
          title: 'SEO Overview',
          type: 'cards',
          content: `<div class="card">
            <p class="card-label">Overall Score</p>
            <p class="card-value">${result.overall_score || 'N/A'}</p>
          </div>`,
        },
        {
          number: '02',
          title: 'Key Findings',
          type: 'list',
          content: `<ul>${(result.findings || []).map((f: any) => `<li><span>${f}</span></li>`).join('')}</ul>`,
        },
      ]

    case 'marketing-audit':
      return [
        {
          number: '01',
          title: 'Marketing Performance',
          type: 'cards',
          content: `<div class="card">
            <p class="card-label">Overall Score</p>
            <p class="card-value">${result.overall_score || 'N/A'}</p>
          </div>`,
        },
      ]

    case 'content-pack':
      return [
        {
          number: '01',
          title: 'Content Strategy',
          type: 'text',
          content: `<p>${JSON.stringify(result).substring(0, 500)}</p>`,
        },
      ]

    default:
      return [
        {
          number: '01',
          title: 'Report Data',
          type: 'text',
          content: `<p>${JSON.stringify(result, null, 2).substring(0, 1000)}</p>`,
        },
      ]
  }
}
