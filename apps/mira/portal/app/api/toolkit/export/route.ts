import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { generateEditorialHTML, type Section } from '@/lib/export/editorial-template'
import { generatePlaybookHTML, type PlaybookSection } from '@/lib/export/templates/playbook-template'
import { generateDeckHTML, type DeckSlide } from '@/lib/export/templates/deck-template'
import { getAdapter } from '@/lib/export/adapters'
import { TOOLKIT_TOOLS } from '@/lib/toolkit-tools'

const DOC_TITLES: Record<string, string> = {
  'doc-playbook': 'Playbook',
  'doc-deck': 'Presentación',
  'doc-results': 'Informe de Resultados',
  'doc-onepager': 'One-Pager',
}

// Convert editorial Section[] into deck slides for ?template=deck on toolkit reports
function sectionsToSlides(title: string, subtitle: string, sections: Section[]): DeckSlide[] {
  const slides: DeckSlide[] = [{ layout: 'cover', title, subtitle }]
  for (const s of sections) {
    if (s.stats?.length) {
      slides.push({ layout: 'stats', title: s.title, stats: s.stats })
    } else if (s.cards?.length) {
      slides.push({
        layout: 'content',
        title: s.title,
        bullets: s.cards.slice(0, 4).map((c) => `${c.title}`),
      })
    } else if (s.listItems?.length) {
      slides.push({ layout: 'content', title: s.title, bullets: s.listItems.slice(0, 4).map(stripHtml) })
    } else if (s.phases?.length) {
      slides.push({ layout: 'content', title: s.title, bullets: s.phases.slice(0, 4).map((p) => p.title) })
    } else {
      slides.push({ layout: 'section', title: s.title, subtitle: s.subtitle })
    }
  }
  slides.push({ layout: 'closing', title, subtitle: 'Ready to execute' })
  return slides
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').slice(0, 140)
}

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
    const toolSlug: string = queueData.tool_slug
    const tool = TOOLKIT_TOOLS.find((t) => t.slug === toolSlug)
    const toolTitle = tool?.name || DOC_TITLES[toolSlug] || toolSlug
    const template = searchParams.get('template')

    const brand = { clientName, primaryColor: brandColor, logoUrl: null }
    let html: string

    if (toolSlug === 'doc-deck' || (toolSlug.startsWith('doc-') && template === 'deck')) {
      // Documento tipo presentación
      html = generateDeckHTML({
        brand,
        title: (result.title as string) || toolTitle,
        subtitle: (result.subtitle as string) || clientName,
        slides: Array.isArray(result.slides) ? (result.slides as DeckSlide[]) : [],
      })
    } else if (toolSlug.startsWith('doc-')) {
      // Playbook / informe de resultados / one-pager
      html = generatePlaybookHTML({
        brand,
        title: (result.title as string) || toolTitle,
        subtitle: (result.subtitle as string) || clientName,
        sections: Array.isArray(result.sections) ? (result.sections as PlaybookSection[]) : [],
      })
    } else {
      // Reportes del toolkit — pipeline editorial (con ?template=deck para presentar)
      const adapter = getAdapter(toolSlug)
      const sections = adapter(result)
      if (template === 'deck') {
        html = generateDeckHTML({
          brand,
          title: toolTitle,
          subtitle: clientName,
          slides: sectionsToSlides(toolTitle, clientName, sections),
        })
      } else if (template === 'playbook') {
        html = generatePlaybookHTML({
          brand,
          title: toolTitle,
          subtitle: clientName,
          sections: sections.map((s) => ({
            title: s.title,
            body: s.content,
            stats: s.stats,
            table: s.table,
            tips: s.listItems?.map(stripHtml),
            steps: s.phases?.map((p) => ({ title: p.title, body: p.body })),
          })),
        })
      } else {
        html = generateEditorialHTML({ clientName, brandColor, toolTitle, sections })
      }
    }

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
