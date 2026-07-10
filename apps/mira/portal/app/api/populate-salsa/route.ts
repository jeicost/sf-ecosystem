import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceKey
  )

  const results: Record<string, any> = {}
  const salsa_id = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799'

  try {
    // Load Salsa brand profile
    const { error: bp_error } = await supabase
      .from('brand_profiles')
      .upsert({
        client_id: salsa_id,
        name: 'Salsa Burgers',
        mission: 'Crear la experiencia de burger más memorable del mercado',
        values: ['Autenticidad', 'Calidad', 'Comunidad', 'Innovación'],
        tone_of_voice: 'Casual, passionate, authentic. We dont take ourselves too seriously.',
        description: 'Premium burger joint with craft philosophy and neighborhood soul.',
        proposition: 'The burger that makes you feel alive.'
      })

    results.brand_profile = bp_error ? { error: bp_error.message } : { success: true }

    // Load Salsa pillars
    const pillars = [
      {
        client_id: salsa_id,
        pillar_name: 'Drive Craving',
        description: 'Making people hungry for Salsa Burgers',
        themes: [{ name: 'Visual storytelling' }, { name: 'Appetite appeal' }],
        examples: ['Behind the scenes', 'Burger photography']
      },
      {
        client_id: salsa_id,
        pillar_name: 'Ritual & Packaging',
        description: 'The unboxing experience matters',
        themes: [{ name: 'Brand experience' }, { name: 'First impression' }],
        examples: ['Packaging design', 'Opening ceremony']
      },
      {
        client_id: salsa_id,
        pillar_name: 'Brand Cult',
        description: 'Community and loyalty building',
        themes: [{ name: 'Community' }, { name: 'Belonging' }],
        examples: ['Loyalty program', 'Events', 'Exclusive access']
      },
      {
        client_id: salsa_id,
        pillar_name: 'Trust & Authenticity',
        description: 'Why people believe in Salsa Burgers',
        themes: [{ name: 'Sourcing story' }, { name: 'Quality' }],
        examples: ['Ingredient origin', 'Craft commitment', 'No shortcuts']
      }
    ]

    let pillar_count = 0
    for (const pillar of pillars) {
      const { error } = await supabase.from('content_pillars').upsert(pillar)
      if (!error) pillar_count++
    }

    results.pillars = { success: true, count: pillar_count }

    return NextResponse.json({ status: 'Salsa data loaded', results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
