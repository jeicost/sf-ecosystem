import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

    // Authorization: verify user has access to this client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    const admin = adminClient()
    let clientId: string

    if (process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true' && (!user || authError)) {
      clientId = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799'
    } else if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } else {
      const { data: accessData } = await admin
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1)

      if (!accessData?.length) {
        return NextResponse.json({ error: 'No client access' }, { status: 403 })
      }
      clientId = accessData[0].project_id
    }

    // Get the document (verify ownership)
    const { data: doc, error: docError } = await admin
      .from('brand_documents')
      .select('*')
      .eq('id', document_id)
      .eq('client_id', clientId)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 })
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
      model: 'claude-opus-4-8',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
    })

    // Extract and validate JSON from response
    let suggestedUpdates = {}
    let jsonParseSuccess = false
    const textContent = message.content[0]

    if (textContent && 'text' in textContent) {
      const text = textContent.text

      // Try markdown code block first
      let jsonMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
      if (jsonMatch) {
        try {
          suggestedUpdates = JSON.parse(jsonMatch[1])
          jsonParseSuccess = true
        } catch (e) {
          console.error('Failed to parse JSON from markdown:', e)
        }
      }

      // If markdown failed, try direct JSON with brace counting
      if (!jsonParseSuccess) {
        let braceCount = 0
        let jsonStart = -1
        let jsonEnd = -1

        for (let i = 0; i < text.length; i++) {
          if (text[i] === '{') {
            if (braceCount === 0) jsonStart = i
            braceCount++
          } else if (text[i] === '}') {
            braceCount--
            if (braceCount === 0 && jsonStart !== -1) {
              jsonEnd = i + 1
              break
            }
          }
        }

        if (jsonStart !== -1 && jsonEnd !== -1) {
          try {
            const potentialJson = text.substring(jsonStart, jsonEnd)
            suggestedUpdates = JSON.parse(potentialJson)
            jsonParseSuccess = true
          } catch (e) {
            console.error('Failed to parse JSON from text:', e)
          }
        }
      }
    }

    // Store analysis results
    const analysisStatus = jsonParseSuccess ? 'completed' : 'failed'
    const analysisResult = jsonParseSuccess
      ? suggestedUpdates
      : { error: 'Failed to extract valid JSON from Claude response' }

    const { error: updateError } = await admin
      .from('brand_documents')
      .update({
        analysis_status: analysisStatus,
        analysis_result: analysisResult,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', document_id)

    if (updateError) {
      console.error('Error storing analysis:', updateError)
    }

    // Return error if JSON parsing failed
    if (!jsonParseSuccess) {
      return NextResponse.json({
        success: false,
        document_id,
        error: 'Analysis failed: could not extract valid JSON from Claude response',
        message: 'Document analysis failed. Please try again or upload a different document.',
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      document_id,
      suggestedUpdates,
      message: 'Document analyzed. Review suggested updates.',
    }, { status: 200 })
  } catch (error) {
    console.error('Document analysis error:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
