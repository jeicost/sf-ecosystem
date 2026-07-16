const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dmzecrlkclocqaywkjtc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (function() {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY env var not set (SF-CMS service role)');
})();

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
