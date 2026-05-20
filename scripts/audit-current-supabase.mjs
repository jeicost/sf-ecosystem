#!/usr/bin/env node

// Audit current Supabase instances to understand data state before migration
// Usage: node scripts/audit-current-supabase.mjs

import { createClient } from '@supabase/supabase-js';

const instances = [
  {
    name: 'nnevhtfxuawexliwlbmh (shared)',
    url: 'https://nnevhtfxuawexliwlbmh.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZXZodGZ4dWF3ZXhsaXdsYm1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5NDUzNTUsImV4cCI6MjA5MzUyMTM1NX0.BTQkTUL4rOzhQXC0kPlcyn5xQ8M45Qps3lIZmrGP2Ww',
  },
  {
    name: 'dmzecrlkclocqaywkjtc (cms/links)',
    url: 'https://dmzecrlkclocqaywkjtc.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtemVjcmxrY2xvY3FheXdranRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxOTcwNTYsImV4cCI6MjA5Mzc3MzA1Nn0.CTjtWmhkg-9wbIhkEn-0dw3wTKJMssfuRf0lu1DuseE',
  },
];

async function auditInstance(instance) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 ${instance.name}`);
  console.log('='.repeat(60));

  try {
    const client = createClient(instance.url, instance.anonKey);

    // Query information_schema to list all tables
    const { data, error } = await client
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (error) {
      // Fallback: Try querying pg_tables (if RLS allows)
      console.log('⚠️  Could not access information_schema');
      console.log('   (This might indicate RLS restrictions)');
      return;
    }

    console.log(`\n📋 Tables (${data?.length || 0}):`);
    if (!data || data.length === 0) {
      console.log('   [No tables found]');
      return;
    }

    for (const table of data) {
      console.log(`   - ${table.table_name}`);
    }

    // Try to get row counts for known tables
    console.log('\n📈 Approximate row counts:');
    const commonTables = [
      'leads', 'crm_contacts', 'brand_brains', 'tool_runs',
      'pages', 'projects', 'icp_profiles', 'proposal_library',
      'workspaces', 'clients', 'usage_log',
    ];

    for (const tableName of commonTables) {
      try {
        const { count, error: countError } = await client
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!countError && count !== null) {
          console.log(`   ${tableName}: ${count} rows`);
        }
      } catch (e) {
        // Silently skip tables that don't exist
      }
    }
  } catch (error) {
    console.error(`❌ Error accessing instance:`, error.message);
  }
}

async function main() {
  console.log('🔍 Supabase Instance Audit');
  console.log('Analyzing current data state before migration...\n');

  for (const instance of instances) {
    await auditInstance(instance);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('✅ Audit complete');
}

main().catch(console.error);
