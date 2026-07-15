#!/usr/bin/env node
/**
 * Migrate CRM data from old shared instance to new sf-crm instance
 * Usage: node scripts/migrate-crm-data.mjs
 *
 * CRITICAL: This migrates the merged schema (sf-crm + sf-sales-engine)
 * Includes 1395 Discoolver contacts that must be assigned to correct workspace
 *
 * Migrates:
 * - crm_contacts (with workspace assignment)
 * - leads, icp_profiles, proposal_library
 * - win_loss_history, market_intel, lead_activities, etc.
 * - usage_log
 */

import { createClient } from '@supabase/supabase-js';

const SOURCE_INSTANCE = {
  url: process.env.SOURCE_SUPABASE_URL || 'https://nnevhtfxuawexliwlbmh.supabase.co',
  anonKey: process.env.SOURCE_SUPABASE_ANON_KEY || (function() {
    throw new Error('SOURCE_SUPABASE_ANON_KEY env var not set');
  })(),
};

const TARGET_INSTANCE = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://CHANGE_ME.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'CHANGE_ME',
};

// Workspace configuration
const WORKSPACE_MAPPING = {
  'sf': 'sf-workspace',
  'discoolver': 'discoolver-workspace',
};

async function migrateContactsWithWorkspace(sourceClient, targetClient) {
  console.log('\n📋 Migrating CRM Contacts (with workspace assignment)...');

  try {
    // Fetch contacts from source (no workspace column there)
    const { data: contacts, error: fetchError } = await sourceClient
      .from('crm_contacts')
      .select('*');

    if (fetchError) {
      console.warn(`⚠️  Error fetching contacts: ${fetchError.message}`);
      return 0;
    }

    if (!contacts || contacts.length === 0) {
      console.log('  ℹ️  No contacts found in source');
      return 0;
    }

    console.log(`  📊 Found ${contacts.length} contacts in source`);

    // Transform contacts: add workspace_id based on company/source heuristics
    const transformedContacts = contacts.map((contact) => {
      // Heuristic: if company contains "Discoolver", assign to discoolver workspace
      // Otherwise assign to sf-workspace
      const workspace = (contact.company && contact.company.toLowerCase().includes('discoolver'))
        ? WORKSPACE_MAPPING.discoolver
        : WORKSPACE_MAPPING.sf;

      return {
        ...contact,
        workspace_id: workspace,
      };
    });

    // Batch insert (50 at a time)
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < transformedContacts.length; i += batchSize) {
      const batch = transformedContacts.slice(i, i + batchSize);

      const { error: insertError } = await targetClient
        .from('crm_contacts')
        .insert(batch);

      if (insertError) {
        console.error(`  ❌ Error inserting batch ${i / batchSize + 1}: ${insertError.message}`);
      } else {
        insertedCount += batch.length;
      }
    }

    // Count breakdown
    const sfCount = transformedContacts.filter((c) => c.workspace_id === WORKSPACE_MAPPING.sf).length;
    const discCount = transformedContacts.filter((c) => c.workspace_id === WORKSPACE_MAPPING.discoolver).length;

    console.log(`  ✅ Inserted ${insertedCount} contacts`);
    console.log(`     - SF workspace: ${sfCount}`);
    console.log(`     - Discoolver workspace: ${discCount}`);

    return insertedCount;
  } catch (error) {
    console.error(`  ❌ Unexpected error: ${error.message}`);
    return 0;
  }
}

async function migrateTableWithWorkspace(sourceClient, targetClient, tableName) {
  console.log(`\n📋 Migrating ${tableName}...`);

  try {
    const { data, error: fetchError } = await sourceClient
      .from(tableName)
      .select('*');

    if (fetchError) {
      console.warn(`⚠️  Error fetching ${tableName}: ${fetchError.message}`);
      return 0;
    }

    if (!data || data.length === 0) {
      console.log(`  ℹ️  No data found`);
      return 0;
    }

    // Assign workspace_id to records (default to sf-workspace)
    const transformedData = data.map((record) => ({
      ...record,
      workspace_id: WORKSPACE_MAPPING.sf,
    }));

    console.log(`  📊 Found ${data.length} records`);

    // Batch insert
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < transformedData.length; i += batchSize) {
      const batch = transformedData.slice(i, i + batchSize);

      const { error: insertError } = await targetClient
        .from(tableName)
        .insert(batch);

      if (insertError) {
        console.error(`  ❌ Error inserting batch ${i / batchSize + 1}: ${insertError.message}`);
      } else {
        insertedCount += batch.length;
      }
    }

    console.log(`  ✅ Inserted ${insertedCount} records`);
    return insertedCount;
  } catch (error) {
    console.error(`  ❌ Unexpected error: ${error.message}`);
    return 0;
  }
}

async function main() {
  console.log('🚀 CRM (Merged sf-crm + sf-sales-engine) Data Migration');
  console.log('='.repeat(55) + '\n');

  if (TARGET_INSTANCE.url.includes('CHANGE_ME')) {
    console.error('❌ Error: TARGET_INSTANCE not configured');
    console.error('   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const sourceClient = createClient(SOURCE_INSTANCE.url, SOURCE_INSTANCE.anonKey);
  const targetClient = createClient(TARGET_INSTANCE.url, TARGET_INSTANCE.anonKey);

  console.log('📍 Source:', SOURCE_INSTANCE.url);
  console.log('📍 Target:', TARGET_INSTANCE.url);
  console.log('');
  console.log('⚙️  Workspace mapping:');
  console.log(`    - SF contacts → ${WORKSPACE_MAPPING.sf}`);
  console.log(`    - Discoolver contacts → ${WORKSPACE_MAPPING.discoolver}`);

  let totalMigrated = 0;

  // Special handling for contacts (assign workspace)
  totalMigrated += await migrateContactsWithWorkspace(sourceClient, targetClient);

  // Standard tables (assign to sf-workspace by default)
  const tables = [
    'leads',
    'icp_profiles',
    'proposal_library',
    'win_loss_history',
    'market_intel',
    'lead_activities',
    'prospect_context',
    'lead_cache',
    'discovery_runs',
    'outbound_log',
    'usage_log',
  ];

  for (const table of tables) {
    totalMigrated += await migrateTableWithWorkspace(sourceClient, targetClient, table);
  }

  console.log('\n' + '='.repeat(55));
  console.log(`✅ Migration complete: ${totalMigrated} total records`);
  console.log('');
  console.log('📋 Verification:');
  console.log('  1. Run in Supabase SQL Editor:');
  console.log('     SELECT workspace_id, COUNT(*) FROM crm_contacts GROUP BY workspace_id;');
  console.log('     Expected: sf-workspace (~50), discoolver-workspace (1395)');
  console.log('  2. SELECT COUNT(*) FROM leads; (Expected: 107)');
  console.log('');
  console.log('📋 Next steps:');
  console.log('  1. Update .env.local in sf-crm and sf-sales-engine');
  console.log('  2. Test locally: npm run dev');
  console.log('  3. Deploy to Vercel: vercel --prod');
}

main().catch(console.error);
