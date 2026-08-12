import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const CID = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799';

const { data: bp } = await sb.from('brand_profiles').select('brand_data').eq('client_id', CID);
const bd = bp?.[0]?.brand_data || {};
for (const k of ['qa_rules','channels','editorial_rhythm','what_flopped','banned_phrases','constraints','voice_vocabulary','channels_to_avoid','benchmarks']) {
  console.log('\n===== ' + k + ' =====');
  console.log(JSON.stringify(bd[k], null, 2));
}
