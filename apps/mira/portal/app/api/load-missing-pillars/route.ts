import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey || serviceKey === 'placeholder') {
    // Try with environment variable from Vercel
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })
    }

    // Use anon key as fallback (relies on RLS public policies)
    const supabase = createAdminClient(supabaseUrl, supabaseKey)

    try {
      // Insert Discoolver pillars
      const discoolverPillars = [
        {
          client_id: '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
          name: 'Insights & Discovery',
          description: 'Cómo Discoolver descubre patrones ocultos en datos de audiencia.',
          themes: ['Data patterns', 'Audience insights', 'Discovery methodology'],
          examples: ['Patrón descubierto', 'Insight actionable', 'Impacto en negocio']
        },
        {
          client_id: '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
          name: 'Growth Stories',
          description: 'Casos de marcas que crecieron al entender su audiencia.',
          themes: ['Before/after', 'Growth trajectory', 'Market impact'],
          examples: ['Marca X antes', 'Marca X después', 'Métrica de crecimiento']
        },
        {
          client_id: '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
          name: 'Audience Mastery',
          description: 'Metodología y frameworks para entender audiencia profundamente.',
          themes: ['Segmentation', 'Behavior mapping', 'Prediction'],
          examples: ['Framework', 'Aplicación', 'Resultado']
        },
        {
          client_id: '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
          name: 'Tech & Innovation',
          description: 'Las capacidades técnicas que hacen posible el descubrimiento.',
          themes: ['AI & ML', 'Data infrastructure', 'Real-time processing'],
          examples: ['Tecnología explicada', 'Capacidad única', 'Ventaja competitiva']
        }
      ]

      // Insert Startup Factory pillars
      const sfPillars = [
        {
          client_id: 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
          name: 'Ecosystem & Network',
          description: 'El poder de estar conectado con mentores, inversores y peers.',
          themes: ['Community', 'Collaboration', 'Network effect'],
          examples: ['Conexión founder', 'Valor del network', 'Deal flow']
        },
        {
          client_id: 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
          name: 'Build with Purpose',
          description: 'Cómo construir productos que resuelven problemas reales.',
          themes: ['Problem-solution fit', 'User-centric design', 'MVP thinking'],
          examples: ['Problema real', 'Solución elegante', 'Market fit']
        },
        {
          client_id: 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
          name: 'Scale Stories',
          description: 'Historias de startups que escalaron y lecciones aprendidas.',
          themes: ['Growth trajectory', 'Milestone moments', 'Challenges overcome'],
          examples: ['Startup journey', 'Inflection point', 'Impacto']
        },
        {
          client_id: 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
          name: 'Founders First',
          description: 'Educación y herramientas para que founders tomen mejores decisiones.',
          themes: ['Fundraising', 'Product strategy', 'Team building'],
          examples: ['Framework decisión', 'Checklist', 'Playbook']
        }
      ]

      // Insert all pillars
      const allPillars = [...discoolverPillars, ...sfPillars]

      let successCount = 0
      for (const pillar of allPillars) {
        const { error } = await supabase
          .from('content_pillars')
          .insert(pillar)

        if (!error) successCount++
        else console.error(`Error inserting ${pillar.name}:`, error.message)
      }

      return NextResponse.json({
        status: '✅ Complete',
        discoolver_pillars: 4,
        startup_factory_pillars: 4,
        total_inserted: successCount,
        message: 'Missing pillars loaded for Discoolver and Startup Factory'
      })
    } catch (e: any) {
      console.error('❌ Error:', e.message)
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Service key required' }, { status: 400 })
}
