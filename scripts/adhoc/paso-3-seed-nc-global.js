const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

const supabaseUrl = 'https://dmzecrlkclocqaywkjtc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (function() {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY env var not set (SF-CMS service role)');
})();
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedNCGlobal() {
  const projectId = 'e48e7a0b-e6cb-48d9-9633-00fe079d4118';
  const clientSlug = 'ncglobal';

  console.log('PASO 3: Seed NC Global Assets — importar páginas desde content/pages.json');

  // Read pages.json
  const pagesJson = JSON.parse(fs.readFileSync('/Users/carlosjacoste/Desktop/Claude/clients/nc-global-assets-next/src/content/pages.json', 'utf8'));

  const pageSlugs = Object.keys(pagesJson);
  console.log(`Found ${pageSlugs.length} pages in NC Global pages.json:`, pageSlugs);

  // Prepare page records for insert
  const pagesToInsert = pageSlugs.map(slug => {
    const page = pagesJson[slug];
    const sections = page.sections || {};
    const sectionsArray = Object.entries(sections).map(([id, section]) => ({
      id,
      type: section.type,
      data: section.data
    }));

    return {
      project_id: projectId,
      client_slug: clientSlug,
      section_id: crypto.randomUUID(),
      slug: slug,
      title: page.title,
      seo_title: page.seoTitle,
      seo_description: page.seoDescription,
      og_image_url: page.ogImage,
      sections_json: sectionsArray
    };
  });

  console.log(`\nInserting ${pagesToInsert.length} pages...`);

  const { error, data } = await supabase
    .from('pages')
    .insert(pagesToInsert, { returning: 'minimal' });

  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log(`✅ Inserted ${pagesToInsert.length} pages`);
  }

  // Verify
  const { data: verifyPages } = await supabase
    .from('pages')
    .select('id, slug, sections_json')
    .eq('project_id', projectId);

  console.log(`\nVerification - NC Global now has ${verifyPages?.length} pages:`);
  verifyPages?.forEach(p => {
    const sectionCount = Array.isArray(p.sections_json) ? p.sections_json.length : 0;
    console.log(`  - ${p.slug} (${sectionCount} sections)`);
  });
}

seedNCGlobal().catch(console.error);
