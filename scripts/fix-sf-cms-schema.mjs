#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dmzecrlkclocqaywkjtc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtemVjcmxrY2xvY3FheXdranRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODE5NzA1NiwiZXhwIjoyMDkzNzczMDU2fQ.2R1sgxfh80MX4_ysVBKxm5X9nuswRwYps3E2rfGM3cw';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function fixSchema() {
  try {
    console.log('Fixing sf-cms schema...');

    // Check if api_key column exists
    const { data: columns, error: checkError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (checkError) {
      console.error('Error checking projects table:', checkError);
      return;
    }

    console.log('✓ Projects table exists');

    // Try to insert a project record with api_key
    // If api_key column doesn't exist, this will fail and we'll know
    const { data: existing, error: selectError } = await supabase
      .from('projects')
      .select('*')
      .eq('client_slug', 'startupsfactory');

    if (selectError && selectError.code === 'PGRST202') {
      console.log('⚠ api_key column missing, attempting to add...');

      // Use the admin client to execute raw SQL via HTTP
      // Actually, let's try a different approach - use the REST API with raw SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'ALTER TABLE projects ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;'
        })
      });

      if (!response.ok) {
        console.error('exec_sql not available, trying alternative approach...');
        // exec_sql doesn't exist, we need to do this via the dashboard SQL editor
        console.log('\n⚠ Cannot add column via API (exec_sql not available)');
        console.log('Please manually run in Supabase SQL Editor:');
        console.log('  ALTER TABLE projects ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;');
        console.log('\nThen run:');
        console.log('  INSERT INTO projects (client_slug, name, api_key) VALUES');
        console.log('  (\'startupsfactory\', \'Startup Factory\', \'1e80a5dfdedc4df9fcffece213fb5ce99378e0693c966a9020c8b3446042f1df\');');
        process.exit(1);
      }
    } else if (selectError) {
      console.error('Unexpected error:', selectError);
      process.exit(1);
    } else if (existing && existing.length > 0) {
      console.log('✓ Project record already exists');
      if (!existing[0].api_key) {
        console.log('⚠ But api_key is missing, need to update...');
        const { error: updateError } = await supabase
          .from('projects')
          .update({ api_key: '1e80a5dfdedc4df9fcffece213fb5ce99378e0693c966a9020c8b3446042f1df' })
          .eq('client_slug', 'startupsfactory');

        if (updateError) {
          console.error('Error updating api_key:', updateError);
          process.exit(1);
        }
        console.log('✓ api_key updated');
      }
      return;
    }

    // Try to insert the project record
    const { error: insertError } = await supabase
      .from('projects')
      .insert([{
        client_slug: 'startupsfactory',
        name: 'Startup Factory',
        api_key: '1e80a5dfdedc4df9fcffece213fb5ce99378e0693c966a9020c8b3446042f1df'
      }]);

    if (insertError) {
      // If it's a column missing error, provide helpful message
      if (insertError.message && insertError.message.includes('api_key')) {
        console.log('\n⚠ Cannot add api_key column via API');
        console.log('Please manually run in Supabase SQL Editor (https://app.supabase.com):');
        console.log('\n1. ALTER TABLE projects ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;');
        console.log('\n2. INSERT INTO projects (client_slug, name, api_key) VALUES');
        console.log('   (\'startupsfactory\', \'Startup Factory\', \'1e80a5dfdedc4df9fcffece213fb5ce99378e0693c966a9020c8b3446042f1df\');');
        process.exit(1);
      }
      console.error('Error inserting project:', insertError);
      process.exit(1);
    }

    console.log('✓ Project record inserted');
    console.log('\nSchema fix complete! You can now redeploy startup-factory-web.');

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

fixSchema();
