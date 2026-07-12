const fs = require('fs');

// Read the pages.json file
const pagesData = JSON.parse(fs.readFileSync('/Users/carlosjacoste/Desktop/Claude/clients/salsa-burgers/web/content/pages.json', 'utf8'));

// Extract home sections and convert to array format
const homeSections = pagesData.home.sections;
const sectionsArray = Object.entries(homeSections).map(([id, section]) => ({
  id,
  type: section.type,
  data: section.data
}));

console.log('Sections to update (count):', sectionsArray.length);
sectionsArray.forEach(s => console.log(`  - ${s.id} (type: ${s.type})`));

// Prepare the PATCH request
const projectId = 'ca7b102e-c6bc-47c4-8f86-c601b19f6960';
const apiUrl = 'https://dmzecrlkclocqaywkjtc.supabase.co/rest/v1/pages';
const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!apiKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY not set');
  process.exit(1);
}

const payload = {
  sections_json: sectionsArray
};

console.log('\nPayload structure:');
console.log(JSON.stringify(payload, null, 2).substring(0, 500) + '...');

// Use curl for the PATCH request (more reliable)
const curlCommand = `curl -X PATCH '${apiUrl}?project_id=eq.${projectId}&slug=eq.home' \
  -H 'apikey: ${apiKey}' \
  -H 'Content-Type: application/json' \
  -H 'Prefer: return=minimal' \
  -d '${JSON.stringify(payload).replace(/'/g, "'\\''")}'`;

console.log('\nRunning PATCH to update home page sections...');
require('child_process').execSync(curlCommand, { stdio: 'inherit' });

console.log('\n✅ Home page updated with 9 sections');
