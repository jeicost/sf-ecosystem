import { createClient } from '@supabase/supabase-js'
import { NextResponse, NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    return NextResponse.json({ error: 'Missing Supabase config' }, { status: 500 })
  }

  const supabase = createClient(url, anonKey)

  try {
    console.log('📥 Loading missing clients...')

    // Insert brand profiles for Discoolver and Startup Factory
    const { error: profileError } = await supabase
      .from('brand_profiles')
      .upsert([
        {
          client_id: '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
          name: 'Discoolver',
          mission: 'Revolucionar la forma en que las marcas descubren y comprenden a su audiencia',
          values: ['Transparencia', 'Innovación', 'Impacto', 'Precisión'],
          tone_of_voice: 'Experto, conversacional, empoderador. Técnico pero accesible.',
          description: 'Plataforma de descubrimiento de audiencias que convierte datos en insights y estrategias de crecimiento.',
          proposition: 'Entiende tu audiencia. Crece con confianza.'
        },
        {
          client_id: 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
          name: 'Startup Factory',
          mission: 'Construir un ecosistema donde emprendedores escalan con mentoría, tecnología y capital',
          values: ['Colaboración', 'Velocidad', 'Excelencia', 'Impacto'],
          tone_of_voice: 'Inspirador, directo, emprendedor. Próximo pero profesional.',
          description: 'Aceleradora e inversor que acompaña startups desde ideación hasta escala, con servicios de design, CRM, reporte y IA.',
          proposition: 'Escalamos juntos.'
        }
      ], { onConflict: 'client_id' })

    if (profileError) {
      console.error('Error inserting profiles:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    console.log('✅ Profiles inserted')

    // Insert content pillars
    const { error: pillarError } = await supabase
      .from('content_pillars')
      .upsert([
        // Discoolver pillars
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
        },
        // Startup Factory pillars
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
      ], { onConflict: 'client_id,name' })

    if (pillarError) {
      console.error('Error inserting pillars:', pillarError)
      return NextResponse.json({ error: pillarError.message }, { status: 500 })
    }

    console.log('✅ Pillars inserted')

    return NextResponse.json({
      status: '✅ Complete',
      profiles_loaded: 2,
      pillars_loaded: 8,
      message: 'Discoolver and Startup Factory fully loaded'
    })
  } catch (e: any) {
    console.error('❌ Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
