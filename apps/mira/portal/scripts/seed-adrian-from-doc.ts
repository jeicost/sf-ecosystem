/**
 * Vuelca el documento de reunión de Adrian Groves (v0.6) al Cerebro.
 *
 * Todo lo que escribe está LITERALMENTE en el documento — modelo de negocio,
 * plataforma, ritmo editorial, filosofía del curso y los siete pilares de
 * contenido. Los pilares, en concreto, NO se generan: ya los decidió el
 * cliente y vienen con nombre en el apartado 5 del documento. Dejar que un
 * modelo "proponga" pilares cuando el cliente ya los tiene definidos es
 * exactamente el tipo de invención que rompe la confianza en el Cerebro.
 *
 * Fuente: ~/Desktop/Documento_Reunion_Adrian_Groves_v0.6.pdf (7-ago-2026)
 *
 *   npx tsx scripts/seed-adrian-from-doc.ts --write
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const WRITE = process.argv.includes('--write')
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const SOURCE = 'Documento de Reunión Adrian Groves v0.6 (7-ago-2026)'

/** Los siete que decidió el cliente, en su orden. */
const PILLARS = [
  {
    pillar_name: 'Así Hice',
    description:
      'Adrian cuenta una decisión concreta que tomó en un rodaje real y por qué. Construye autoridad desde el trabajo hecho, no desde la teoría. Formato largo, 1-2 por semana.',
    themes: [
      'Una decisión de cámara en un rodaje real y qué la motivó',
      'Cómo resolví una escena con el equipo que había',
      'Lo que cambié sobre la marcha y por qué',
      'La toma que parecía imposible y cómo salió',
    ],
    examples: [
      'Vídeo largo: "Así iluminé este plano con una sola ventana"',
      'Carrusel: la decisión de encuadre en un videoclip, plano a plano',
    ],
  },
  {
    pillar_name: 'Así se Hizo',
    description:
      'Desmontaje de una pieza reconocible —propia o ajena— explicando cómo está construida. Enseña a mirar, que es el criterio que vende el curso. Formato largo.',
    themes: [
      'Desmontaje plano a plano de un videoclip',
      'Qué luz hay detrás de una escena que parece compleja',
      'El movimiento de cámara que no se nota y por qué funciona',
      'Cómo se construye una secuencia que engancha',
    ],
    examples: [
      'Vídeo: "Así se hizo este plano secuencia"',
      'Carrusel comparativo: lo que ves / lo que hay montado detrás',
    ],
  },
  {
    pillar_name: 'Por Qué Funciona',
    description:
      'El concepto detrás de una imagen que funciona: composición, altura de cámara, líneas, capas, espacio negativo. Es el pilar que traduce el "Habilidad > Equipo" en algo demostrable. Formato corto.',
    themes: [
      'Por qué este plano transmite más que aquel',
      'La regla de composición que sí importa',
      'Altura de cámara y lo que le hace al espectador',
      'Profundidad con capas, sin equipo extra',
      'El espacio vacío como decisión, no como error',
    ],
    examples: [
      'Corto: dos planos del mismo sujeto, uno funciona y otro no',
      'Reel: la misma escena a tres alturas de cámara',
    ],
  },
  {
    pillar_name: 'Errores que Veo Siempre',
    description:
      'Los fallos que Adrian encuentra una y otra vez, incluso en creadores con muchos seguidores. Es el pilar de mayor gancho: el espectador se reconoce. Formato corto, alta frecuencia.',
    themes: [
      'El ruido de tus vídeos viene del ISO, no de tu cámara',
      'Por qué tu movimiento se ve raro (obturación)',
      'El audio que arruina un vídeo bien grabado',
      'Grabar a 60 FPS "por si acaso"',
      'El error de balance de blancos que cambia el color a mitad de plano',
    ],
    examples: [
      'Corto: "Si tu vídeo hace esto, el problema no es la cámara"',
      'Carrusel: cinco errores de iluminación y su arreglo',
    ],
  },
  {
    pillar_name: 'Desmontando Mitos',
    description:
      'Ataca directamente al enemigo declarado de la marca: la idea de que un vídeo profesional depende del presupuesto. Es el pilar más alineado con el posicionamiento. Formato corto o largo.',
    themes: [
      'No necesitas una cámara mejor',
      'El gimbal que no te hace falta todavía',
      'Grabar en LOG no te da un vídeo profesional por sí solo',
      'El micrófono caro que no arregla una mala toma',
      'Lo que de verdad separa un vídeo amateur de uno profesional',
    ],
    examples: [
      'Vídeo: la misma escena con móvil y con cámara, sin decir cuál es cuál',
      'Corto: "Esto lo grabé con el móvil"',
    ],
  },
  {
    pillar_name: 'Rodajes Explicados',
    description:
      'Detrás de las cámaras de producciones reales: cómo se prepara, qué se decide antes de grabar y qué se resuelve en el sitio. Alimenta la credibilidad profesional. Formato largo.',
    themes: [
      'Cómo planifico antes de grabar',
      'El checklist que repaso antes de cada rodaje',
      'Qué se decide en preproducción y qué se improvisa',
      'Cómo se organiza un día de rodaje',
    ],
    examples: [
      'Vídeo: un día de rodaje de principio a fin',
      'Carrusel: el checklist previo, punto por punto',
    ],
  },
  {
    pillar_name: 'El Reto',
    description:
      'Adrian se pone una limitación —un solo objetivo, una sola luz, solo el móvil— y saca el mejor resultado posible. Demuestra la tesis de la marca en directo. Formato largo, menor frecuencia.',
    themes: [
      'Un vídeo entero con el móvil',
      'Una sola fuente de luz',
      'Rodar sin trípode y que no se note',
      'Cero presupuesto: qué se puede conseguir',
    ],
    examples: [
      'Vídeo: "Reto — grabo esto solo con lo que tengo en casa"',
      'Serie: el mismo brief resuelto con tres presupuestos',
    ],
  },
]

