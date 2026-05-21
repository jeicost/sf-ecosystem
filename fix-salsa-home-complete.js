const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://dmzecrlkclocqaywkjtc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtemVjcmxrY2xvY3FheXdranRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE5NzA1NiwiZXhwIjoyMDkzNzczMDU2fQ.2R1sgxfh80MX4_ysVBKxm5X9nuswRwYps3E2rfGM3cw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSalsaHome() {
  const projectId = 'ca7b102e-c6bc-47c4-8f86-c601b19f6960';

  // Read pages.json
  const pagesJson = JSON.parse(fs.readFileSync('/Users/carlosjacoste/Desktop/Claude/clients/salsa-burgers/web/content/pages.json', 'utf8'));
  const homeSections = pagesJson.home.sections;

  // Convert to array format
  const sectionsArray = Object.entries(homeSections).map(([id, section]) => ({
    id,
    type: section.type,
    data: section.data
  }));

  console.log(`PASO 1B (Fix): Actualizar home de Salsa Burgers con ${sectionsArray.length} secciones`);
  console.log('Secciones:', sectionsArray.map(s => s.id).join(', '));

  // Get current home page record
  const { data: currentHome } = await supabase
    .from('pages')
    .select('id')
    .eq('project_id', projectId)
    .eq('slug', 'home')
    .single();

  if (!currentHome) {
    console.error('ERROR: Home page not found for project');
    return;
  }

  // Update with new sections
  const { error, data } = await supabase
    .from('pages')
    .update({
      sections_json: sectionsArray
    })
    .eq('id', currentHome.id);

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log(`✅ Updated home page with ${sectionsArray.length} sections`);
  }

  // Verify
  const { data: verifyHome } = await supabase
    .from('pages')
    .select('slug, sections_json')
    .eq('id', currentHome.id)
    .single();

  const sectionCount = Array.isArray(verifyHome.sections_json) ? verifyHome.sections_json.length : 0;
  console.log(`\nVerification: Home now has ${sectionCount} sections:`,
    verifyHome.sections_json.map(s => s.id).join(', '));
}

fixSalsaHome().catch(console.error);
