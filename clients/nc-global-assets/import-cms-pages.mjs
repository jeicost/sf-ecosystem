#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://dmzecrlkclocqaywkjtc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function importPages() {
  try {
    console.log('🔄 Starting NC Global Assets page import...\n');

    // 1. Read cms-seed-ncglobal.json
    const seedFilePath = path.join(__dirname, 'cms-seed-ncglobal.json');
    const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf8'));
    console.log(`✅ Loaded seed data with ${seedData.pages.length} pages\n`);

    // 2. Transform pages to insert format
    const pageInserts = seedData.pages.map((page) => ({
      client_slug: 'ncglobal',
      section_id: `page-${page.slug}-${randomUUID().slice(0, 8)}`,
      slug: page.slug,
      title: page.title,
      status: page.status || 'published',
      seo_title: page.seo_title || '',
      seo_description: page.seo_description || '',
      og_image_url: page.og_image || '',
      sections_json: page.content?.sections || [],
    }));

    console.log(`📝 Prepared ${pageInserts.length} pages for insert:\n`);
    pageInserts.forEach((p) => {
      console.log(`   - ${p.slug} (${p.title}) — section_id: ${p.section_id}`);
    });
    console.log('');

    // 3. Delete existing pages for this project
    console.log('🗑️  Removing existing pages for ncglobal...');
    const { error: deleteError } = await supabase
      .from('pages')
      .delete()
      .eq('client_slug', 'ncglobal');

    if (deleteError) {
      console.warn(`⚠️  Warning: Could not delete existing pages: ${deleteError.message}`);
    } else {
      console.log('✅ Cleared existing pages\n');
    }

    // 4. Insert pages using Supabase SDK
    console.log('📤 Inserting pages into SF-CMS...');
    const { data: inserted, error: insertError } = await supabase
      .from('pages')
      .insert(pageInserts)
      .select('id, slug, title, status');

    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    console.log(`✅ Successfully inserted ${inserted.length} pages\n`);
    inserted.forEach((p) => {
      console.log(`   - ${p.slug} (${p.title}) — ID: ${p.id}`);
    });

    console.log('\n🎉 Import complete!');
    console.log('📍 View pages at: https://sf-cms.vercel.app\n');
  } catch (error) {
    console.error('❌ Error during import:', error.message);
    process.exit(1);
  }
}

importPages();
