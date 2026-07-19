import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getToolkitPrompt } from '@/lib/generation/toolkit-prompts'
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const TOOLKIT_TOOLS = [
  'seo-audit',
  'marketing-audit',
  'brand-briefing',
  'competitive-analysis',
  'investor-deck',
  'content-pack',
  'action-plan',
  'brandbook-content-system',
  'marketing-campaign-generator',
  'community-growth-blueprint',
]

async function generateToolReport(
  admin: any,
  clientId: string,
  userId: string | null,
  toolSlug: string,
  inputData: any
): Promise<string> {
  try {
    // Insert generation request into queue with 'processing' status
    const { data: queueData, error: queueError } = await admin
      .from('generation_queue')
      .insert({
        client_id: clientId,
        user_id: userId,
        tool_slug: toolSlug,
        input_data: inputData,
        status: 'processing',
      })
      .select('id')
      .single()

    if (queueError || !queueData) {
      console.error(`[${toolSlug}] Queue insert error:`, queueError)
      throw new Error('Queue insert failed')
    }

    const queueId = queueData.id

    // Generate prompt for this tool
    const prompt = await getToolkitPrompt(toolSlug, {
      clientId,
      inputData,
    })

    if (!prompt) {
      await admin
        .from('generation_queue')
        .update({ status: 'failed', error_message: 'Unknown tool' })
        .eq('id', queueId)
      throw new Error('Unknown tool')
    }

    // Call Claude
    const message = await claude.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Extract JSON from Claude's response
    let result = {}
    const textContent = message.content[0]
    if (textContent && 'text' in textContent) {
      const text = textContent.text
      let jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[1])
        } catch (e) {
          console.error(`[${toolSlug}] Failed to parse JSON from markdown block:`, e)
        }
      } else {
        jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0])
          } catch (e) {
            console.error(`[${toolSlug}] Failed to parse JSON from text:`, e)
          }
        }
      }
    }

    // Fetch brand color
    let brandColor = '#8B5CF6'
    try {
      const { data: brandProfile } = await admin
        .from('brand_profiles')
        .select('brand_data')
        .eq('client_id', clientId)
        .single()

      if (brandProfile?.brand_data?.visual_identity?.colors?.primary) {
        brandColor = brandProfile.brand_data.visual_identity.colors.primary
      }
    } catch (e) {
      console.warn(`[${toolSlug}] Could not fetch brand color:`, e)
    }

    const resultWithBrandColor = {
      ...result,
      brandColor,
    }

    // Update queue with result
    const { error: updateError } = await admin
      .from('generation_queue')
      .update({
        status: 'completed',
        result_data: resultWithBrandColor,
        completed_at: new Date().toISOString(),
      })
      .eq('id', queueId)

    if (updateError) {
      console.error(`[${toolSlug}] Update error:`, updateError)
      throw new Error('Update failed')
    }

    console.log(`[${toolSlug}] ✅ Generated successfully: ${queueId}`)
    return queueId
  } catch (error) {
    console.error(`[${toolSlug}] Generation error:`, error)
    throw error
  }
}

export async function POST(req: NextRequest) {
  try {
    const { client_id, input_data } = await req.json()

    if (!client_id) {
      return NextResponse.json({ error: 'Missing client_id' }, { status: 400 })
    }

    // Batch generation allowed (internal endpoint)
    // In production, consider adding rate limiting or auth

    const admin = adminClient()
    const userId = null // batch-generated, no specific user

    console.log(`🚀 Starting batch generation for client: ${client_id}`)

    const results: Record<string, string> = {}
    const errors: Record<string, string> = {}

    // Generate all 10 tools sequentially (to avoid rate limits)
    for (const toolSlug of TOOLKIT_TOOLS) {
      try {
        const queueId = await generateToolReport(
          admin,
          client_id,
          userId,
          toolSlug,
          input_data[toolSlug] || {}
        )
        results[toolSlug] = queueId
        // Small delay between calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        errors[toolSlug] = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    console.log(`✅ Batch generation complete for ${client_id}`)

    return NextResponse.json({
      success: true,
      client_id,
      generated: results,
      errors,
      total: TOOLKIT_TOOLS.length,
      success_count: Object.keys(results).length,
    })
  } catch (error) {
    console.error('Batch generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch generation failed' },
      { status: 500 }
    )
  }
}
