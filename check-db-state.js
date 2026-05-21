const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dmzecrlkclocqaywkjtc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtemVjcmxrY2xvY3FheXdranRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE5NzA1NiwiZXhwIjoyMDkzNzczMDU2fQ.2R1sgxfh80MX4_ysVBKxm5X9nuswRwYps3E2rfGM3cw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkState() {
  console.log('=== PROJECTS ===');
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, client_slug, api_key');

  if (projectsError) {
    console.error('ERROR:', projectsError);
  } else {
    console.log(`Found ${projects?.length} projects`);
    projects?.forEach(p => {
      console.log(`  - ${p.client_slug} (${p.id.substring(0, 8)}...) api_key: ${p.api_key ? 'SET' : 'NULL'}`);
    });
  }

  console.log('\n=== PAGES ===');
  const { data: pages, error: pagesError } = await supabase
    .from('pages')
    .select('id, project_id, slug, sections_json');

  if (pagesError) {
    console.error('ERROR:', pagesError);
  } else {
    console.log(`Found ${pages?.length} pages total`);
    pages?.forEach(p => {
      const sectionCount = Array.isArray(p.sections_json) ? p.sections_json.length : 0;
      const projectId = p.project_id ? p.project_id.substring(0, 8) + '...' : 'NULL';
      console.log(`  - ${p.slug} (project: ${projectId}, sections: ${sectionCount})`);
    });
  }
}

checkState().catch(console.error);
