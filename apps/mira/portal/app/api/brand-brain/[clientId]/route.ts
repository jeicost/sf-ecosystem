import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ clientId: string }>
}

export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { clientId } = await params
    const db = createClient()

    // Get brand profile
    const { data: profile, error: profileError } = await db
      .from('brand_profiles')
      .select('*')
      .eq('client_id', clientId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Brand profile not found' },
        { status: 404 }
      )
    }

    // Get content pillars
    const { data: pillars } = await db
      .from('content_pillars')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at')

    // Build complete Brand Brain object for agent consumption
    const brandBrain = {
      client_id: clientId,
      client_name: profile.name,
      updated_at: profile.updated_at,

      identity: {
        name: profile.name,
        mission: profile.mission,
        proposition: profile.proposition,
        tone_of_voice: profile.tone_of_voice,
        values: profile.values || [],
        description: profile.description,
      },

      content_pillars: (pillars || []).map(p => ({
        name: p.pillar_name,
        description: p.description,
        themes: p.themes || [],
        examples: p.examples || [],
      })),

      // Format for agent system prompt
      system_prompt_injection: `
You are an AI assistant representing ${profile.name}.

BRAND IDENTITY:
- Mission: ${profile.mission}
- Proposition: ${profile.proposition}
- Tone of Voice: ${profile.tone_of_voice}
- Core Values: ${(profile.values || []).join(', ')}
- Description: ${profile.description}

CONTENT PILLARS (key areas of expertise):
${(pillars || [])
  .map(
    p => `
- ${p.pillar_name}: ${p.description}
  Themes: ${(p.themes || []).map((t: any) => t.name || t).join(', ')}
`
  )
  .join('\n')}

When responding to users:
1. Represent ${profile.name}'s values and mission
2. Use the specified tone of voice
3. Reference relevant content pillars when applicable
4. Stay true to the brand's proposition
5. Provide expert guidance aligned with company values
`,
    }

    return NextResponse.json(brandBrain, {
      headers: {
        'Cache-Control': 'no-cache', // Fresh data on each request
      },
    })
  } catch (error: any) {
    console.error('Error fetching Brand Brain:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
