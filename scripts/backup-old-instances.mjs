#!/usr/bin/env node
/**
 * Backup old shared Supabase instances before Phase 3 migration
 * Usage: node scripts/backup-old-instances.mjs
 *
 * Exports complete data from nnevhtfxuawexliwlbmh and dmzecrlkclocqaywkjtc
 * Stores SQL dumps in backups/ folder with timestamp
 *
 * DO NOT DELETE OLD INSTANCES UNTIL 48 HOURS AFTER PHASE 3 COMPLETION
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUPS_DIR = path.join(__dirname, '../backups');

// Old shared instances
const INSTANCES = [
  {
    name: 'nnevhtfxuawexliwlbmh',
    url: 'https://nnevhtfxuawexliwlbmh.supabase.co',
    anonKey: process.env.BACKUP_SOURCE_ANON_KEY || (function() {
      throw new Error('BACKUP_SOURCE_ANON_KEY env var not set for nnevhtfxuawexliwlbmh backup');
    })(),
    tables: [
      'brand_brains',
      'tool_runs',
      'usage_log',
      'clients',
      'crm_contacts',
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
    ],
  },
  {
    name: 'dmzecrlkclocqaywkjtc',
    url: 'https://dmzecrlkclocqaywkjtc.supabase.co',
    anonKey: '', // Not provided - user must confirm this instance
    tables: [
      'pages',
      'projects',
      'page_versions',
      'page_activity',
      'posts',
      'media',
      'clients',
      'mira_users',
      'brand_profiles',
      'content_pillars',
      'reference_library',
      'post_history',
      'tool_runs',
      'sections',
      'mira_subscriptions',
    ],
  },
];

async function exportTableData(client, tableName) {
  try {
    const { data, error } = await client.from(tableName).select('*');

    if (error) {
      console.warn(`  ⚠️  Error fetching ${tableName}: ${error.message}`);
      return null;
    }

    if (!data || data.length === 0) {
      console.log(`  ℹ️  ${tableName}: 0 records`);
      return { tableName, count: 0, data: [] };
    }

    console.log(`  ✅ ${tableName}: ${data.length} records`);
    return { tableName, count: data.length, data };
  } catch (error) {
    console.error(`  ❌ Unexpected error in ${tableName}: ${error.message}`);
    return null;
  }
}

function generateSqlInsert(tableName, records) {
  if (!records || records.length === 0) {
    return `-- ${tableName}: No data`;
  }

  const columns = Object.keys(records[0]);
  const columnList = columns.map((c) => `"${c}"`).join(', ');

  const values = records
    .map((record) => {
      const vals = columns.map((col) => {
        const val = record[col];
        if (val === null || val === undefined) {
          return 'NULL';
        }
        if (typeof val === 'boolean') {
          return val ? 'true' : 'false';
        }
        if (typeof val === 'number') {
          return val.toString();
        }
        if (typeof val === 'object') {
          return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        }
        return `'${val.toString().replace(/'/g, "''")}'`;
      });
      return `(${vals.join(', ')})`;
    })
    .join(',\n  ');

  return `INSERT INTO "${tableName}" (${columnList}) VALUES\n  ${values};`;
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    console.log(`📁 Created backups/ directory`);
  }
}

async function backupInstance(instance) {
  console.log(`\n🔄 Backing up ${instance.name}...`);
  console.log('='.repeat(50));

  if (!instance.anonKey) {
    console.warn(`⚠️  Missing anon key for ${instance.name}`);
    console.warn('   Cannot proceed. Please confirm instance and provide key.');
    return null;
  }

  const client = createClient(instance.url, instance.anonKey);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('-').slice(0, 3).join('-') +
    '_' + new Date().toISOString().split('T')[1].replace(/[:.]/g, '');
  const filename = `${instance.name}_${timestamp}.sql`;
  const filepath = path.join(BACKUPS_DIR, filename);

  let sqlContent = `-- Backup of Supabase instance: ${instance.name}
-- Generated: ${new Date().toISOString()}
-- DO NOT DELETE ORIGINAL INSTANCE FOR 48 HOURS

BEGIN;

`;

  let totalRecords = 0;

  for (const tableName of instance.tables) {
    const result = await exportTableData(client, tableName);

    if (result && result.data.length > 0) {
      const sql = generateSqlInsert(tableName, result.data);
      sqlContent += sql + '\n\n';
      totalRecords += result.count;
    }
  }

  sqlContent += `COMMIT;

-- Summary
-- Total records exported: ${totalRecords}
-- Tables: ${instance.tables.length}
-- Safe to import into new instances via Supabase SQL Editor
`;

  fs.writeFileSync(filepath, sqlContent, 'utf8');

  console.log(`\n✅ Backup complete`);
  console.log(`   File: ${filepath}`);
  console.log(`   Size: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Records: ${totalRecords}`);

  return { filename, filepath, totalRecords };
}

async function main() {
  console.log('🔐 Supabase Instance Backup Tool');
  console.log('='.repeat(50) + '\n');
  console.log('⚠️  CRITICAL PROCEDURE: Back up old instances before Phase 3 migration');
  console.log('   DO NOT DELETE: nnevhtfxuawexliwlbmh or dmzecrlkclocqaywkjtc for 48 hours\n');

  ensureBackupDir();

  const results = [];

  for (const instance of INSTANCES) {
    if (!instance.anonKey) {
      console.warn(`\n⚠️  SKIPPED: ${instance.name} - Missing anon key`);
      console.warn('   To backup this instance, provide the anon key in this script');
      continue;
    }

    const result = await backupInstance(instance);
    if (result) {
      results.push(result);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Backup summary:\n`);
  results.forEach((r) => {
    console.log(`   📄 ${r.filename}`);
    console.log(`      Records: ${r.totalRecords}`);
  });

  console.log('\n📋 Next steps:');
  console.log('  1. Verify backup files are not corrupted:');
  console.log('     file backups/*.sql | head -20');
  console.log('  2. Store backups securely (1Password, etc.)');
  console.log('  3. Begin Phase 3 execution (create new instances)');
  console.log('  4. After 48 hours of production stability, can safely delete old instances');
  console.log('     DO NOT PROCEED unless all Phase 3 apps verified working in production');
}

main().catch(console.error);
