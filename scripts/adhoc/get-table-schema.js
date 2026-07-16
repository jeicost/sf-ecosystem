const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dmzecrlkclocqaywkjtc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (function() {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY env var not set (SF-CMS service role)');
})();
const supabase = createClient(supabaseUrl, supabaseKey);

async function getSchema() {
  // Try to insert a test record with minimal fields to see which columns are required
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .limit(1)
    .single();

  if (data) {
    console.log('Sample page record columns:');
    Object.keys(data).forEach(k => console.log(`  - ${k}`));
  }
}

getSchema().catch(console.error);
