import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAuthGate } from '@/lib/auth-gate'

export async function POST() {
  try {
    await requireAuthGate()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'No service key configured' }, { status: 500 })
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceKey
  )

  const results: Record<string, any> = {}

  try {
    // Load Dadybox brand profile
    const { error: bp_error } = await supabase
      .from('brand_profiles')
      .upsert({
        client_id: 'e664873b-034d-48cd-9a45-8631672ef375',
        name: 'Dadybox',
        mission: 'Revolucionar la logística de e-commerce en Latinoamérica con tecnología de IA y automatización.',
        values: ['Velocidad', 'Precisión', 'Innovación', 'Transparencia', 'Servicio al Cliente'],
        tone_of_voice: 'Profesional, confiable, directo. Nosotros resolvemos el problema, no lo complicamos.',
        description: 'Dadybox es una plataforma de logística inteligente para e-commerce que utiliza IA.',
        proposition: 'La logística es tu competencia, no tu burden. Dadybox la maneja.'
      })

    results.dadybox_brand_profile = bp_error ? { error: bp_error.message } : { success: true }

    // Load Salsa brand profile
    const { error: salsa_bp_error } = await supabase
      .from('brand_profiles')
      .upsert({
        client_id: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
        name: 'Salsa Burgers',
        mission: 'Crear la experiencia de burger más memorable del mercado.',
        values: ['Autenticidad', 'Calidad', 'Comunidad', 'Innovación'],
        tone_of_voice: 'Casual, passionate, authentic. We dont take ourselves too seriously.',
        description: 'Premium burger joint with craft philosophy and neighborhood soul.',
        proposition: 'The burger that makes you feel alive.'
      })

    results.salsa_brand_profile = salsa_bp_error ? { error: salsa_bp_error.message } : { success: true }

    // Load Dadybox pillars
    const dadybox_pillars = [
      {
        client_id: 'e664873b-034d-48cd-9a45-8631672ef375',
        pillar_name: 'Radar Logístico',
        description: 'Inteligencia de datos sobre flujos de logística',
        themes: [{ name: 'Predicción de Demanda' }, { name: 'Optimización de Rutas' }],
        examples: ['Black Friday', 'Seasonal trends']
      },
      {
        client_id: 'e664873b-034d-48cd-9a45-8631672ef375',
        pillar_name: 'Dadybox en Acción',
        description: 'Casos de éxito y ROI real',
        themes: [{ name: 'Case Studies' }],
        examples: ['E-commerce success stories']
      },
      {
        client_id: 'e664873b-034d-48cd-9a45-8631672ef375',
        pillar_name: 'Entregas Mágicas',
        description: 'La experiencia del cliente final',
        themes: [{ name: 'Customer Experience' }],
        examples: ['Tracking', 'Notifications']
      },
      {
        client_id: 'e664873b-034d-48cd-9a45-8631672ef375',
        pillar_name: 'E-com Playbook',
        description: 'Mejores prácticas para e-commerce',
        themes: [{ name: 'Best Practices' }],
        examples: ['Fulfillment strategies']
      }
    ]

    for (const pillar of dadybox_pillars) {
      const { error } = await supabase.from('content_pillars').upsert(pillar, { onConflict: 'client_id,pillar_name' })
      if (error) {
        results.dadybox_pillar_error = error.message
        break
      }
    }

    results.dadybox_pillars = { success: true, count: dadybox_pillars.length }

    // Load Salsa pillars
    const salsa_pillars = [
      {
        client_id: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
        pillar_name: 'Drive Craving',
        description: 'Making people hungry for Salsa',
        themes: [{ name: 'Visual storytelling' }],
        examples: ['Behind the scenes', 'Burger photography']
      },
      {
        client_id: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
        pillar_name: 'Ritual & Packaging',
        description: 'The unboxing experience',
        themes: [{ name: 'Brand experience' }],
        examples: ['Packaging design', 'First impression']
      },
      {
        client_id: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
        pillar_name: 'Brand Cult',
        description: 'Community and loyalty',
        themes: [{ name: 'Community building' }],
        examples: ['Loyalty program', 'Events']
      },
      {
        client_id: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
        pillar_name: 'Trust & Authenticity',
        description: 'Why people believe in us',
        themes: [{ name: 'Authenticity' }],
        examples: ['Sourcing story', 'Quality commitment']
      }
    ]

    for (const pillar of salsa_pillars) {
      const { error } = await supabase.from('content_pillars').upsert(pillar, { onConflict: 'client_id,pillar_name' })
      if (error) {
        results.salsa_pillar_error = error.message
        break
      }
    }

    results.salsa_pillars = { success: true, count: salsa_pillars.length }

    return NextResponse.json({
      status: 'Data loaded successfully',
      results
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
