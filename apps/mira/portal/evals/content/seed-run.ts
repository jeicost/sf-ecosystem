/**
 * Banco de pruebas del motor de contenido — siembra revisable.
 *
 * Corre EXACTAMENTE el mismo camino que la ruta de producción
 * (app/api/content-engine/generate): mismo Brand Brain, mismo contrato
 * anti-invención, mismo prompt por pilar, mismo parser y la misma
 * materialización. Lo único que no ejercita es la capa HTTP y de sesión.
 *
 * Por defecto NO ESCRIBE NADA: genera, vuelca a disco y para. Así se puede
 * revisar el contenido antes de que ningún cliente lo vea en su bandeja.
 * Solo con --commit se materializa a post_history + approval_queue.
 *
 *   npx tsx --env-file=.env.local evals/content/seed-run.ts --client "Salsa Burgers" --pillars 4
 *   npx tsx --env-file=.env.local evals/content/seed-run.ts --client "Salsa Burgers" --pillars 4 --commit
 */
import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { createMessageForClient } from '../../lib/anthropic-client'
import { fetchBrandBrain, formatBrandBrainForPrompt } from '../../lib/brand-brain'
import { GROUNDING_CONTRACT } from '../../lib/grounding/grounding-contract'
import { buildPillarPrompt, parsePosts, type PillarRow, type Platform } from '../../lib/content-engine/pillar-prompt'
import { materializePosts, composeCopy } from '../../lib/content-engine/materialize'
import { formatHardRules, validatePiece } from '../../lib/content-engine/qa-validator'

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'runs')

function arg(name: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : fallback
}

async function main() {
  const clientName = arg('client', 'Salsa Burgers')!
  const howMany = Number(arg('pillars', '4'))
  const platforms = (arg('platforms', 'instagram')!.split(',') as Platform[])
  const commit = process.argv.includes('--commit')

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: client } = await db.from('clients').select('id,name').eq('name', clientName).single()
  if (!client) throw new Error(`Cliente no encontrado: ${clientName}`)

  const { data: pillars } = await db
    .from('content_pillars')
    .select('id, pillar_name, description, themes, examples')
    .eq('client_id', client.id)
    .limit(howMany)
  if (!pillars?.length) throw new Error('Este cliente no tiene pilares de contenido')

  // Mismo montaje de system prompt que la ruta.
  const brain = await fetchBrandBrain(client.id)
  const brainContext = brain ? formatBrandBrainForPrompt(brain) : ''
  const { data: bpRow } = await db.from('brand_profiles').select('brand_data').eq('client_id', client.id).maybeSingle()
  const brandData = (bpRow?.brand_data as Record<string, unknown>) ?? null
  const system = [
    `You are MIRA's pillar-based content engine. You produce ready-to-publish social content, faithful to the brand identity. You reply EXCLUSIVELY with valid JSON.`,
    brainContext,
    formatHardRules(brandData),
    GROUNDING_CONTRACT,
  ].filter(Boolean).join('\n\n---\n\n')

  console.log(`▸ ${client.name} · ${pillars.length} pilares · ${platforms.join(', ')} · ${commit ? 'CON escritura' : 'sin escribir (revisión)'}`)
  console.log(`  Brand Brain: ${brain ? `${brainContext.length} chars` : '⚠️ VACÍO'}`)

  const pieces: Array<{ pillar: string; post: Record<string, unknown>; copy: string }> = []
  const failures: Array<{ pillar: string; error: string }> = []
  let totalIn = 0, totalOut = 0

  for (const pillar of pillars as PillarRow[]) {
    process.stdout.write(`  · ${pillar.pillar_name}…`)
    try {
      const res = await createMessageForClient(client.id, 'eval/content-seed', {
        model: 'claude-opus-4-8',
        max_tokens: 16000,
        system,
        messages: [{ role: 'user', content: buildPillarPrompt({ pillar, platforms, postsPerPillar: 1, includeReels: false }) }],
      })
      totalIn += res.usage.input_tokens; totalOut += res.usage.output_tokens
      const raw = res.content.filter((b) => b.type === 'text').map((b) => (b as { text: string }).text).join('')
      const posts = parsePosts(raw)
      if (!posts.length) throw new Error('el modelo no devolvió posts válidos')
      for (const post of posts) {
        pieces.push({ pillar: pillar.pillar_name, post: post as unknown as Record<string, unknown>, copy: composeCopy(pillar.pillar_name, post) })
      }
      const flags = posts.flatMap((post) => validatePiece(brandData, post as never))
      console.log(` ${posts.length} pieza(s)${flags.length ? ` · ⚠️ ${flags.length} avisos QA` : ' · QA limpio'}`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      failures.push({ pillar: pillar.pillar_name, error: msg })
      console.log(` ❌ ${msg}`)
    }
  }

  // Volcado revisable
  mkdirSync(OUT, { recursive: true })
  const stamp = process.env.RUN_STAMP || 'last'
  const jsonPath = join(OUT, `${client.name.replace(/\W+/g, '-').toLowerCase()}-${stamp}.json`)
  const mdPath = jsonPath.replace('.json', '.md')
  writeFileSync(jsonPath, JSON.stringify({ client: client.name, clientId: client.id, platforms, pieces, failures }, null, 2))
  writeFileSync(mdPath, [
    `# ${client.name} — siembra generada (${pieces.length} piezas)`,
    ``,
    ...pieces.flatMap((p, i) => [`## ${i + 1}. ${p.pillar}`, '', '```', p.copy, '```', '']),
    failures.length ? `## Fallos\n${failures.map((f) => `- ${f.pillar}: ${f.error}`).join('\n')}` : '',
  ].join('\n'))

  const cost = (totalIn * 5 + totalOut * 25) / 1_000_000
  console.log(`\n  ${pieces.length} piezas · ${failures.length} fallos · ${totalIn}+${totalOut} tokens ≈ ${cost.toFixed(2)} $`)
  console.log(`  → ${mdPath}`)

  if (!commit) {
    console.log(`\n  NO se ha escrito nada. Revisa el volcado y vuelve a lanzar con --commit para materializar.`)
    return
  }

  const before = await db.from('approval_queue').select('id', { count: 'exact', head: true }).eq('client_id', client.id)
  const { inserted } = await materializePosts(db as never, client.id, pieces.map((p) => ({
    pillarName: p.pillar,
    post: p.post as never,
  })))
  const after = await db.from('approval_queue').select('id', { count: 'exact', head: true }).eq('client_id', client.id)
  console.log(`\n  ✅ materializadas ${inserted} · bandeja ${before.count} → ${after.count}`)
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
