/**
 * La pasada REAL que confirma el arreglo del 14-oct-2026: ¿lee la caché el
 * prefijo de conversación cuando el bloque de estado cambia?
 *
 *   npx tsx --env-file=.env.local evals/consumo/verificar-arreglo.ts
 *
 * ⚠️ GASTA de la clave de plataforma (~0,2 $ con el pliego de prueba). Es la
 * «UNA pasada real» que pide el CLAUDE.md del portal para un cambio que toca al
 * modelo; no se lanza por costumbre. No escribe en mira_usage_log a propósito,
 * para no contaminar las estadísticas de tender/chat: el coste se lee del
 * `usage` que devuelve la propia API, que es la fuente más fiable.
 *
 * Compara las DOS estructuras con el mismo contenido, y lo que mide es el
 * segundo mensaje de cada una, cuando el estado YA HA CAMBIADO (un adjunto más,
 * que es lo que pasa en cuanto alguien sube un documento a mitad de
 * conversación):
 *
 *   ANTES · system [reglas(caché), ESTADO] + mensajes [conversación(caché)]
 *           el estado va por delante de la conversación y la invalida entera.
 *   AHORA · system [reglas(caché)]         + mensajes [conversación(caché), ESTADO]
 *           el estado va detrás de la marca y no invalida nada.
 *
 * Lo que debe salir: en «antes», el segundo mensaje REESCRIBE la conversación
 * (cW alto, cR bajo). En «ahora», la LEE (cR alto, cW casi cero).
 */
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { conCacheAlFinal, buildSystemPrompt, buildStatePrompt } from '../../lib/tenders/chat'
import { CACHE_1H, TENDER_MODEL, prepararParams } from '../../lib/ai/models'
import { MODEL_PRICING, precioEscrituraCache } from '../../lib/anthropic-client'

const MODEL = TENDER_MODEL
/** Un «pliego» sintético con bastante texto para que la caché entre (mínimo 1.024 tok). */
const PLIEGO = Array.from({ length: 420 }, (_, i) =>
  `Cláusula ${i + 1}. El adjudicatario prestará el servicio de mensajería urgente en el ámbito ` +
  `descrito, con los medios humanos y materiales que se detallan, garantizando la trazabilidad ` +
  `de cada envío y el cumplimiento de los plazos comprometidos en su oferta técnica.`
).join('\n')

interface Medida { cW: number; cR: number; in: number; out: number; usd: number }

