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
    console.log('📋 Creating brand identity, visual assets, and references tables...')

    // These tables already exist from migrations, but we'll ensure they're set up correctly
    // We'll update brand_profiles with the data we can store there

    const clientId = 'e664873b-034d-48cd-9a45-8631672ef375'

    // Update brand profile with all available fields
    const { error: profile_error } = await supabase
      .from('brand_profiles')
      .update({
        name: 'Dadybox',
        mission: 'Revolucionar la logística de e-commerce en Latinoamérica',
        values: ['Velocidad', 'Precisión', 'Innovación'],
        tone_of_voice: 'Profesional, confiable, directo',
        description: 'Plataforma de logística inteligente para e-commerce que conecta almacenamiento, SGA, preparación de pedidos, packaging, envíos, checkout, tracking y devoluciones en una sola operación visible y escalable.'
      })
      .eq('client_id', clientId)

    if (profile_error) {
      console.error('❌ Profile update error:', profile_error.message)
      return NextResponse.json({ error: profile_error.message }, { status: 500 })
    }

    console.log('✅ Brand profile updated')

    // Insert complete content pillars
    const pillars = [
      {
        client_id: clientId,
        pillar_name: 'Radar Logístico',
        description: 'Pilar editorial semanal sobre actualidad, tendencias, crisis, operaciones complejas, nuevas leyes, tarifas, tecnología, casos de estudio y aprendizajes del ecosistema logístico mundial.',
        themes: [
          { name: 'Noticias logísticas', items: ['Nueva regulación', 'Tarifas', 'Cambios aduaneros', 'Rutas afectadas', 'Costes de transporte'] },
          { name: 'Case studies', items: ['Mundial 2026', 'Visita papal', 'Grandes conciertos', 'Eventos deportivos', 'Logística sanitaria'] },
          { name: 'Crisis management', items: ['Conflictos', 'Bloqueos', 'Huelgas', 'Disrupciones de rutas', 'Emergencias climáticas'] },
          { name: 'Tecnología y supply chain', items: ['SGA', 'Automatización', 'Tracking', 'IA', 'Robótica de almacén', 'Last mile'] }
        ],
        examples: ['Hook fuerte: una operación o dato que despierte curiosidad', 'Contexto: qué está pasando y por qué importa', 'Problema logístico: qué hay que mover o resolver', 'Lección para e-commerce: cómo aplicar el aprendizaje', 'Cierre Dadybox: conexión con control y operación escalable'],
        claim: 'Lo que pasa en la logística mundial también afecta a tu e-commerce.'
      },
      {
        client_id: clientId,
        pillar_name: 'Dadybox en Acción',
        description: 'Pilar dedicado a explicar los servicios, procesos y capacidades de Dadybox de forma clara, visual y comercial.',
        themes: [
          { name: 'SGA explicado', items: ['Qué es un SGA', 'Cuándo lo necesitas', 'Cómo reduce errores', 'Cómo mejora la trazabilidad'] },
          { name: 'Picking & packaging', items: ['Cómo se prepara un pedido', 'Cómo reducir errores', 'Cómo el packaging mejora experiencia'] },
          { name: 'Envíos y opciones', items: ['Económico', '24H', 'Premium', 'Promesas realistas'] },
          { name: 'Devoluciones', items: ['Cómo convertir devoluciones en datos', 'Cambios', 'Saldo en tienda', 'Reacondicionar o descartar'] },
          { name: 'Backstage Dadybox', items: ['Recepción de stock', 'Ubicación', 'Control', 'Preparación', 'Salida', 'Seguimiento'] }
        ],
        examples: ['Problema operativo concreto', 'Servicio Dadybox que lo resuelve', 'Cómo funciona el proceso', 'Qué mejora para el e-commerce', 'Resultado: menos errores, más control', 'CTA: reserva llamada'],
        claim: 'Así convertimos tu logística en una operación preparada para crecer.'
      },
      {
        client_id: clientId,
        pillar_name: 'Entregas Mágicas',
        description: 'Pilar creativo donde Dadybox imagina entregas imposibles en escenarios extremos para explicar desafíos logísticos reales.',
        themes: [
          { name: 'Entregas imposibles', items: ['Antártida', 'Etna', 'Islas remotas', 'Desiertos', 'Selvas', 'Bases científicas'] },
          { name: 'Entregas legendarias', items: ['Atlántida', 'Civilizaciones antiguas', 'Castillos', 'Ciudades perdidas'] },
          { name: 'Entregas de película', items: ['Mundos ficticios', 'Cultura pop', 'Cuidado legal'] },
          { name: 'Entregas extremas', items: ['Temperatura extrema', 'Acceso limitado', 'Documentación compleja', 'Riesgo alto'] }
        ],
        examples: ['Lugar imposible', 'Obstáculo principal', 'Datos técnicos o restricciones', 'Cómo lo resolvería Dadybox', 'Lección real para e-commerce', 'Cierre de marca'],
        claim: 'Si podemos imaginar la entrega imposible, podemos explicar mejor la logística real.'
      },
      {
        client_id: clientId,
        pillar_name: 'E-com Playbook',
        description: 'Pilar educativo con buenas prácticas, frameworks, casos de estudio y metodologías para mejorar la logística e-commerce.',
        themes: [
          { name: 'KPIs y métricas', items: ['OTIF', 'Tasa de error', 'Pedidos preparados/día', 'Rotura de stock', 'Coste por pedido', 'Tickets por envío'] },
          { name: 'Inventario fiable', items: ['Por qué tu stock es una promesa comercial', 'Cómo evitar vender problemas'] },
          { name: 'SGA y trazabilidad', items: ['Cuándo deja de ser opcional', 'Cómo se implementa', 'Qué mejora'] },
          { name: 'Checkout y devoluciones', items: ['Promesas de entrega', 'Fricción', 'Costes transparentes', 'Cambios', 'Saldo en tienda'] }
        ],
        examples: ['Problema real', 'Error común', 'Framework o criterio de decisión', 'Ejemplo práctico', 'Checklist accionable', 'CTA a recurso descargable'],
        claim: 'Mejores decisiones logísticas para vender con más control.'
      }
    ]

    let pillar_count = 0
    for (const pillar of pillars) {
      const { error } = await supabase
        .from('content_pillars')
        .upsert(pillar, { onConflict: 'client_id,pillar_name' })
      if (!error) pillar_count++
    }

    console.log(`✅ Content pillars: ${pillar_count}/4 loaded`)

    return NextResponse.json({
      status: '✅ Complete',
      brand_profile: true,
      content_pillars: pillar_count,
      message: 'Brand tables initialized - ready for UI edits'
    })
  } catch (e: any) {
    console.error('❌ Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
