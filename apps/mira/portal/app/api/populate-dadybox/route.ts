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
  const dadybox_id = 'e664873b-034d-48cd-9a45-8631672ef375'

  try {
    // Load Dadybox brand profile with complete brand system v1.0
    const { error: bp_error } = await supabase
      .from('brand_profiles')
      .upsert({
        client_id: dadybox_id,
        name: 'Dadybox',
        mission: 'Ayudar a marcas e-commerce a crecer con una logística más simple, visible y escalable, conectando stock, pedidos, envíos y devoluciones en una operación fiable que libera tiempo, reduce errores y mejora la experiencia de cliente.',
        vision: 'Convertirse en el partner logístico de referencia para e-commerce que buscan escalar con control, transparencia y una experiencia de entrega profesional.',
        values: JSON.stringify([
          { name: 'Control', definition: 'La logística no puede ser una caja negra. Visibilidad sobre pedidos, stock, envíos y devoluciones.' },
          { name: 'Fiabilidad', definition: 'Preparación correcta, stock actualizado, tracking claro, entrega realista y devoluciones trazables.' },
          { name: 'Simplicidad', definition: 'Reducir complejidad operativa: menos hojas de cálculo, menos fricción, menos incertidumbre.' },
          { name: 'Escalabilidad', definition: 'Capacidad para acompañar crecimiento, campañas, lanzamientos, rebajas y picos como Black Friday.' },
          { name: 'Cercanía profesional', definition: 'Lenguaje experto pero entendible. Acompañar sin sonar frío ni excesivamente corporativo.' }
        ]),
        personality_tone: JSON.stringify({
          archetypes: ['El Aliado Experto', 'El Mago Operativo'],
          principles: [
            { name: 'Claro', example: 'Controla stock, pedidos y devoluciones desde un solo panel.' },
            { name: 'Práctico', example: 'Si tu inventario no está actualizado, tu marketing empieza a vender problemas.' },
            { name: 'Emprendedor', example: 'Escalar no significa contratar más caos.' },
            { name: 'Con autoridad', example: 'Una promesa de entrega realista convierte más que una promesa rápida imposible de cumplir.' },
            { name: 'Con personalidad', example: 'Envíos sin dramas. Operativa sin incendios.' }
          ]
        }),
        target_audiences: JSON.stringify([
          { segment: 'E-commerce emergente', need: 'Ordenar operaciones sin construir estructura propia', message: 'Valida y crece sin complicarte con almacén, tarifas y preparación de pedidos.' },
          { segment: 'E-commerce en crecimiento', need: 'Soportar más volumen, campañas y picos sin saturación', message: 'Convierte campañas, lanzamientos y Black Friday en crecimiento, no en caos.' },
          { segment: 'Operaciones complejas', need: 'SLAs, reporting, procesos a medida y soporte estratégico', message: 'Cuando la logística es crítica, el almacén se convierte en una extensión de tu equipo.' },
          { segment: 'Founder / CEO', need: 'Margen, crecimiento, experiencia de cliente y control', message: 'Tu logística debe sostener tu crecimiento, no frenarlo.' },
          { segment: 'Operaciones / logística', need: 'Inventario, errores, tiempos, trazabilidad e incidencias', message: 'Menos errores, más visibilidad y una operación más predecible.' },
          { segment: 'Marketing / e-commerce', need: 'Checkout, conversión, promesa de entrega, reseñas y repetición', message: 'Un buen envío empieza antes de pagar y termina después de entregar.' }
        ]),
        visual_identity: JSON.stringify({
          colors: {
            primary: '#073756',
            accent: '#32EF84',
            secondary_cta: '#E64A4A',
            light_bg: '#EAF8F1',
            white: '#FFFFFF'
          },
          typography: {
            base: 'Poppins / Inter / DM Sans',
            headings: 'Poppins or Inter',
            body: 'Inter or DM Sans',
            data: 'Roboto Mono',
            editorial: 'Playfair Display'
          },
          logo_status: 'Transparent master file NOT supplied - add before production use'
        }),
        description: 'Fulfillment 3PL para e-commerce. Conecta almacenamiento, SGA, preparación de pedidos, packaging, envíos, checkout, tracking y devoluciones.',
        proposition: 'Envíos sin dramas. Tu logística, nuestra magia.',
        setup_complete: true,
      })

    results.brand_profile = bp_error ? { error: bp_error.message } : { success: true }

    // Load Official 4 Content Pillars (Brand System v1.0)
    const pillars = [
      {
        client_id: dadybox_id,
        pillar_name: 'Radar Logístico',
        description: 'Actualidad, análisis, tendencias, casos y operaciones globales. Autoridad y alcance profesional.',
        themes: [
          { name: 'Noticias logísticas', description: 'Nueva regulación, tarifas, cambios aduanales, rutas afectadas, costes de transporte' },
          { name: 'Case studies', description: 'Operaciones complejas globales, eventos, logística sanitaria' },
          { name: 'Crisis management', description: 'Conflictos, bloqueos, huelgas, disrupciones de rutas, emergencias climáticas' },
          { name: 'Tecnología supply chain', description: 'SGA, automatización, tracking, IA, robótica de almacén, last mile' }
        ],
        claim: 'Lo que pasa en la logística mundial también afecta a tu e-commerce.'
      },
      {
        client_id: dadybox_id,
        pillar_name: 'Dadybox en Acción',
        description: 'Servicios, procesos, backstage y capacidades reales. Conversión y confianza.',
        themes: [
          { name: 'SGA explicado', description: 'Qué es, cuándo lo necesitas, cómo reduce errores, cómo mejora trazabilidad' },
          { name: 'Picking & packaging', description: 'Cómo se prepara un pedido, cómo reducir errores, cómo packaging mejora experiencia' },
          { name: 'Envíos y opciones de entrega', description: 'Económico, 24H, Premium, promesas realistas, transportista según precio/servicio/destino' },
          { name: 'Devoluciones', description: 'Cómo convertir devoluciones en datos, cambios, saldo en tienda, reacondicionar o descartar' },
          { name: 'Backstage Dadybox', description: 'Recepción de stock, ubicación, control, preparación, salida y seguimiento' }
        ],
        claim: 'Así convertimos tu logística en una operación preparada para crecer.'
      },
      {
        client_id: dadybox_id,
        pillar_name: 'Entregas Mágicas',
        description: 'Creatividad, entretenimiento y explicación técnica mediante escenarios imposibles. Alcance, diferenciación y memorabilidad.',
        themes: [
          { name: 'Entregas imposibles en la Tierra', description: 'Antártida, Etna, islas remotas, desiertos, selvas, bases científicas' },
          { name: 'Entregas legendarias', description: 'Atlántida, civilizaciones antiguas, castillos, ciudades perdidas' },
          { name: 'Entregas de película', description: 'Mundos ficticios y cultura pop (con cuidado legal)' },
          { name: 'Entregas extremas por condición', description: 'Temperatura, acceso, documentación, cobertura, riesgo, packaging especial' }
        ],
        claim: 'Si podemos imaginar la entrega imposible, podemos explicar mejor la logística real.'
      },
      {
        client_id: dadybox_id,
        pillar_name: 'E-com Playbook',
        description: 'Educación, frameworks y buenas prácticas de logística e-commerce. Leads, autoridad técnica y guardados.',
        themes: [
          { name: 'KPIs y métricas', description: 'OTIF, tasa de error, pedidos preparados/día, rotura de stock, coste por pedido, tickets por envío' },
          { name: 'Inventario fiable', description: 'Por qué tu stock es una promesa comercial y cómo evitar vender problemas' },
          { name: 'SGA y trazabilidad', description: 'Cuándo deja de ser opcional, cómo se implementa y qué mejora' },
          { name: 'Centralizar vs descentralizar', description: 'Qué modelo conviene según volumen, coste, mercado y experiencia de cliente' },
          { name: 'Checkout y devoluciones', description: 'Promesas de entrega, fricción, costes transparentes, cambios, saldo en tienda' }
        ],
        claim: 'Mejores decisiones logísticas para vender con más control.'
      }
    ]

    let pillar_count = 0
    for (const pillar of pillars) {
      const { error } = await supabase.from('content_pillars').upsert(pillar)
      if (!error) pillar_count++
    }

    results.pillars = { success: true, count: pillar_count, corrected: '4 official pillars from Brand System v1.0' }

    return NextResponse.json({ status: 'Dadybox data loaded', results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
