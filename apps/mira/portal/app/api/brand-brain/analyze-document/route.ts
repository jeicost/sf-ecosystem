import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { document_id } = body

    if (!document_id) {
      return NextResponse.json({ error: 'Missing document_id' }, { status: 400 })
    }

    const admin = adminClient()

    // Get the document
    const { data: doc, error: docError } = await admin
      .from('brand_documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Mark as processing
    await admin
      .from('brand_documents')
      .update({ analysis_status: 'processing' })
      .eq('id', document_id)

    // Get current brand profile for context
    const { data: profile } = await admin
      .from('brand_profiles')
      .select('*')
      .eq('id', doc.brand_profile_id)
      .single()

    // Call Claude to analyze document
    const analysisPrompt = `You are a brand strategy expert. Analyze this document and extract information that could enhance a brand's Brand Brain profile.

DOCUMENT TYPE: ${doc.document_type}
EXTRACTED TEXT:
${doc.extracted_text?.substring(0, 8000) || 'No text extracted'}

CURRENT BRAND PROFILE (if exists):
${profile?.brand_data ? JSON.stringify(profile.brand_data, null, 2) : 'No existing profile'}

Analyze the document and return ONLY valid JSON (no markdown, no text before/after) with suggested updates for these fields:
{
  "identity": { "name": "", "tagline": "", "one_liner": "", "mission": "", "vision": "", "enemy": "" },
  "what_it_is": "",
  "audiences": ["..."],
  "value_proposition": "",
  "hero_features": { "feature_1": "", "feature_2": "", "feature_3": "" },
  "business_model": "",
  "tone_and_voice": { "attribute": "value" },
  "visual_identity": "",
  "competitive_positioning": "",
  "go_to_market": "",
  "strategy_roadmap": ""
}

Only include fields where you found relevant information. Leave empty/null for fields with no clear data.`

    const message = await claude.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    })

    // Extract JSON from response
    let suggestedUpdates = {}
    const textContent = message.content[0]
    if (textContent && 'text' in textContent) {
      const text = textContent.text

      // Try markdown code block first
      let jsonMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        try {
          suggestedUpdates = JSON.parse(jsonMatch[1])
        } catch (e) {
          console.error('Failed to parse JSON from markdown:', e)
        }
      } else {
        // Try direct JSON
        jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            suggestedUpdates = JSON.parse(jsonMatch[0])
          } catch (e) {
            console.error('Failed to parse JSON:', e)
          }
        }
      }
    }

    // Store analysis results
    const { error: updateError } = await admin
      .from('brand_documents')
      .update({
        analysis_status: 'completed',
        analysis_result: suggestedUpdates,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', document_id)

    if (updateError) {
      console.error('Error storing analysis:', updateError)
    }

    return NextResponse.json({
      success: true,
      document_id,
      suggestedUpdates,
      message: 'Document analyzed. Review suggested updates.',
    }, { status: 200 })
  } catch (error) {
    console.error('Document analysis error:', error)

    // Mark as failed
    if (body?.document_id) {
      const admin = adminClient()
      await admin
        .from('brand_documents')
        .update({
          analysis_status: 'failed',
          analysis_result: { error: error instanceof Error ? error.message : 'Unknown error' },
        })
        .eq('id', body.document_id)
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
