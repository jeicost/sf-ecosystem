#!/usr/bin/env node
/**
 * Migrate AI Agency data from old shared instance to new ai-agency instance
 * Usage: node scripts/migrate-ai-agency-data.mjs
 *
 * Migrates:
 * - brand_brains (with all clients)
 * - tool_runs (execution logs)
 * - usage_log (AI call tracking)
 * - clients (reference table)
 */

import { createClient } from '@supabase/supabase-js';

const SOURCE_INSTANCE = {
  url: 'https://nnevhtfxuawexliwlbmh.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZXZodGZ4dWF3ZXhsaXdsYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDUzNTUsImV4cCI6MjA5MzUyMTM1NX0.BTQkTUL4rOzhQXC0kPlcyn5xQ8M45Qps3lIZmrGP2Ww',
};

const TARGET_INSTANCE = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://CHANGE_ME.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'CHANGE_ME',
};

async function migrateTable(sourceClient, targetClient, tableName, options = {}) {
  console.log(`\n📋 Migrating ${tableName}...`);

  try {
    // Fetch all data from source
    const { data, error: fetchError } = await sourceClient
      .from(tableName)
      .select('*');

    if (fetchError) {
      console.warn(`⚠️  Error fetching ${tableName}: ${fetchError.message}`);
      return 0;
    }

    if (!data || data.length === 0) {
      console.log(`  ℹ️  No data found in source`);
      return 0;
    }

    console.log(`  📊 Found ${data.length} records`);

    // Batch insert into target (50 at a time to avoid timeout)
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);

      const { error: insertError } = await targetClient
        .from(tableName)
        .insert(batch, { count: 'exact' });

      if (insertError) {
        console.error(`  ❌ Error inserting batch ${i / batchSize + 1}: ${insertError.message}`);
        // Continue with next batch (skip duplicates, etc.)
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
  console.log('🚀 AI Agency Data Migration');
  console.log('==========================\n');

  // Verify environment
  if (TARGET_INSTANCE.url.includes('CHANGE_ME')) {
    console.error('❌ Error: TARGET_INSTANCE not configured');
    console.error('   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  // Create clients
  const sourceClient = createClient(SOURCE_INSTANCE.url, SOURCE_INSTANCE.anonKey);
  const targetClient = createClient(TARGET_INSTANCE.url, TARGET_INSTANCE.anonKey);

  console.log('📍 Source:', SOURCE_INSTANCE.url);
  console.log('📍 Target:', TARGET_INSTANCE.url);
  console.log('');

  const tables = [
    'brand_brains',
    'tool_runs',
    'usage_log',
    'clients', // Reference data
  ];

  let totalMigrated = 0;

  for (const table of tables) {
    const count = await migrateTable(sourceClient, targetClient, table);
    totalMigrated += count;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Migration complete: ${totalMigrated} total records`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('  1. Verify data in target instance via Supabase UI');
  console.log('  2. Update .env.local in apps with new SUPABASE_URL/KEY');
  console.log('  3. Test locally: npm run dev');
  console.log('  4. Deploy to Vercel: vercel --prod');
}

main().catch(console.error);