function tasar(u: Anthropic.Message['usage']): Medida {
  const p = MODEL_PRICING[MODEL] || { in: 3, out: 15, cacheRead: 0.3, cacheWrite: 3.75 }
  const cW = u.cache_creation_input_tokens ?? 0
  const cR = u.cache_read_input_tokens ?? 0
  // La ruta real es tender/chat, que cachea a 1 h: la escritura va a 2× la entrada.
  const usd = (u.input_tokens * p.in + cW * precioEscrituraCache(MODEL, 'tender/chat') + cR * p.cacheRead + u.output_tokens * p.out) / 1e6
  return { cW, cR, in: u.input_tokens, out: u.output_tokens, usd }
}

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: cl } = await db.from('clients').select('id,name')
  const gtd = (cl || []).find((c) => (c.name as string).startsWith('GTD'))!
  const { loadTeaching } = await import('../../lib/tenders/teaching')
  const teaching = await loadTeaching(gtd.id as string)

  const system = buildSystemPrompt({
    brandName: gtd.name as string,
    brainBlock: 'BRAND BRAIN (prueba de caché; no se usa para redactar nada).',
    teachingText: (teaching as { teachingText?: string }).teachingText || '',
    fijasText: '',
  })
  // El estado CAMBIA entre el primer mensaje y el segundo: un adjunto más.
  const estado1 = buildStatePrompt({ tenderId: null, attachments: [] }, 'Prueba de caché', 0, [])
  const estado2 = buildStatePrompt(
    { tenderId: null, attachments: [{ id: 'a1', filename: 'ppt.pdf', chars: 50_000 } as never] },
    'Prueba de caché', 0, []
  )

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, timeout: 10 * 60 * 1000 })

  const conv1: Anthropic.MessageParam[] = [
    { role: 'user', content: [{ type: 'text', text: `${PLIEGO}\n\nResponde solo «leído».` }] },
  ]
  const conv2: Anthropic.MessageParam[] = [
    ...conv1,
    { role: 'assistant', content: [{ type: 'text', text: 'leído' }] },
    { role: 'user', content: [{ type: 'text', text: 'Responde solo «dos».' }] },
  ]

  const llamar = async (sys: Anthropic.TextBlockParam[], msgs: Anthropic.MessageParam[]): Promise<Medida> => {
    // prepararParams: los mismos ajustes (techo de salida y esfuerzo) que aplica
    // createMessageForClient en producción. Esfuerzo bajo: se pide una palabra.
    const msg = await client.messages.create(prepararParams({
      model: MODEL, max_tokens: 600, system: sys, messages: msgs,
    }, 'low') as unknown as Anthropic.MessageCreateParamsNonStreaming)
    return tasar(msg.usage)
  }

  const sysSolo: Anthropic.TextBlockParam[] = [{ type: 'text', text: system, cache_control: CACHE_1H }]
  const pinta = (etiq: string, m: Medida) =>
    console.log(`  ${etiq.padEnd(28)} in ${String(m.in).padStart(6)} · cW ${String(m.cW).padStart(6)} · cR ${String(m.cR).padStart(6)} · out ${String(m.out).padStart(4)} · ${m.usd.toFixed(4)} $`)

  console.log(`\nmodelo ${MODEL} · marca ${gtd.name} · pliego de prueba ~${Math.round(PLIEGO.length / 3.6)} tok\n`)

  // ── ANTES: el estado en el system, por delante de la conversación ─────────
  console.log('ANTES (el estado en el system, delante de la conversación)')
  const a1 = await llamar([...sysSolo, { type: 'text', text: estado1 }], conCacheAlFinal(conv1))
  pinta('1er mensaje', a1)
  const a2 = await llamar([...sysSolo, { type: 'text', text: estado2 }], conCacheAlFinal(conv2))
  pinta('2º mensaje (estado cambiado)', a2)

  // ── AHORA: el estado al final de los mensajes, detrás de la marca ─────────
  console.log('\nAHORA (el estado al final de los mensajes, detrás de la marca)')
  const b1 = await llamar(sysSolo, conCacheAlFinal(conv1, estado1))
  pinta('1er mensaje', b1)
  const b2 = await llamar(sysSolo, conCacheAlFinal(conv2, estado2))
  pinta('2º mensaje (estado cambiado)', b2)

  console.log(`\n── El segundo mensaje, que es el que importa ──`)
  console.log(`  antes: reescribe ${a2.cW} tok y lee ${a2.cR} → ${a2.usd.toFixed(4)} $`)
  console.log(`  ahora: reescribe ${b2.cW} tok y lee ${b2.cR} → ${b2.usd.toFixed(4)} $`)
  const ok = b2.cR > a2.cR && b2.cW < a2.cW
  const ahorro = a2.usd > 0 ? (100 * (1 - b2.usd / a2.usd)).toFixed(0) : '?'
  console.log(`\n  ${ok ? '✅' : '❌'} ${ok ? `la conversación se LEE en vez de reescribirse: ${ahorro} % menos en ese mensaje` : 'NO hay mejora: revisar dónde queda la marca de caché'}`)
  console.log(`  gastado en esta comprobación: ${(a1.usd + a2.usd + b1.usd + b2.usd).toFixed(4)} $\n`)
  process.exit(ok ? 0 : 1)
}

main().catch((e) => { console.error(e?.message || e); process.exit(1) })
