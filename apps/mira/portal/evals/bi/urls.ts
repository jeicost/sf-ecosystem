// Comprobación del veto a «Publicar en la web» y demás URL inválidas.
//   npx tsx evals/bi/urls.ts
import { validateEmbedUrl, deriveStatus } from '../../lib/reports/external'

let pass = 0, fail = 0
const check = (name: string, cond: boolean, detail?: unknown) => {
  if (cond) { pass++; console.log('  ✓', name) } else { fail++; console.log('  ✗', name, JSON.stringify(detail ?? '')) }
}

console.log('\nURL de incrustación')
check('acepta una URL segura de reportEmbed',
  validateEmbedUrl('https://app.powerbi.com/reportEmbed?reportId=abc&autoAuth=true&ctid=xyz').ok)
check('RECHAZA «Publicar en la web»',
  !validateEmbedUrl('https://app.powerbi.com/view?r=eyJrIjoi').ok)
check('y explica por qué',
  (validateEmbedUrl('https://app.powerbi.com/view?r=x').reason || '').includes('Publicar en la web'))
check('rechaza http', !validateEmbedUrl('http://app.powerbi.com/reportEmbed?reportId=a').ok)
check('rechaza otro dominio', !validateEmbedUrl('https://evil.example.com/reportEmbed').ok)
check('rechaza basura', !validateEmbedUrl('no soy una url').ok)

console.log('\nEstado')
check('sin URL nunca es «connected»', deriveStatus(null) === 'not_configured')
check('con URL es «connected»', deriveStatus('https://app.powerbi.com/reportEmbed?x=1') === 'connected')
check('desactivado manda', deriveStatus('https://app.powerbi.com/reportEmbed?x=1', 'disabled') === 'disabled')

console.log(`\n${pass} pasan · ${fail} fallan\n`)
process.exit(fail === 0 ? 0 : 1)
