import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase-admin'
import { PAGE_GENERATION_SYSTEM_PROMPT } from '@/lib/page-generation-prompt'

interface ChatRequest {
  instruction: string
  pageId?: string | null
  isNew?: boolean
}

interface Section {
  id: string
  type: string
  data: Record<string, any>
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequest
    const { instruction, pageId, isNew } = body

    if (!instruction || !instruction.trim()) {
      return NextResponse.json(
        { error: 'Instruction is required' },
        { status: 400 }
      )
    }

    const db = createServiceClient()
    const client = new Anthropic()

    // Fetch current sections_json (if editing) or start with empty
    let currentSections: Section[] = []
    let pageData: any = null

    if (pageId && !isNew) {
      const { data, error } = await db
        .from('pages')
        .select('*')
        .eq('id', pageId)
        .single() as any

      if (error) {
        return NextResponse.json(
          { error: `Failed to fetch page: ${error.message}` },
          { status: 404 }
        )
      }

      pageData = data as any
      currentSections = (data as any)?.sections_json || []
    }

    // Build the prompt context
    const currentSectionsStr =
      currentSections.length > 0
        ? JSON.stringify(currentSections, null, 2)
        : 'Page is empty (no sections yet)'

    const contextPrompt = isNew || !pageId
      ? `User is creating a NEW page. Start fresh based on their instruction. They want:\n\n${instruction}`
      : `User is editing an existing page. Current sections:\n\n${currentSectionsStr}\n\nUser instruction:\n${instruction}\n\nPreserve sections NOT mentioned in the instruction. Only modify what they ask for.`

    // Call Claude (non-streaming, structured JSON output)
    const response = await client.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 4000,
      system: PAGE_GENERATION_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: contextPrompt,
        },
      ],
    })

    // Extract the response text
    const responseText =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON from markdown code block
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Failed to extract JSON from Claude response' },
        { status: 500 }
      )
    }

    const newSectionsJson: Section[] = JSON.parse(jsonMatch[1])

    // Validate basic structure
    if (!Array.isArray(newSectionsJson)) {
      return NextResponse.json(
        { error: 'Response is not a valid JSON array' },
        { status: 400 }
      )
    }

    // Before writing to pages, save current state to page_versions (snapshot)
    if (pageData && !isNew) {
      await (db as any).from('page_versions').insert({
        page_id: pageId,
        sections_json: currentSections,
        created_by: 'system', // In production, get from auth context
        created_at: new Date().toISOString(),
      })
    }

    // Update or create the page
    if (isNew || !pageId) {
      // Create new page
      const { data: newPage, error: createError } = await (db as any)
        .from('pages')
        .insert({
          project_id: pageData?.project_id || null,
          slug: pageData?.slug || `page-${Date.now()}`,
          title: pageData?.title || 'New Page',
          sections_json: newSectionsJson,
          status: 'draft',
        })
        .select()
        .single()

      if (createError) {
        return NextResponse.json(
          { error: `Failed to create page: ${createError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        pageId: (newPage as any).id,
        sectionsJson: newSectionsJson,
        message: 'Page created successfully',
      })
    } else {
      // Update existing page
      const { error: updateError } = await (db as any)
        .from('pages')
        .update({ sections_json: newSectionsJson, updated_at: new Date().toISOString() })
        .eq('id', pageId)

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to update page: ${updateError.message}` },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        pageId,
        sectionsJson: newSectionsJson,
        message: 'Page updated successfully',
      })
    }
  } catch (err) {
    console.error('Chat error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
