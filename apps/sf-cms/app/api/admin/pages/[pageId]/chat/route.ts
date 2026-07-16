import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { PAGE_EDITOR_SYSTEM_PROMPT } from '@/lib/page-editor-system-prompt'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params
  try {
    const { instruction } = await req.json()
    if (!instruction || typeof instruction !== 'string') {
      return Response.json({ error: 'Invalid instruction' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (pageError || !page) {
      return Response.json({ error: 'Page not found' }, { status: 404 })
    }

    const currentSections = page.sections_json || []

    const response = await client.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 4096,
      system: PAGE_EDITOR_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Current page structure:\n\n\`\`\`json\n${JSON.stringify(currentSections, null, 2)}\n\`\`\`\n\nUser instruction:\n${instruction}`,
        },
      ],
    }) as any

    const responseText = response.content[0].type === 'text' ? response.content[0].text : ''

    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) {
      return Response.json({ error: 'Invalid response format from Claude' }, { status: 500 })
    }

    const newSections = JSON.parse(jsonMatch[1])

    const { error: versionError } = await supabase
      .from('page_versions')
      .insert({
        page_id: pageId,
        version_number: (page.version_number || 0) + 1,
        sections_json: currentSections,
        created_by: 'system',
      })

    if (versionError) {
      console.error('Failed to save version:', versionError)
    }

    const { error: updateError } = await supabase
      .from('pages')
      .update({
        sections_json: newSections,
        version_number: (page.version_number || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pageId)

    if (updateError) {
      return Response.json({ error: 'Failed to save page' }, { status: 500 })
    }

    return Response.json({
      success: true,
      sections_json: newSections,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
