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

  const clientId = 'e664873b-034d-48cd-9a45-8631672ef375'

  try {
    console.log('📦 Populating complete Dadybox brand profile...')

    // Complete identity data from PDF
    const dadyboxData = {
      client_id: clientId,
      name: 'Dadybox',
      mission: 'Revolucionar la logística de e-commerce en Latinoamérica',
      values: ['Velocidad', 'Precisión', 'Innovación'],
      tone_of_voice: 'Profesional, confiable, directo',
      description: 'Plataforma de logística inteligente para e-commerce',
      proposition: 'La logística es tu competencia, no tu burden',
      // Extended identity fields
      identity_info: {
        full_name: 'Dadybox',
        category: 'Fulfillment 3PL para e-commerce',
        short_description: 'Solución de fulfillment 3PL para e-commerce que conecta almacenamiento, SGA, preparación de pedidos, packaging, envíos, checkout, tracking y devoluciones en una sola operación visible y escalable.',
        long_description: 'Dadybox es una plataforma logística para marcas e-commerce que necesitan profesionalizar su operación sin construir una infraestructura propia. Combina almacenamiento inteligente, software de gestión de almacén, picking & packaging, envíos, devoluciones, integraciones con canales de venta y seguimiento en tiempo real.',
        positioning: 'Partner logístico que permite a marcas e-commerce escalar sin perder control, margen ni experiencia de cliente.',
        claim_primary: 'Envíos sin dramas. Tu logística, nuestra magia.',
        nucleus_phrase: 'Tu e-commerce vende. Dadybox mueve todo lo demás.',
        compatible_claims: [
          'Envíos sin dramas.',
          'Tu logística, nuestra magia.',
          'Fulfillment para e-commerce que quieren crecer sin caos.',
          'Del stock a la devolución, todo bajo control.',
          'Menos hojas de cálculo. Más pedidos preparados.',
          'La logística que tu cliente no ve, pero tu negocio sí nota.'
        ],
        vision: 'Convertirse en el partner logístico de referencia para e-commerce que buscan escalar con control, transparencia y una experiencia de entrega profesional.',
        core_values: [
          {
            name: 'Control',
            definition: 'La logística no puede ser una caja negra. Dadybox debe comunicar visibilidad sobre pedidos, stock, envíos y devoluciones.',
            internal_phrase: 'Lo que no se ve, no se puede escalar.'
          },
          {
            name: 'Fiabilidad',
            definition: 'Preparación correcta, stock actualizado, tracking claro, entrega realista y devoluciones trazables.',
            internal_phrase: 'Mejor prometer bien que prometer rápido y fallar.'
          },
          {
            name: 'Simplicidad',
            definition: 'Reducir complejidad operativa: menos hojas de cálculo, menos fricción, menos incertidumbre.',
            internal_phrase: 'La logística compleja debe sentirse simple para el cliente.'
          },
          {
            name: 'Escalabilidad',
            definition: 'Capacidad para acompañar crecimiento, campañas, lanzamientos, rebajas y picos como Black Friday.',
            internal_phrase: 'Hoy ordenamos tu operación. Mañana soportamos tu crecimiento.'
          },
          {
            name: 'Cercanía profesional',
            definition: 'Lenguaje experto pero entendible. Acompañar sin sonar frío ni excesivamente corporativo.',
            internal_phrase: 'Expertos, pero entendibles.'
          }
        ],
        personality: {
          primary_archetype: 'El Aliado Experto',
          secondary_archetype: 'El Mago Operativo',
          voice_principles: [
            { principle: 'Claro', application: 'Explicar qué cambia para el cliente.', example: 'Controla stock, pedidos y devoluciones desde un solo panel.' },
            { principle: 'Práctico', application: 'Conectar logística con decisiones reales.', example: 'Si tu inventario no está actualizado, tu marketing empieza a vender problemas.' },
            { principle: 'Emprendedor', application: 'Hablar de crecimiento y presión operativa.', example: 'Escalar no significa contratar más caos.' },
            { principle: 'Con autoridad', application: 'Sostener claims con proceso, dato o criterio.', example: 'Una promesa de entrega realista convierte más que una promesa rápida imposible de cumplir.' },
            { principle: 'Con personalidad', application: 'Usar frases recordables sin perder rigor.', example: 'Envíos sin dramas. Operativa sin incendios.' }
          ]
        }
      },
      // Content pillars
      content_pillars_data: [
        {
          name: 'Radar Logístico',
          description: 'Actualidad, análisis, tendencias, casos y operaciones globales.',
          function: 'Pilar editorial semanal sobre actualidad, tendencias, crisis, operaciones complejas, nuevas leyes, tarifas, tecnología, casos de estudio y aprendizajes del ecosistema logístico mundial.',
          business_objective: 'Autoridad y alcance profesional.',
          collections: [
            { name: 'Noticias logísticas', examples: ['Nueva regulación', 'Tarifas', 'Cambios aduaneros', 'Rutas afectadas', 'Costes de transporte'] },
            { name: 'Case studies', examples: ['Mundial 2026', 'Visita papal', 'Grandes conciertos', 'Eventos deportivos', 'Logística sanitaria'] },
            { name: 'Crisis management', examples: ['Conflictos', 'Bloqueos', 'Huelgas', 'Disrupciones de rutas', 'Emergencias climáticas'] },
            { name: 'Tecnología y supply chain', examples: ['SGA', 'Automatización', 'Tracking', 'IA', 'Robótica de almacén', 'Last mile'] }
          ],
          carousel_structure: [
            'Hook fuerte: una operación, crisis o dato que despierte curiosidad.',
            'Contexto: qué está pasando y por qué importa.',
            'Problema logístico: qué hay que mover, coordinar o resolver.',
            'Riesgos: coste, tiempo, documentación, stock, rutas, capacidad.',
            'Lección para e-commerce: cómo aplicar el aprendizaje a una tienda online.',
            'Cierre Dadybox: conexión suave con control, previsión y operación escalable.'
          ],
          pillar_claim: 'Lo que pasa en la logística mundial también afecta a tu e-commerce.'
        },
        {
          name: 'Dadybox en Acción',
          description: 'Servicios, procesos, backstage y capacidades reales.',
          function: 'Pilar dedicado a explicar los servicios, procesos y capacidades de Dadybox de forma clara, visual y comercial: SGA, almacenamiento, picking & packaging, preparación de pedidos, envíos, devoluciones, integraciones, checkout, tracking, partners logísticos y backstage operativo.',
          business_objective: 'Conversión y confianza.',
          collections: [
            { name: 'SGA explicado', examples: ['Qué es un SGA', 'Cuándo lo necesitas', 'Cómo reduce errores', 'Cómo mejora la trazabilidad'] },
            { name: 'Picking & packaging', examples: ['Cómo se prepara un pedido', 'Cómo reducir errores', 'Cómo el packaging mejora experiencia'] },
            { name: 'Envíos y opciones de entrega', examples: ['Económico', '24H', 'Premium', 'Promesas realistas', 'Transportista según precio/servicio/destino'] },
            { name: 'Devoluciones', examples: ['Cómo convertir devoluciones en datos', 'Cambios', 'Saldo en tienda', 'Reacondicionar o descartar'] },
            { name: 'Backstage Dadybox', examples: ['Recepción de stock', 'Ubicación', 'Control', 'Preparación', 'Salida', 'Seguimiento'] }
          ],
          carousel_structure: [
            'Problema operativo concreto.',
            'Servicio Dadybox que lo resuelve.',
            'Cómo funciona el proceso.',
            'Qué mejora para el e-commerce.',
            'Resultado: menos errores, más control, mejor experiencia o más capacidad.',
            'CTA: reserva llamada o pide presupuesto.'
          ],
          pillar_claim: 'Así convertimos tu logística en una operación preparada para crecer.'
        },
        {
          name: 'Entregas Mágicas',
          description: 'Creatividad, entretenimiento y explicación técnica mediante escenarios imposibles.',
          function: 'Pilar creativo y de entretenimiento donde Dadybox imagina entregas imposibles, épicas o absurdamente difíciles en escenarios extremos. Cada entrega se usa como excusa narrativa para explicar desafíos logísticos reales.',
          business_objective: 'Alcance, diferenciación y memorabilidad.',
          collections: [
            { name: 'Entregas imposibles en la Tierra', examples: ['Antártida', 'Etna', 'Islas remotas', 'Desiertos', 'Selvas', 'Bases científicas'] },
            { name: 'Entregas legendarias', examples: ['Atlántida', 'Civilizaciones antiguas', 'Castillos', 'Ciudades perdidas'] },
            { name: 'Entregas de película', examples: ['Mundos ficticios', 'Cultura pop', 'Cuidado legal', 'Sin marcas registradas problemáticas'] },
            { name: 'Entregas extremas por condición', examples: ['Temperatura', 'Acceso', 'Documentación', 'Cobertura', 'Riesgo', 'Packaging especial'] }
          ],
          carousel_structure: [
            'Lugar imposible.',
            'Obstáculo principal.',
            'Datos técnicos o restricciones.',
            'Cómo lo resolvería Dadybox en la ficción.',
            'Lección real para un e-commerce.',
            'Cierre de marca.'
          ],
          pillar_claim: 'Si podemos imaginar la entrega imposible, podemos explicar mejor la logística real.'
        },
        {
          name: 'E-com Playbook',
          description: 'Educación, frameworks y buenas prácticas de logística e-commerce.',
          function: 'Pilar educativo con buenas prácticas, frameworks, casos de estudio, consejos y metodologías para mejorar la logística de un e-commerce.',
          business_objective: 'Leads, autoridad técnica y guardados.',
          collections: [
            { name: 'KPIs y métricas', examples: ['OTIF', 'Tasa de error', 'Pedidos preparados/día', 'Rotura de stock', 'Coste por pedido', 'Tickets por envío'] },
            { name: 'Inventario fiable', examples: ['Por qué tu stock es una promesa comercial', 'Cómo evitar vender problemas'] },
            { name: 'SGA y trazabilidad', examples: ['Cuándo deja de ser opcional', 'Cómo se implementa', 'Qué mejora'] },
            { name: 'Centralizar vs descentralizar', examples: ['Qué modelo conviene según volumen, coste, mercado y experiencia de cliente'] },
            { name: 'Checkout y devoluciones', examples: ['Promesas de entrega', 'Fricción', 'Costes transparentes', 'Cambios', 'Saldo en tienda'] }
          ],
          carousel_structure: [
            'Problema real.',
            'Error común.',
            'Framework o criterio de decisión.',
            'Ejemplo práctico.',
            'Checklist accionable.',
            'CTA a llamada, newsletter o recurso descargable.'
          ],
          pillar_claim: 'Mejores decisiones logísticas para vender con más control.'
        }
      ],
      // Visual assets
      visual_assets: {
        colors: {
          primary_dark: { name: 'Fondo oscuro principal', hex: '#073756', hex_alt: '#172026', usage: 'Navy logístico. Base web, portadas y piezas institucionales.' },
          brand_green: { name: 'Verde Dadybox', hex: '#32EF84', usage: 'Acento de marca, energía, botones, iconos, highlights.' },
          white: { name: 'Blanco', hex: '#FFFFFF', usage: 'Tarjetas, respiración, contraste y claridad.' },
          coral_red: { name: 'Rojo coral', hex: '#E64A4A', usage: 'CTA secundario, alerta, acento puntual. No abusar.' },
          soft_green: { name: 'Verde suave', hex: '#EAF8F1', usage: 'Fondos informativos, cajas de explicación, bloques educativos.' }
        },
        typography: {
          base_brand: 'Poppins / Inter / DM Sans para sistema limpio, digital y B2B.',
          web_institutional: 'Poppins o Inter para titulares; Inter o DM Sans para cuerpo.',
          radar_logistico: 'Playfair Display para portada editorial; Roboto Mono o Montserrat para datos.',
          dadybox_accion: 'Poppins + DM Sans. Debe sentirse limpio, SaaS y comercial.',
          entregas_magicas: 'Frankfurter Highlight solo como acento de título; DM Sans para legibilidad.',
          ecom_playbook: 'AC Safe como acento educativo/manual; DM Sans para cuerpo.'
        },
        logo: {
          versions: [
            { name: 'Logo verde sobre fondo oscuro', usage: 'Principal para portadas, web y piezas con fondo navy.' },
            { name: 'Logo verde sobre fondo claro', usage: 'Usar si el contraste es suficiente. Crear versión navy si hace falta.' },
            { name: 'Cubo aislado', usage: 'Ideal como firma, sello, icono, bullet visual o elemento de navegación.' },
            { name: 'Logo sobre fotografía', usage: 'Aplicar overlay oscuro para garantizar contraste.' }
          ]
        }
      },
      // Reference library template
      reference_library_template: {
        structure: [
          { field: 'url', description: 'Link al post, carrusel, video, diseño o documento.' },
          { field: 'pillar', description: 'Radar Logístico, Dadybox en Acción, Entregas Mágicas o E-com Playbook.' },
          { field: 'title_hook', description: 'Frase exacta de portada o primera línea.' },
          { field: 'format', description: 'Carrusel, reel, story, newsletter, post LinkedIn, landing, one-pager.' },
          { field: 'primary_metric', description: 'Alcance, guardados, clics, leads, comentarios, DMs, tasa de finalización.' },
          { field: 'why_worked', description: 'Tema, timing, claridad, visual, polémica, utilidad, tendencia o CTA.' },
          { field: 'what_to_repeat', description: 'Estructura, ángulo, recurso visual, categoría de tema o tipo de CTA.' }
        ],
        learning_template: 'Pieza: [nombre] | Funcionó porque: [razón] | Riesgo: [qué no repetir] | Aplicación futura: [nuevo tema / formato / ángulo]'
      }
    }

    // Update or insert brand profile
    const { data: profile, error: profile_error } = await supabase
      .from('brand_profiles')
      .upsert(dadyboxData, { onConflict: 'client_id' })
      .select()

    if (profile_error) {
      console.error('❌ Profile error:', profile_error.message)
      return NextResponse.json({ error: profile_error.message }, { status: 500 })
    }

    console.log('✅ Dadybox brand profile complete: Identity, Visual, Pillars, Reference structure loaded')

    return NextResponse.json({
      status: '✅ Complete',
      profile_loaded: true,
      identity: true,
      visual_assets: true,
      content_pillars: 4,
      reference_library_ready: true,
      message: 'Dadybox Brand Brain fully populated with identity, visual assets, 4 content pillars, and reference library structure'
    })
  } catch (e: any) {
    console.error('❌ Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
