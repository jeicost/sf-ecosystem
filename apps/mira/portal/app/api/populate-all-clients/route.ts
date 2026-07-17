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

  try {
    const clients = {
      salsa: {
        id: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
        name: 'Salsa Burgers',
        mission: 'Crear la experiencia de burger más memorable del mercado',
        values: ['Autenticidad', 'Calidad', 'Comunidad', 'Innovación'],
        tone_of_voice: 'Casual, passionate, authentic. We dont take ourselves too seriously.',
        description: 'Premium burger joint con filosofía craft que conecta almacenamiento, preparación, delivery y experiencia del cliente.',
        proposition: 'The burger that makes you feel alive.'
      },
      discoolver: {
        id: '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
        name: 'Discoolver',
        mission: 'Revolucionar la forma en que las marcas descubren y comprenden a su audiencia',
        values: ['Transparencia', 'Innovación', 'Impacto', 'Precisión'],
        tone_of_voice: 'Experto, conversacional, empoderador. Técnico pero accesible.',
        description: 'Plataforma de descubrimiento de audiencias que convierte datos en insights y estrategias de crecimiento.',
        proposition: 'Entiende tu audiencia. Crece con confianza.'
      },
      startup_factory: {
        id: 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
        name: 'Startup Factory',
        mission: 'Construir un ecosistema donde emprendedores escalan con mentoría, tecnología y capital',
        values: ['Colaboración', 'Velocidad', 'Excelencia', 'Impacto'],
        tone_of_voice: 'Inspirador, directo, emprendedor. Próximo pero profesional.',
        description: 'Aceleradora e inversor que acompaña startups desde ideación hasta escala, con servicios de design, CRM, reporte y IA.',
        proposition: 'Escalamos juntos.'
      }
    }

    let updatedCount = 0

    for (const [key, clientData] of Object.entries(clients)) {
      const { error } = await supabase
        .from('brand_profiles')
        .upsert(clientData, { onConflict: 'client_id' })

      if (!error) updatedCount++
    }

    console.log(`✅ Profiles updated: ${updatedCount}/3`)

    // Now populate pillars for each client (Dadybox managed separately by populate-dadybox endpoint)
    const pillarsData = {
      salsa: [
        {
          client_id: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
          pillar_name: 'Drive Craving',
          description: 'Haciendo la gente hambre por Salsa Burgers a través de storytelling visual y apetito visual.',
          themes: [{ name: 'Behind the scenes' }, { name: 'Visual storytelling' }, { name: 'Appetite appeal' }],
          examples: ['Visual potente', 'Storytelling', 'Hook emocional', 'Cierre CTA']
        },
        {
          client_id: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
          pillar_name: 'Ritual & Packaging',
          description: 'La experiencia de desempacar y disfrutar es parte de la marca.',
          themes: [{ name: 'Packaging design' }, { name: 'Brand experience' }, { name: 'First impression' }],
          examples: ['Unboxing', 'Experience', 'Design', 'Beneficio']
        },
        {
          client_id: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
          pillar_name: 'Brand Cult',
          description: 'Construcción de comunidad y lealtad de marca.',
          themes: [{ name: 'Community' }, { name: 'Belonging' }, { name: 'Loyalty' }],
          examples: ['Comunidad', 'Evento', 'Acceso exclusivo', 'Engagement']
        },
        {
          client_id: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
          pillar_name: 'Trust & Authenticity',
          description: 'Por qué la gente cree en Salsa Burgers y sigue comprando.',
          themes: [{ name: 'Sourcing story' }, { name: 'Quality' }, { name: 'Craft' }],
          examples: ['Origen de ingredientes', 'Compromiso craft', 'Sin atajos']
        }
      ],
      discoolver: [
        {
          client_id: '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
          pillar_name: 'Insights & Discovery',
          description: 'Cómo Discoolver descubre patrones ocultos en datos de audiencia.',
          themes: [{ name: 'Data patterns' }, { name: 'Audience insights' }, { name: 'Discovery methodology' }],
          examples: ['Patrón descubierto', 'Insight actionable', 'Impacto en negocio']
        },
        {
          client_id: '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
          pillar_name: 'Growth Stories',
          description: 'Casos de marcas que crecieron al entender su audiencia.',
          themes: [{ name: 'Before/after' }, { name: 'Growth trajectory' }, { name: 'Market impact' }],
          examples: ['Marca X antes', 'Marca X después', 'Métrica de crecimiento']
        },
        {
          client_id: '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
          pillar_name: 'Audience Mastery',
          description: 'Metodología y frameworks para entender audiencia profundamente.',
          themes: [{ name: 'Segmentation' }, { name: 'Behavior mapping' }, { name: 'Prediction' }],
          examples: ['Framework', 'Aplicación', 'Resultado']
        },
        {
          client_id: '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
          pillar_name: 'Tech & Innovation',
          description: 'Las capacidades técnicas que hacen posible el descubrimiento.',
          themes: [{ name: 'AI & ML' }, { name: 'Data infrastructure' }, { name: 'Real-time processing' }],
          examples: ['Tecnología explicada', 'Capacidad única', 'Ventaja competitiva']
        }
      ],
      startup_factory: [
        {
          client_id: 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
          pillar_name: 'Ecosystem & Network',
          description: 'El poder de estar conectado con mentores, inversores y peers.',
          themes: [{ name: 'Community' }, { name: 'Collaboration' }, { name: 'Network effect' }],
          examples: ['Conexión founder', 'Valor del network', 'Deal flow']
        },
        {
          client_id: 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
          pillar_name: 'Build with Purpose',
          description: 'Cómo construir productos que resuelven problemas reales.',
          themes: [{ name: 'Problem-solution fit' }, { name: 'User-centric design' }, { name: 'MVP thinking' }],
          examples: ['Problema real', 'Solución elegante', 'Market fit']
        },
        {
          client_id: 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
          pillar_name: 'Scale Stories',
          description: 'Historias de startups que escalaron y lecciones aprendidas.',
          themes: [{ name: 'Growth trajectory' }, { name: 'Milestone moments' }, { name: 'Challenges overcome' }],
          examples: ['Startup journey', 'Inflection point', 'Impacto']
        },
        {
          client_id: 'cef0a1b7-aabb-4239-a5a8-28ece0d1819b',
          pillar_name: 'Founders First',
          description: 'Educación y herramientas para que founders tomen mejores decisiones.',
          themes: [{ name: 'Fundraising' }, { name: 'Product strategy' }, { name: 'Team building' }],
          examples: ['Framework decisión', 'Checklist', 'Playbook']
        }
      ]
    }

    let pillarCount = 0
    for (const [key, pillars] of Object.entries(pillarsData)) {
      for (const pillar of pillars) {
        const { error } = await supabase
          .from('content_pillars')
          .upsert(pillar, { onConflict: 'client_id,pillar_name' })
        if (!error) pillarCount++
      }
    }

    console.log(`✅ Pillars loaded: ${pillarCount}/16`)

    return NextResponse.json({
      status: '✅ Complete',
      clients_updated: updatedCount,
      pillars_loaded: pillarCount,
      message: 'All 4 clients (Dadybox, Salsa, Discoolver, Startup Factory) fully loaded with complete brand data'
    })
  } catch (e: any) {
    console.error('❌ Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
