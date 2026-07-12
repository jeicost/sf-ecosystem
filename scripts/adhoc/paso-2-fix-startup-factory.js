const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dmzecrlkclocqaywkjtc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtemVjcmxrY2xvY3FheXdranRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE5NzA1NiwiZXhwIjoyMDkzNzczMDU2fQ.2R1sgxfh80MX4_ysVBKxm5X9nuswRwYps3E2rfGM3cw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStartupFactory() {
  const projectId = 'b25f71f0-05f4-470a-8c51-463e92e41855';
  const clientSlug = 'startupsfactory';

  console.log('PASO 2: Fix Startup Factory — asignar project_id a 4 páginas huérfanas');

  // Get orphaned pages
  const { data: orphanedPages, error: getError } = await supabase
    .from('pages')
    .select('id, slug')
    .is('project_id', null);

  if (getError) {
    console.error('ERROR getting orphaned pages:', getError);
    return;
  }

  console.log(`Found ${orphanedPages?.length} orphaned pages`);
  orphanedPages?.forEach(p => console.log(`  - ${p.slug}`));

  // Update them
  const { error: updateError, count } = await supabase
    .from('pages')
    .update({
      project_id: projectId,
      client_slug: clientSlug
    })
    .is('project_id', null);

  if (updateError) {
    console.error('ERROR updating:', updateError);
  } else {
    console.log(`✅ Updated ${count} pages`);
  }

  // Verify
  const { data: verifyPages } = await supabase
    .from('pages')
    .select('id, slug, project_id')
    .eq('project_id', projectId);

  console.log(`\nVerification - Startup Factory now has ${verifyPages?.length} pages:`);
  verifyPages?.forEach(p => console.log(`  - ${p.slug}`));
}

fixStartupFactory().catch(console.error);
