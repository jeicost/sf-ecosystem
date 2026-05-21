const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dmzecrlkclocqaywkjtc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtemVjcmxrY2xvY3FheXdranRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE5NzA1NiwiZXhwIjoyMDkzNzczMDU2fQ.2R1sgxfh80MX4_ysVBKxm5X9nuswRwYps3E2rfGM3cw';
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
