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
  const dadybox_id = 'e664873b-034d-48cd-9a45-8631672ef375'

  try {
    // Load Dadybox brand profile with setup_complete = true
    const { error: bp_error } = await supabase
      .from('brand_profiles')
      .upsert({
        client_id: dadybox_id,
        name: 'Dadybox',
        mission: 'Revolucionar la logística de e-commerce en Latinoamérica',
        values: ['Velocidad', 'Precisión', 'Innovación'],
        tone_of_voice: 'Profesional, confiable, directo',
        description: 'Plataforma de logística inteligente para e-commerce',
        proposition: 'La logística es tu competencia, no tu burden',
        setup_complete: true,
      })

    results.brand_profile = bp_error ? { error: bp_error.message } : { success: true }

    // Load Dadybox pillars
    const pillars = [
      {
        client_id: dadybox_id,
        pillar_name: 'Radar Logístico',
        description: 'Inteligencia de datos sobre flujos de logística, tendencias de envíos.',
        themes: [
          { name: 'Predicción de Demanda', description: 'Cómo la IA predice picos de envíos' },
          { name: 'Optimización de Rutas', description: 'Algoritmos que reducen costos' },
          { name: 'Análisis de Competencia', description: 'Benchmark contra competidores' },
          { name: 'Métricas de Rendimiento', description: 'Tracking en tiempo real' }
        ],
        examples: ['Dashboard de predicción', 'Alertas de demanda', 'Reportes semanales']
      },
      {
        client_id: dadybox_id,
        pillar_name: 'Automatización Inteligente',
        description: 'Procesos que se optimizan sin intervención humana.',
        themes: [
          { name: 'Auto-scaling', description: 'Escalamiento automático de recursos' },
          { name: 'Decision Trees', description: 'Árboles de decisión para ruteo' },
          { name: 'Predictive Maintenance', description: 'Anticiparse a problemas' }
        ],
        examples: ['Asignación automática de paquetes', 'Reasignación en tiempo real']
      },
      {
        client_id: dadybox_id,
        pillar_name: 'Confianza y Transparencia',
        description: 'Clientes saben dónde está su envío, siempre.',
        themes: [
          { name: 'Real-time Tracking', description: 'Ubicación precisa del paquete' },
          { name: 'Comunicación Proactiva', description: 'Notificaciones inteligentes' },
          { name: 'Accountability', description: 'Responsabilidad total de entregas' }
        ],
        examples: ['App móvil con GPS', 'SMS/Email automáticos', 'Reportes de incidencias']
      },
      {
        client_id: dadybox_id,
        pillar_name: 'Ventaja Competitiva: Velocidad',
        description: 'Más rápido que la competencia, siempre.',
        themes: [
          { name: 'Infraestructura de Hubs', description: 'Ubicación estratégica de centros' },
          { name: 'Alianzas Logísticas', description: 'Network de partners' },
          { name: 'Tech Stack Avanzado', description: 'Tecnología de última generación' }
        ],
        examples: ['Hub regional en 48h', 'Entregas same-day en CDMX', 'API integrada']
      }
    ]

    let pillar_count = 0
    for (const pillar of pillars) {
      const { error } = await supabase.from('content_pillars').upsert(pillar)
      if (!error) pillar_count++
    }

    results.pillars = { success: true, count: pillar_count }

    return NextResponse.json({ status: 'Dadybox data loaded', results })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
