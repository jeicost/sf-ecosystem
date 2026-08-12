import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key);
const CID='c375bb80-b0d1-4923-a73a-ac96a3ce7799';
const OUT=process.argv[2];
const { data: bp } = await sb.from('brand_profiles').select('*').eq('client_id', CID);
fs.writeFileSync(OUT+'/brand.json', JSON.stringify(bp, null, 1));
// agent_documents: discover columns
const { data: ad, error: e } = await sb.from('agent_documents').select('*').eq('client_id', CID).limit(200);
if (e) console.log('AD ERR', e);
else {
  console.log('AD rows', ad.length);
  console.log('AD cols', Object.keys(ad[0]||{}).join(','));
  const idx = ad.map(r=>({id:r.id, title:r.title, name:r.name, filename:r.filename, category:r.category, type:r.type, len:(r.content||r.extracted_text||r.text||'').length}));
  console.log(JSON.stringify(idx, null, 1));
  fs.writeFileSync(OUT+'/docs.json', JSON.stringify(ad, null, 1));
}
