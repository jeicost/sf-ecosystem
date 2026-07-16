import { NextRequest, NextResponse } from 'next/server'
import { Anthropic } from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { clientId, message, conversationHistory } = await request.json()

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }

    // 1. Get current Brand Brain data
    const db = createClient()
    const [brandProfiles, contentPillars] = await Promise.all([
      db
        .from('brand_profiles')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle(),
      db
        .from('content_pillars')
        .select('*')
        .eq('client_id', clientId)
        .limit(5),
    ])

    const currentBrandData = {
      brand: brandProfiles.data,
      pillars: contentPillars.data || [],
    }

    // 2. Create system prompt for Claude
    const systemPrompt = `You are an expert brand strategist chatbot helping founders complete their Brand Brain.

Current Brand Brain state:
${JSON.stringify(currentBrandData, null, 2)}

Your role:
1. Ask guided questions to fill gaps in the Brand Brain
2. When user answers, extract structured data
3. Ask follow-ups to go deeper
4. Celebrate progress and mark sections as complete

Question priority (in order):
1. Brand Identity (if missing): "What's your unique value prop? How are you different from competitors?"
2. Content Pillars (if < 3): "What are your 3-5 main content themes?"
3. Sales Context (if missing): "Tell me about your ideal customer and how you sell to them"
4. Agent Context (if missing): "What key documents or resources should AI agents know about?"

Style:
- Conversational and friendly, not stiff
- One question at a time
- Listen actively to previous answers
- When done with a section, confirm: "Got it! I've saved your [section name]"

IMPORTANT: When extracting structured data, format it EXACTLY like this:
<structured_data>
{
  "section": "brand_profiles" | "content_pillars" | "agent_documents" | "project_memory",
  "updates": {
    "field1": "value1",
    "field2": "value2"
  },
  "completeness_percent": 50 | 75 | 100
}
</structured_data>

When ALL sections are complete (brand + pillars + sales + context), end with:
<conversation_complete>true</conversation_complete>`

    // 3. Call Claude with conversation history
    const messages = conversationHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }))

    messages.push({
      role: 'user' as const,
      content: message,
    })

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-1',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages,
    })

    const botText =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // 4. Extract structured data if present
    const structuredMatch = botText.match(
      /<structured_data>([\s\S]*?)<\/structured_data>/
    )
    let structuredData = null

    if (structuredMatch) {
      try {
        structuredData = JSON.parse(structuredMatch[1])
      } catch (e) {
        console.error('Failed to parse structured data:', e)
      }
    }

    // 5. Check if conversation is complete
    const isComplete = botText.includes('<conversation_complete>true</conversation_complete>')

    // 6. Save structured data to Supabase if extracted
    if (structuredData) {
      await saveBrandBrainUpdate(db, clientId, structuredData)
    }

    // 7. Return response
    const cleanBotText = botText
      .replace(/<structured_data>[\s\S]*?<\/structured_data>/, '')
      .replace(/<conversation_complete>[\s\S]*?<\/conversation_complete>/, '')
      .trim()

    return NextResponse.json({
      botMessage: cleanBotText,
      structuredData,
      conversationComplete: isComplete,
    })
  } catch (error) {
    console.error('Chatbot error:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}

async function saveBrandBrainUpdate(
  db: any,
  clientId: string,
  data: any
) {
  const { section, updates } = data

  try {
    if (section === 'brand_profiles') {
      await db.from('brand_profiles').upsert({
        client_id: clientId,
        ...updates,
        updated_at: new Date().toISOString(),
      })
    } else if (section === 'content_pillars') {
      await db.from('content_pillars').insert({
        client_id: clientId,
        ...updates,
        created_at: new Date().toISOString(),
      })
    } else if (section === 'agent_documents') {
      await db.from('agent_documents').insert({
        client_id: clientId,
        ...updates,
        created_at: new Date().toISOString(),
      })
    } else if (section === 'project_memory') {
      await db.from('project_memory').insert({
        client_id: clientId,
        ...updates,
        created_at: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('Error saving brand brain update:', error)
  }
}

