import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key, { auth: { persistSession: false } });
const CID = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799';

const { data: bp, error: e1 } = await sb
  .from('brand_profiles')
  .select('id, client_id, brand_data, updated_at')
  .eq('client_id', CID);
console.log('=== brand_profiles error:', e1);
console.log('=== rows:', bp?.length);
if (bp?.[0]) {
  console.log('keys:', Object.keys(bp[0].brand_data || {}));
  console.log(JSON.stringify(bp[0].brand_data, null, 2).slice(0, 200));
}

const { data: cp, error: e2 } = await sb
  .from('content_pillars')
  .select('*')
  .eq('client_id', CID);
console.log('=== content_pillars error:', e2, 'rows:', cp?.length);
console.log(JSON.stringify(cp, null, 2));

const { data: docs, error: e3 } = await sb
  .from('agent_documents')
  .select('id, title, doc_type, category, created_at, updated_at')
  .eq('client_id', CID);
console.log('=== agent_documents error:', e3, 'rows:', docs?.length);
console.log(JSON.stringify(docs, null, 2));
