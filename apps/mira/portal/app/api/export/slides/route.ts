import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { queue_id, slides_title } = await req.json()
    if (!queue_id) return NextResponse.json({ error: 'Missing queue_id' }, { status: 400 })

    const admin = adminClient()
    const { data: generation } = await admin.from('generation_queue').select('*').eq('id', queue_id).single()

    if (!generation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const slidesContent = formatForSlides(generation)
    return NextResponse.json({
      success: true,
      presentation: {
        title: slides_title || `${generation.tool_slug} - ${new Date().toLocaleDateString()}`,
        slides: slidesContent
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

function formatForSlides(generation: any) {
  const data = generation.result_data || {}
  const slides: any[] = [
    { type: 'title', title: generation.tool_slug.replace(/-/g, ' ').toUpperCase(), subtitle: new Date().toLocaleDateString() }
  ]

  if (data.sections) {
    data.sections.slice(0, 4).forEach((section: any) => {
      slides.push({ type: 'section_header', title: section.title, score: section.score })
      if (section.findings) slides.push({ type: 'bullets', title: 'Findings', items: section.findings.slice(0, 3) })
    })
  }

  if (data.quick_wins) slides.push({ type: 'bullets', title: 'Quick Wins', items: data.quick_wins.slice(0, 5) })
  if (data.action_plan) slides.push({ type: 'bullets', title: 'Actions', items: data.action_plan.slice(0, 5) })

  slides.push({ type: 'closing', title: 'Questions?', subtitle: 'MIRA Portal' })
  return slides
}
