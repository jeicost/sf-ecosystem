import { readFileSync } from 'node:fs'
for (const line of readFileSync(new URL('./.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
console.log('SK len:', (process.env.SUPABASE_SERVICE_ROLE_KEY || '').length)
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
const { fetchBrandBrain } = await import('@/lib/brand-brain')
const bb = await fetchBrandBrain('c375bb80-b0d1-4923-a73a-ac96a3ce7799')
console.log('brandName:', bb?.brandName)
console.log('toneOfVoice type:', typeof bb?.toneOfVoice, '| value:', JSON.stringify(bb?.toneOfVoice)?.slice(0, 200))
console.log('pillars:', bb?.pillars?.length)