/** Lo que el documento dice y el Cerebro no tenía. */
const BRAND_DATA_PATCH = {
  business_model: {
    source: SOURCE,
    funnel: [
      'Contenido gratuito',
      'Lead magnet',
      'Curso evergreen (~99 €)',
      'Packs especializados',
      'Curso premium (futuro)',
      'Servicios de producción',
    ],
    scope_now:
      'El proyecto arranca SOLO con el curso básico. Los packs vienen después y el curso premium queda aparcado hasta validar el negocio.',
    price_point: '~99 € el curso evergreen',
  },
  offer: {
    source: SOURCE,
    includes: [
      'Actualizaciones del curso',
      'Recursos descargables',
      'Biblioteca creciente',
      'Casos reales',
      'Descuentos en futuros productos',
    ],
    deliberately_excluded:
      'No se ofrece de entrada Discord, mentorías semanales ni soporte continuo — la prioridad es que el producto escale.',
  },
  channels: {
    source: SOURCE,
    objective: 'Construir autoridad, no convertirse en influencer.',
    platform_stack: 'Web Adrian Groves → landing → checkout Hotmart → curso en Hotmart.',
    platform_decision:
      'Hotmart + web propia (comisión por venta + coste de web) es la recomendada. Kajabi cuando el negocio facture; Thinkific y Teachable como alternativas; WordPress + LMS a medio plazo; desarrollo propio descartado para validar.',
  },
  editorial_rhythm: {
    source: SOURCE,
    cadence: '4 publicaciones por semana — 2 largas y 2 cortas.',
    milestone: 'Llegar a 20-30 publicaciones antes de abrir la lista de espera.',
  },
  course_philosophy: {
    source: SOURCE,
    principle: 'Cada clase responde a un problema real, no a un temario.',
    lesson_structure: ['Problema', 'Concepto', 'Aplicación en móvil', 'Aplicación en cámara', 'Resumen', 'Ejercicio'],
    title_pattern:
      'Título = la pregunta del alumno; subtítulo = el concepto técnico. Ej.: "¿Por qué tu vídeo cambia de color continuamente?" / "Balance de blancos".',
  },
  open_questions: {
    source: SOURCE,
    items: [
      'Módulo 8 (Casos reales): pendiente de validar con el equipo.',
      'Módulo 9 (Proyecto final): pendiente de validar con el equipo.',
      'Tipografía de marca: el cliente tiene opciones y quiere revisarlas en una sesión futura.',
    ],
  },
}

async function main() {
  const { data: client, error: cErr } = await db
    .from('clients')
    .select('id, name')
    .eq('name', 'Adrian Grooves')
    .single()
  if (cErr || !client) throw new Error(`No encuentro el cliente: ${cErr?.message}`)

  const { data: bp, error: bpErr } = await db
    .from('brand_profiles')
    .select('id, brand_data')
    .eq('client_id', client.id)
    .single()
  if (bpErr || !bp) throw new Error(`No encuentro el brand_profile: ${bpErr?.message}`)

  const current = (bp.brand_data ?? {}) as Record<string, unknown>
  const newKeys = Object.keys(BRAND_DATA_PATCH).filter((k) => !(k in current))
  const overwritten = Object.keys(BRAND_DATA_PATCH).filter((k) => k in current)

  console.log(`Cliente: ${client.name}`)
  console.log(`Campos nuevos:      ${newKeys.join(', ') || '(ninguno)'}`)
  console.log(`Campos que pisa:    ${overwritten.join(', ') || '(ninguno)'}`)
  console.log(`Pilares a crear:    ${PILLARS.length} — ${PILLARS.map((p) => p.pillar_name).join(' · ')}`)

  const { data: existingPillars } = await db
    .from('content_pillars')
    .select('pillar_name')
    .eq('client_id', client.id)
  if (existingPillars?.length) {
    console.log(`\n⚠ Ya tiene ${existingPillars.length} pilares: ${existingPillars.map((p) => p.pillar_name).join(', ')}`)
    console.log('  No se duplican. Bórralos antes si quieres regenerarlos.')
    return
  }

  if (!WRITE) {
    console.log('\nSimulacro — usa --write para guardar')
    return
  }

  // El merge es superficial a propósito: cada clave del parche es un bloque
  // completo del documento, no un retoque dentro de una que ya existe.
  const { error: upErr } = await db
    .from('brand_profiles')
    .update({ brand_data: { ...current, ...BRAND_DATA_PATCH }, updated_at: new Date().toISOString() })
    .eq('id', bp.id)
  if (upErr) throw new Error(`brand_data: ${upErr.message}`)
  console.log('\n✓ Cerebro actualizado')

  const { error: pErr } = await db
    .from('content_pillars')
    .insert(PILLARS.map((p) => ({ client_id: client.id, ...p })))
  if (pErr) throw new Error(`pilares: ${pErr.message}`)
  console.log(`✓ ${PILLARS.length} pilares creados`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
