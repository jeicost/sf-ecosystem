import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { createMessageForClient } from '@/lib/anthropic-client'
import { GROUNDING_CONTRACT } from '@/lib/grounding/grounding-contract'

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

    if (authError || !user) {
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
    const analysisPrompt = `You are a brand strategist reviewing a document a client uploaded to enrich their Brand Brain. Your job is extraction, not invention — surface what this SPECIFIC document actually says, don't pad it with generic brand-strategy filler.

DOCUMENT TYPE: ${doc.document_type}
EXTRACTED TEXT:
${doc.extracted_text?.substring(0, 8000) || 'No text extracted'}

CURRENT BRAND PROFILE (if exists):
${profile?.brand_data ? JSON.stringify(profile.brand_data, null, 2) : 'No existing profile'}

Rules:
- Only include a field if the document states or clearly implies it — omit fields entirely rather than guessing from the document type alone (a pitch deck doesn't automatically have a "strategy_roadmap" unless it actually lays one out).
- If the document CONTRADICTS the current brand profile on a field (not just phrased differently — an actual conflict, e.g. a different tagline or a different target audience), still include your clean extracted value in its normal field (no prefix, no annotation inline) AND add a separate entry to the top-level "contradictions" array describing the conflict — the reviewer needs to see the conflict flagged clearly, not buried inside the value itself.
- Quote or closely paraphrase the document's own language where possible (tone_and_voice, tagline, mission) instead of rewording it into generic corporate phrasing.
- hero_features and audiences must be things the document itself lists or describes — not features you'd assume this type of business has.

Return ONLY valid JSON (no markdown, no text before/after) with suggested updates for these fields:
{
  "identity": { "name": "", "tagline": "", "one_liner": "", "mission": "", "vision": "", "enemy": "" },
  "what_it_is": "",
  "audiences": [{ "name": "", "segment": "", "pain_point": "" }],
  "value_proposition": "",
  "hero_features": { "feature_1": "", "feature_2": "", "feature_3": "" },
  "business_model": "",
  "tone_and_voice": { "attribute": "value" },
  "visual_identity": "",
  "competitive_positioning": "",
  "go_to_market": "",
  "strategy_roadmap": "",
  "contradictions": [{ "field_path": "identity.tagline", "existing_value_excerpt": "", "proposed_value_excerpt": "", "note": "1 frase de por qué es un conflicto real" }]
}

${GROUNDING_CONTRACT}`

    const message = await createMessageForClient(clientId, 'brand-brain/analyze-document', {
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

    // Contradicciones estructuradas (Fase 2) -- best-effort, un fallo aquí no
    // debe romper el análisis ya guardado.
    const rawContradictions = (suggestedUpdates as Record<string, unknown>)?.contradictions
    if (jsonParseSuccess && Array.isArray(rawContradictions) && rawContradictions.length) {
      try {
        for (const c of rawContradictions as Array<Record<string, unknown>>) {
          const fieldPath = typeof c.field_path === 'string' ? c.field_path : null
          const note = typeof c.note === 'string' ? c.note : null
          if (!fieldPath || !note) continue

          const { data: alreadyOpen } = await admin
            .from('brain_contradictions')
            .select('id')
            .eq('client_id', clientId)
            .eq('field_path', fieldPath)
            .eq('status', 'open')
            .limit(1)
          if (alreadyOpen?.length) continue

          await admin.from('brain_contradictions').insert({
            client_id: clientId,
            field_path: fieldPath,
            existing_value_excerpt: typeof c.existing_value_excerpt === 'string' ? c.existing_value_excerpt : null,
            proposed_value_excerpt: typeof c.proposed_value_excerpt === 'string' ? c.proposed_value_excerpt : null,
            note,
            source_type: 'document_analysis',
          })
        }
      } catch (contradictionError) {
        console.error('analyze-document: failed to record contradictions:', contradictionError)
      }
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
