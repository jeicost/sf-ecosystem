#!/usr/bin/env node
/**
 * Initialize CMS QA Harness with test data
 * Creates: project (qa-harness), page (home), post (test-post)
 *
 * Uses Supabase service_role key directly (no login needed).
 * Requires: apps/sf-cms/.env.local with SUPABASE_SERVICE_ROLE_KEY
 *
 * Usage:
 *   node scripts/init-qa-harness.mjs
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '../apps/sf-cms/.env.local')

// Load env vars from .env.local
function loadEnv() {
  if (!fs.existsSync(envPath)) {
    throw new Error(
      `.env.local not found at ${envPath}. Run: vercel env pull .env.local --environment=production`
    )
  }

  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  const env = {}

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || !trimmed) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.substring(0, eqIndex).trim()
    let value = trimmed.substring(eqIndex + 1).trim()

    // Remove surrounding quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    env[key] = value
  }

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Available keys:', Object.keys(env))
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local'
    )
  }

  return env
}

async function main() {
  console.log('\n🚀 CMS QA Harness Initialization (Supabase direct)\n')

  try {
    // Load env
    const env = loadEnv()
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

    // Initialize Supabase client with service_role key
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Step 1: Create project (upsert idempotent)
    console.log('1️⃣  Creating project (qa-harness)...')
    const apiKey = `sk_qah_${Math.random().toString(36).substr(2, 16)}`
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .upsert(
        {
          slug: 'qa-harness',
          client_slug: 'qa-harness',
          name: 'CMS QA Harness — internal, not a real client',
          domain: null,
          api_key: apiKey,
        },
        { onConflict: 'slug' }
      )
      .select()
      .single()

    if (projectError) throw projectError
    if (!project?.id) throw new Error('Failed to create project')

    const projectId = project.id
    console.log(`   ✓ Created project (ID: ${projectId})`)
    console.log(`   ✓ API Key: ${apiKey}\n`)

    // Step 2: Create page
    console.log('2️⃣  Creating page (home)...')
    const sections = [
      {
        id: `hero-${Date.now()}`,
        type: 'hero',
        data: {
          headline: 'Welcome to CMS QA Harness',
          subheadline: 'Testing the SF-CMS frontend contract',
          cta_text: 'Learn More',
          cta_url: '/blog',
          background_color: '#1f2937',
          text_color: '#ffffff',
        },
      },
    ]

    // Try insert; if it fails (exists), update it
    let pageData = {
      id: randomUUID(),
      project_id: projectId,
      section_id: randomUUID(),
      client_slug: 'qa-harness',
      slug: 'home',
      title: 'QA Harness Home',
      status: 'published',
      sections_json: sections,
    }

    let { data: page, error: pageError } = await supabase
      .from('pages')
      .insert([pageData])
      .select()
      .single()

    if (pageError && pageError.code === '23505') {
      // Constraint violation — update instead
      const { data: updated, error: updateError } = await supabase
        .from('pages')
        .update(pageData)
        .eq('project_id', projectId)
        .eq('slug', 'home')
        .select()
        .single()
      if (updateError) throw updateError
      page = updated
    } else if (pageError) {
      throw pageError
    }

    if (!page?.id) throw new Error('Failed to create/update page')
    console.log(`   ✓ Page ready (ID: ${page.id}) with hero section\n`)

    // Step 3: Create post
    console.log('3️⃣  Creating post (test-post)...')
    let postData = {
      id: randomUUID(),
      project_id: projectId,
      client_slug: 'qa-harness',
      slug: 'test-post',
      title: 'Test Post from QA Harness',
      status: 'published',
      content_html: `
        <h2>Welcome to the QA Harness Blog</h2>
        <p>This is a test post created by the initialization script.</p>
        <p>The CMS-to-frontend contract is now validated:</p>
        <ul>
          <li>✓ Project created</li>
          <li>✓ Page with hero section</li>
          <li>✓ Blog post with HTML content</li>
        </ul>
        <p>Next: Start the harness locally and confirm rendering.</p>
      `,
    }

    // Try insert; if it fails (exists), update it
    let { data: post, error: postError } = await supabase
      .from('posts')
      .insert([postData])
      .select()
      .single()

    if (postError && postError.code === '23505') {
      // Constraint violation — update instead
      const { data: updated, error: updateError } = await supabase
        .from('posts')
        .update(postData)
        .eq('project_id', projectId)
        .eq('slug', 'test-post')
        .select()
        .single()
      if (updateError) throw updateError
      post = updated
    } else if (postError) {
      throw postError
    }

    if (!post?.id) throw new Error('Failed to create/update post')
    console.log(`   ✓ Post ready (ID: ${post.id})\n`)

    // Summary
    console.log('✅ Initialization complete!\n')
    console.log('📊 Created data:')
    console.log(`  • Project: qa-harness (${projectId})`)
    console.log(`  • Page: home (${page.id}) with hero section`)
    console.log(`  • Post: test-post (${post.id})`)
    console.log('\n📋 Next steps:')
    console.log('  1. Copy this API key to apps/cms-qa-harness/.env.local:')
    console.log(`     NEXT_PUBLIC_CMS_API_KEY=${apiKey}`)
    console.log('  2. Set other env vars in that file:')
    console.log('     NEXT_PUBLIC_CMS_API_URL=https://cms.startupsfactory.es/api/public')
    console.log('     NEXT_PUBLIC_CMS_PROJECT_SLUG=qa-harness')
    console.log('  3. cd apps/cms-qa-harness && npm run dev')
    console.log('  4. Visit http://localhost:3003 → should see hero section')
    console.log('  5. Visit http://localhost:3003/blog → should see test post')
    console.log('  6. Test Undo button in SF-CMS page editor\n')
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}\n`)
    process.exit(1)
  }
}

main()
