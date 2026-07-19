import { readFileSync } from 'node:fs'
// Load .env.local
for (const line of readFileSync(new URL('./.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

import Anthropic from '@anthropic-ai/sdk'
// dynamic import AFTER env is loaded (avoids ESM hoisting capturing undefined env)
const { getQuickActionPrompt } = await import('@/lib/generation/quick-action-prompts')

const CLIENT_ID = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799'
const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const VISUAL = ['crear_post_visual', 'crear_carrusel_visual', 'editar_imagen_visual']

// action_type -> sample inputData
const CASES: Record<string, any> = {
  responder_ticket: { ticket: 'El pedido llegó frío y tardó 50 minutos', customer: 'Ana', channel: 'email' },
  crear_faq: { topic: 'Reservas y horarios del restaurante', num: 3 },
  crear_tutorial: { topic: 'Cómo hacer un pedido online en Salsa Burgers' },
  crear_campaña: { objective: 'Lanzar nueva hamburguesa vegana', budget: '2000€', duration: '4 semanas' },
  generar_icp: { product: 'Servicio de catering para empresas', market: 'Madrid' },
  crear_propuesta: { client: 'Oficinas TechCo', need: 'Catering semanal para 40 empleados' },
  calificar_reply: { reply: 'Gracias, suena interesante pero estamos ocupados este trimestre, hablemos en Q3' },
  crear_post: { topic: 'Nueva hamburguesa vegana', platform: 'instagram' },
  crear_newsletter: { theme: 'Novedades del menú de otoño', audience: 'clientes fieles' },
  crear_video_brief: { concept: 'Reel mostrando cómo se prepara la burger estrella', platform: 'instagram' },
  crear_carousel: { topic: '5 razones para probar nuestra burger vegana', platform: 'instagram' },
  crear_campaña_ads: { objective: 'Aumentar pedidos delivery', budget: '500€', platform: 'meta' },
  generar_reporte: { subject: 'Rendimiento del último trimestre', data: 'ventas +12%, delivery creció 30%' },
  analizar_competencia: { competitors: ['Goiko', 'TGB', 'Five Guys'], market: 'Madrid burgers' },
  brainstorm_ideas: { challenge: 'Aumentar ventas en días entre semana' },
  proyectar_revenue: { current_revenue: '30000€/mes', growth_target: '20% en 6 meses' },
  proyeccion_financiera: { revenue: '30000€/mes', costs: '22000€/mes', business: 'restaurante burgers' },
  analisis_cashflow: { cash: '15000€', monthly_inflow: '30000€', monthly_outflow: '25000€' },
  optimizar_costos: { monthly_costs: 'alquiler 4000, personal 12000, insumos 6000, marketing 1500' },
  analizar_tendencias: { industry: 'restauración fast-casual', region: 'España' },
  auditar_innovacion: { company: 'Salsa Burgers', focus: 'digitalización y experiencia cliente' },
  roadmap_innovacion: { goals: 'app propia de pedidos, programa fidelización, cocina automatizada' },
  crear_post_visual: { topic: 'Nueva burger vegana premium', platform: 'instagram' },
  crear_carrusel_visual: { topic: 'Proceso artesanal de nuestras burgers', platform: 'instagram' },
  editar_imagen_visual: { original: 'Foto de burger sobre fondo oscuro', change: 'Cambiar fondo a tono cálido y añadir humo' },
}

function extractJson(text: string): { ok: boolean; obj: any } {
  let out: any = {}
  const cb = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/)
  if (cb) { try { out = JSON.parse(cb[1].trim()) } catch {} }
  if (!Object.keys(out).length) {
    let bc = 0, s = -1, e = -1
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') { if (bc === 0) s = i; bc++ }
      else if (text[i] === '}') { bc--; if (bc === 0 && s !== -1) { e = i + 1; break } }
    }
    if (s !== -1 && e !== -1) {
      const p = text.substring(s, e)
      try { out = JSON.parse(p) } catch {
        try { out = JSON.parse(p.replace(/\n\s+/g, ' ').replace(/:\s+/g, ': ')) } catch {}
      }
    }
  }
  return { ok: Object.keys(out).length > 0, obj: out }
}

async function callClaude(prompt: string, maxTokens: number) {
  const msg = await claude.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  })
  return { stop: msg.stop_reason, text: (msg.content[0] as any)?.text || '' }
}

async function runOne(actionType: string) {
  let verdict = '', detail = ''
  try {
    const prompt = await getQuickActionPrompt(actionType, { clientId: CLIENT_ID, inputData: CASES[actionType] })
    if (!prompt) return { actionType, verdict: 'PROMPT-NULL', detail: 'getQuickActionPrompt returned null' }
    // detect char-by-char tone corruption in prompt (bug from this session)
    const toneCorrupt = /Tone: [^\n]{0,3}[a-zA-Z], [a-zA-Z], [a-zA-Z], [a-zA-Z]/.test(prompt)
    const brandLoaded = /Name: Salsa Burgers/.test(prompt)
    let { stop, text } = await callClaude(prompt, 2000)
    if (stop === 'refusal') return { actionType, verdict: 'REFUSAL', detail: 'stop_reason=refusal' + (toneCorrupt ? ' TONE-CORRUPT' : '') }
    let { ok, obj } = extractJson(text)
    let retried = ''
    // production uses max_tokens 4000 — if truncated at 2000, retry to get honest verdict
    if (!ok && stop === 'max_tokens') {
      const r = await callClaude(prompt, 4000)
      stop = r.stop; text = r.text; retried = ' [retry@4000]'
      if (stop === 'refusal') return { actionType, verdict: 'REFUSAL', detail: 'refusal on retry' }
      const e = extractJson(text); ok = e.ok; obj = e.obj
    }
    if (!ok) { verdict = 'PARSE-FAIL'; detail = `no JSON. stop=${stop}${retried}. head="${text.slice(0, 70).replace(/\n/g, ' ')}"` }
    else {
      verdict = 'OK' + retried
      const keys = Object.keys(obj)
      detail = `${keys.length} keys${brandLoaded ? ' [brand✓]' : ''}: ${keys.slice(0, 5).join(',')}`
      if (VISUAL.includes(actionType)) {
        const hasImgPrompt = !!(obj.image_generation_prompt || obj.refinement_prompt || obj.slides?.[0]?.image_generation_prompt)
        detail += ` | img_gen_prompt=${hasImgPrompt ? 'YES' : 'NO(!)'}`
      }
    }
    if (toneCorrupt) detail += ' | !!TONE-CORRUPT-DETECTED!!'
  } catch (err: any) {
    verdict = 'ERROR'; detail = err?.message || String(err)
  }
  return { actionType, verdict, detail }
}

async function main() {
  const types = Object.keys(CASES)
  const results: any[] = []
  const CONC = 4
  for (let i = 0; i < types.length; i += CONC) {
    const batch = types.slice(i, i + CONC)
    const r = await Promise.all(batch.map(runOne))
    results.push(...r)
    for (const x of r) console.log(`${x.verdict.padEnd(11)} | ${x.actionType.padEnd(24)} | ${x.detail}`)
  }
  console.log('\n=== SUMMARY ===')
  const counts: Record<string, number> = {}
  for (const r of results) counts[r.verdict] = (counts[r.verdict] || 0) + 1
  console.log(JSON.stringify(counts))
  console.log(`TOTAL: ${results.length}`)
}
main()
