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
  if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceKey
  )

  const results: Record<string, any> = {}

  try {
    // Ensure Dadybox client exists
    const { error: dadybox_error } = await supabase
      .from('clients')
      .upsert({
        id: 'e664873b-034d-48cd-9a45-8631672ef375',
        name: 'Dadybox',
        slug: 'dadybox',
        status: 'active'
      })

    results.dadybox_client = dadybox_error ? { error: dadybox_error.message } : { success: true }

    // Ensure Salsa Burgers client exists
    const { error: salsa_error } = await supabase
      .from('clients')
      .upsert({
        id: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
        name: 'Salsa Burgers',
        slug: 'salsa-burgers',
        status: 'active'
      })

    results.salsa_client = salsa_error ? { error: salsa_error.message } : { success: true }

    // Ensure Discoolver client exists
    const { error: disc_error } = await supabase
      .from('clients')
      .upsert({
        id: '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
        name: 'Discoolver',
        slug: 'discoolver',
        status: 'active'
      })

    results.discoolver_client = disc_error ? { error: disc_error.message } : { success: true }

    // Now load brand profiles
    const { error: bp_dadybox } = await supabase
      .from('brand_profiles')
      .upsert({
        client_id: 'e664873b-034d-48cd-9a45-8631672ef375',
        name: 'Dadybox',
        mission: 'Revolucionar la logística de e-commerce en Latinoamérica',
        values: ['Velocidad', 'Precisión', 'Innovación'],
        tone_of_voice: 'Profesional, confiable, directo',
        description: 'Plataforma de logística inteligente para e-commerce',
        proposition: 'La logística es tu competencia, no tu burden'
      })

    results.dadybox_profile = bp_dadybox ? { error: bp_dadybox.message } : { success: true }

    // Salsa brand profile
    const { error: bp_salsa } = await supabase
      .from('brand_profiles')
      .upsert({
        client_id: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
        name: 'Salsa Burgers',
        mission: 'Crear la experiencia de burger más memorable del mercado',
        values: ['Autenticidad', 'Calidad', 'Comunidad'],
        tone_of_voice: 'Casual, passionate, authentic',
        description: 'Premium burger joint con filosofía craft',
        proposition: 'The burger that makes you feel alive'
      })

    results.salsa_profile = bp_salsa ? { error: bp_salsa.message } : { success: true }

    return NextResponse.json({ status: 'Clients initialized', results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
