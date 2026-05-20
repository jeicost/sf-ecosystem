#!/usr/bin/env node
/**
 * Seed MIRA instance with initial clients and brand profiles
 * Usage: node scripts/seed-mira-clients.mjs
 *
 * Creates:
 * - clients (Jacoste, Startup Factory, etc.)
 * - brand_profiles (with initial Brand Brain data)
 * - mira_subscriptions (plan assignments)
 */

import { createClient } from '@supabase/supabase-js';

const TARGET_INSTANCE = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://CHANGE_ME.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'CHANGE_ME',
};

const SEED_DATA = {
  clients: [
    {
      client_id: 'jeicost-personal-brand',
      name: 'Jacoste Personal Brand',
      plan: 'scale',
      email: 'jacostech@gmail.com',
      settings: {
        max_sections: 5,
        max_agents: 10,
        api_calls_monthly: 100000,
      },
    },
    {
      client_id: 'startup-factory',
      name: 'Startup Factory',
      plan: 'scale',
      email: 'contact@startupsfactory.es',
      settings: {
        max_sections: 8,
        max_agents: 20,
        api_calls_monthly: 500000,
      },
    },
  ],
  brand_profiles: [
    {
      client_id: 'jeicost-personal-brand',
      brand_name: 'Jacoste - Personal Brand',
      industry: 'Technology / Consulting',
      tone_of_voice: 'Professional, approachable, thought-leadership focused',
      value_propositions: [
        'AI-powered business strategy',
        'Startup scaling expertise',
        'Product-market fit consulting',
      ],
      target_audience: 'Startup founders, growth-stage companies, innovation teams',
      visual_guidelines: {
        primary_color: '#FF00C8',
        secondary_color: '#000000',
        typography: 'Modern, clean, sans-serif',
        imagery: 'Tech, innovation, human connection',
      },
    },
    {
      client_id: 'startup-factory',
      brand_name: 'Startup Factory',
      industry: 'Venture / Agency',
      tone_of_voice: 'Bold, innovative, results-driven',
      value_propositions: [
        'Full-stack startup solutions',
        'AI agency services',
        'Growth acceleration',
      ],
      target_audience: 'Early-stage startups, non-profits, local businesses',
      visual_guidelines: {
        primary_color: '#FF6B35',
        secondary_color: '#004E89',
        typography: 'Bold headers, clean body',
        imagery: 'Startup energy, collaboration, growth',
      },
    },
  ],
  subscriptions: [
    {
      client_id: 'jeicost-personal-brand',
      plan: 'premium',
      status: 'active',
      billing_email: 'jacostech@gmail.com',
      renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      client_id: 'startup-factory',
      plan: 'premium',
      status: 'active',
      billing_email: 'billing@startupsfactory.es',
      renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

async function seedClients(client) {
  console.log('\n📋 Seeding clients...');

  const { error } = await client
    .from('clients')
    .insert(SEED_DATA.clients);

  if (error) {
    console.error(`  ❌ Error seeding clients: ${error.message}`);
    return 0;
  }

  console.log(`  ✅ Created ${SEED_DATA.clients.length} clients`);
  return SEED_DATA.clients.length;
}

async function seedBrandProfiles(client) {
  console.log('\n📋 Seeding brand profiles...');

  const { error } = await client
    .from('brand_profiles')
    .insert(SEED_DATA.brand_profiles);

  if (error) {
    console.error(`  ❌ Error seeding brand profiles: ${error.message}`);
    return 0;
  }

  console.log(`  ✅ Created ${SEED_DATA.brand_profiles.length} brand profiles`);
  return SEED_DATA.brand_profiles.length;
}

async function seedSubscriptions(client) {
  console.log('\n📋 Seeding subscriptions...');

  const { error } = await client
    .from('mira_subscriptions')
    .insert(SEED_DATA.subscriptions);

  if (error) {
    console.error(`  ❌ Error seeding subscriptions: ${error.message}`);
    return 0;
  }

  console.log(`  ✅ Created ${SEED_DATA.subscriptions.length} subscriptions`);
  return SEED_DATA.subscriptions.length;
}

async function main() {
  console.log('🚀 MIRA Client Seed Data');
  console.log('='.repeat(50) + '\n');

  if (TARGET_INSTANCE.url.includes('CHANGE_ME')) {
    console.error('❌ Error: TARGET_INSTANCE not configured');
    console.error('   Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const targetClient = createClient(TARGET_INSTANCE.url, TARGET_INSTANCE.anonKey);

  console.log('📍 Target:', TARGET_INSTANCE.url);
  console.log('');
  console.log('📊 Seed data:');
  console.log(`   - Clients: ${SEED_DATA.clients.length}`);
  console.log(`   - Brand profiles: ${SEED_DATA.brand_profiles.length}`);
  console.log(`   - Subscriptions: ${SEED_DATA.subscriptions.length}`);

  let totalSeeded = 0;

  totalSeeded += await seedClients(targetClient);
  totalSeeded += await seedBrandProfiles(targetClient);
  totalSeeded += await seedSubscriptions(targetClient);

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Seed complete: ${totalSeeded} records created`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('  1. Verify data in Supabase UI');
  console.log('  2. Update .env.local in apps/mira');
  console.log('  3. Test locally: npm run dev (port 3001)');
  console.log('  4. Deploy to Vercel: vercel --prod');
}

main().catch(console.error);
