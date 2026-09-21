/**
 * ¿Se puede abrir la venta? Comprueba lo que NO se ve en la página pero la
 * rompe o la deja en falso. Ejecutar antes de PUBLICAR en el CMS (publicar
 * dispara el rebuild de producción), después de `node scripts/fetch-cms-content.mjs`:
 *
 *   node scripts/verificar-lanzamiento.mjs
 *
 * Sale con código 1 si algo bloquea. No arregla nada: dice qué falta y dónde.
 * Existe porque cada uno de estos fallos es MUDO — la página se construye y se
 * ve bien igual — y la revisión del 21-sep los encontró todos a la vez.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const bloqueos = []
const avisos = []

const site = fs.readFileSync(path.join(ROOT, 'lib/site.ts'), 'utf8')
let home = {}
try {
  home = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/pages.json'), 'utf8')).home ?? {}
} catch {
  bloqueos.push('content/pages.json no existe o no es JSON: ejecuta antes scripts/fetch-cms-content.mjs')
}
const sec = (id) => home.sections?.[id]?.data ?? {}

// 1. Estado de la venta
const cta = String(sec('hero').cta_url ?? '').trim()
const abierta = /^https?:\/\//i.test(cta)
console.log(`Estado: ${abierta ? 'VENTA ABIERTA → ' + cta : 'pre-lanzamiento (' + (cta || 'sin cta_url') + ')'}`)
if (abierta && !/hotmart/i.test(cta)) avisos.push(`hero.cta_url es una URL pero no parece de Hotmart: ${cta}`)

// 2. Datos legales del titular
for (const campo of ['titular', 'registro', 'domicilio', 'email']) {
  if (new RegExp(`${campo}: null`).test(site)) bloqueos.push(`lib/site.ts → legal.${campo} está vacío (aviso legal y privacidad lo muestran como [pendiente])`)
}

// 3. Dominio propio
if (/url: 'https:\/\/adrian-grooves\.vercel\.app'/.test(site)) {
  (abierta ? bloqueos : avisos).push('lib/site.ts → site.url sigue siendo la URL de preview de Vercel (canonical, OG y sitemap apuntan ahí)')
}

// 4. Píxel
const pixels = home.pixels ?? {}
if (!pixels.meta_pixel_id) (abierta ? bloqueos : avisos).push('CMS → home.pixels.meta_pixel_id vacío: sin píxel no hay forma de medir el CAC por anuncio')

// 5. Variables del formulario (solo se pueden comprobar las locales; las de Vercel: `vercel env ls`)
for (const v of ['LEADS_SUPABASE_URL', 'LEADS_SUPABASE_ANON_KEY']) {
  if (!process.env[v]) avisos.push(`${v} no está en este entorno. Comprueba que SÍ está en Vercel (\`vercel env ls\`): sin ella el formulario devuelve 503`)
}

// 6. Garantía: la tiene que confirmar Adrian por escrito
if (sec('garantia').visible !== false && !sec('garantia').confirmada) {
  avisos.push('CMS → garantia: sin `confirmada: true`. Publicarla es un compromiso de devolver dinero que el cliente no ha aceptado todavía')
}

// 7. Textos de pre-lanzamiento sin su pareja (quedarían falsos al abrir)
if (!abierta) {
  const parejas = [['hero', 'cta'], ['hero', 'microcopy'], ['hero', 'sticky_cta'], ['oferta', 'cta'], ['oferta', 'microcopy'], ['cta-final', 'cta'], ['lista', 'headline']]
  for (const [id, k] of parejas) {
    if (sec(id)[`${k}_prelanzamiento`] && !sec(id)[k]) bloqueos.push(`CMS → ${id}.${k} vacío: al abrir la venta se quedaría el texto de pre-lanzamiento`)
  }
}

for (const a of avisos) console.log('  ⚠️ ', a)
for (const b of bloqueos) console.log('  ⛔ ', b)
if (bloqueos.length) {
  console.log(`\n${bloqueos.length} bloqueo(s). No abrir la venta así.`)
  process.exit(1)
}
console.log(avisos.length ? '\nSin bloqueos, con avisos.' : '\nTodo en orden.')
