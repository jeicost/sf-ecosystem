import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nnevhtfxuawexliwlbmh.supabase.co'
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)
const clientId = 'e664873b-034d-48cd-9a45-8631672ef375'

async function populate() {
  try {
    console.log('📦 Inserting Dadybox brand profile...')

    // Insert brand profile with correct schema
    const { data: profile, error: profile_error } = await supabase
      .from('brand_profiles')
      .upsert({
        client_id: clientId,
        brand_name: 'Dadybox',
        industry: 'Logística e-commerce',
        tone_of_voice: 'Profesional, confiable, directo',
        target_audience: 'E-commerce sellers, startups en Latinoamérica que necesitan logística',
        value_propositions: ['Logística inteligente', 'Velocidad de entrega', 'Precios competitivos', 'API integrada'],
        visual_guidelines: {
          primary_color: '#7C3AED',
          secondary_color: '#A78BFA',
          font_family: 'Inter, sans-serif'
        }
      }, { onConflict: 'client_id' })
      .select()

    if (profile_error) {
      console.error('❌ Brand profile error:', profile_error.message)
    } else {
      console.log('✅ Brand profile created/updated')
    }

    // Insert content pillars
    console.log('📝 Inserting content pillars...')
    const pillars = [
      {
        client_id: clientId,
        title: 'Radar Logístico',
        description: 'Inteligencia de datos sobre flujos de logística',
        keywords: ['analytics', 'data', 'logistics', 'prediction'],
        is_active: true
      },
      {
        client_id: clientId,
        title: 'Automatización Inteligente',
        description: 'Procesos que se optimizan sin intervención humana',
        keywords: ['automation', 'ai', 'optimization'],
        is_active: true
      },
      {
        client_id: clientId,
        title: 'Confianza y Transparencia',
        description: 'Clientes saben dónde está su envío siempre',
        keywords: ['transparency', 'tracking', 'trust'],
        is_active: true
      },
      {
        client_id: clientId,
        title: 'Ventaja Competitiva: Velocidad',
        description: 'Más rápido que la competencia siempre',
        keywords: ['speed', 'competitive', 'fast'],
        is_active: true
      }
    ]

    let inserted = 0
    for (const pillar of pillars) {
      const { error } = await supabase
        .from('content_pillars')
        .insert([pillar])

      if (!error) {
        inserted++
        console.log(`  ✅ "${pillar.title}"`)
      } else {
        console.log(`  ⚠️ "${pillar.title}": ${error.message}`)
      }
    }

    console.log(`\n✅ Complete: 1 brand profile + ${inserted}/4 content pillars`)
  } catch (e: any) {
    console.error('❌ Error:', e.message)
    process.exit(1)
  }
}

populate()
