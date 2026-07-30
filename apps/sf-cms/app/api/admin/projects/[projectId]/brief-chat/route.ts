import { withAdminAuth } from '@/lib/auth/with-admin-auth'
import { canAccessProject } from '@/lib/auth/access'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { captureError } from '@/lib/capture-error'
import Anthropic from '@anthropic-ai/sdk'
import { SITE_BRIEF_CHAT_SYSTEM_PROMPT } from '@/lib/site-brief-chat-system-prompt'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

/**
 * GET /api/admin/projects/[projectId]/brief-chat
 *
 * Loads the existing conversation (if any) plus the project's current
 * brief_status/brief_json, so the chat page can resume where it left off
 * instead of restarting the conversation on every page load.
 */
export const GET = withAdminAuth(async (
  user,
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await params
  try {
    if (!(await canAccessProject(user, projectId))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, brief_status, brief_json')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    const { data: messages, error: messagesError } = await supabase
      .from('site_brief_messages')
      .select('role, content, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (messagesError) throw messagesError

    return Response.json({
      project: { id: project.id, name: project.name },
      brief_status: project.brief_status,
      brief_json: project.brief_json,
      messages: messages ?? [],
    })
  } catch (error) {
    console.error('Brief chat history error:', error)
    await captureError(error, { route: 'GET /api/admin/projects/[projectId]/brief-chat', projectId })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})

/**
 * POST /api/admin/projects/[projectId]/brief-chat
 *
 * Multi-turn "landing creator" chatbot. Unlike the single-turn page-editor
 * chat (app/api/admin/pages/[pageId]/chat/route.ts), this is a real
 * back-and-forth conversation: every turn (both the user's message and
 * Claude's reply) is persisted to site_brief_messages, and the full history
 * is replayed to Claude on each call so it has the whole conversation in
 * context. This endpoint never builds anything — it only converses and,
 * once the user confirms a summary, stores a structured brief_json for a
 * human developer to pick up later.
 */
export const POST = withAdminAuth(async (
  user,
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) => {
  const { projectId } = await params
  try {
    const { message } = await req.json()
    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'Invalid message' }, { status: 400 })
    }

    if (!(await canAccessProject(user, projectId))) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Same cost-protection limit as the page-editor chat: 20 req / 5 min per user.
    if (!checkRateLimit(`brief-chat:${user.id}`, 20, 5 * 60_000)) {
      return Response.json({ error: 'Demasiadas peticiones al chat de brief. Espera unos minutos.' }, { status: 429 })
    }

    const supabase = createAdminClient()

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, brief_status')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return Response.json({ error: 'Project not found' }, { status: 404 })
    }

    // Full transcript so far, oldest first.
    const { data: history, error: historyError } = await supabase
      .from('site_brief_messages')
      .select('role, content')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (historyError) throw historyError

    // Persist the user's new turn before calling Claude, so a failed/slow
    // Claude call never loses what the user just typed.
    const { error: insertUserError } = await supabase
      .from('site_brief_messages')
      .insert({ project_id: projectId, role: 'user', content: message })

    if (insertUserError) throw insertUserError

    // First message on a fresh project: flip out of not_started immediately,
    // independent of whether the Claude call below succeeds.
    if (project.brief_status === 'not_started' || !project.brief_status) {
      await supabase
        .from('projects')
        .update({ brief_status: 'in_progress' })
        .eq('id', projectId)
    }

    const anthropicMessages: Anthropic.MessageParam[] = [
      ...(history ?? []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content as string,
      })),
      { role: 'user', content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      system: SITE_BRIEF_CHAT_SYSTEM_PROMPT,
      messages: anthropicMessages,
    }) as Anthropic.Message

    const replyText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    if (!replyText) {
      return Response.json({ error: 'Empty response from Claude' }, { status: 500 })
    }

    // Persist Claude's reply regardless of whether it contained a final JSON
    // block — the transcript should read naturally when reloaded.
    const { error: insertAssistantError } = await supabase
      .from('site_brief_messages')
      .insert({ project_id: projectId, role: 'assistant', content: replyText })

    if (insertAssistantError) throw insertAssistantError

    let ready = false
    let brief: Record<string, unknown> | undefined

    const jsonMatch = replyText.match(/```json\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (parsed && parsed.ready === true) {
          ready = true
          brief = parsed
        }
      } catch {
        // Malformed JSON from the model — treat as a normal conversational
        // turn rather than failing the request; the user can keep chatting.
      }
    }

    if (ready && brief) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ brief_json: brief, brief_status: 'ready' })
        .eq('id', projectId)

      if (updateError) throw updateError
    }

    return Response.json({
      reply: replyText,
      ready,
      ...(brief ? { brief } : {}),
    })
  } catch (error) {
    console.error('Brief chat error:', error)
    await captureError(error, { route: 'POST /api/admin/projects/[projectId]/brief-chat', projectId })
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
})
