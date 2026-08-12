import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const CID = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799';
const OUT = '/private/tmp/claude-501/-Users-carlosjacoste/f7fd55ea-7d6b-458b-ba4e-ddb2fa8514f0/scratchpad';

const { data: bp } = await sb.from('brand_profiles').select('brand_data').eq('client_id', CID).single();
fs.writeFileSync(OUT + '/brand_data.json', JSON.stringify(bp.brand_data, null, 2));
console.log('brand_data bytes', JSON.stringify(bp.brand_data).length);

const { data: docs, error } = await sb.from('agent_documents').select('*').eq('client_id', CID);
console.log('docs error', error, 'n=', docs?.length);
for (const d of docs || []) {
  const keys = Object.keys(d);
  console.log('---', JSON.stringify(Object.fromEntries(keys.filter(k => typeof d[k] !== 'object' && String(d[k]||'').length < 200).map(k => [k, d[k]]))));
}
fs.writeFileSync(OUT + '/agent_documents.json', JSON.stringify(docs, null, 2));
