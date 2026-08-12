import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const CID = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799';

const { data: bp, error: e1 } = await sb.from('brand_profiles').select('brand_data').eq('client_id', CID);
if (e1) console.log('err bp', e1);
const bd = bp?.[0]?.brand_data || {};
console.log('=== brand_data top-level keys ===');
console.log(JSON.stringify(Object.keys(bd), null, 2));

const { data: docs, error: e3 } = await sb.from('agent_documents').select('id, title, doc_type, category, created_at').eq('client_id', CID);
if (e3) console.log('err docs', e3);
console.log('=== agent_documents ===');
console.log(JSON.stringify(docs, null, 2));
