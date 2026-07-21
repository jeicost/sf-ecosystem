import { requireSession } from '@/lib/auth/require-session'
import { createAdminClient } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'
import { PAGE_EDITOR_SYSTEM_PROMPT } from '@/lib/page-editor-system-prompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params
  try {
    if (!(await requireSession())) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { instruction } = await req.json()
    if (!instruction || typeof instruction !== 'string') {
      return Response.json({ error: 'Invalid instruction' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .single()

    if (pageError || !page) {
      return Response.json({ error: 'Page not found' }, { status: 404 })
    }

    const currentSections = page.sections_json || []

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
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

    // Deliberately NOT persisted here: the proposed sections go back to the
    // editor as a working draft, and only Save (PATCH) writes them — which is
    // also the path that snapshots page_versions. Persisting from the chat
    // overwrote published pages before the editor reviewed the LLM output.
    return Response.json({
      success: true,
      sections_json: newSections,
    })
  } catch (error) {
    console.error('Chat error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
