import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'No service key' }, { status: 500 })

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceKey
  )

  try {
    // NC Global Assets
    await supabase.from('brand_profiles').upsert({
      client_id: 'a1c3e5f7-b9d1-4a2b-c3e5-f7a9b1d3e5f7',
      name: 'NC Global Assets',
      mission: 'Enable international brands to enter, scale, and dominate the Thailand market with local expertise',
      values: ['Local Expertise', 'Bangkok Market Intelligence', 'Strategic Partnership', 'Professional Excellence'],
      tone_of_voice: 'Professional, expert-driven, consultancy tone. Local Bangkok authority with global perspective.',
      description: 'Bangkok market entry partner for international brands seeking Thailand expansion.',
      proposition: 'Your brand launch. Thailand\'s biggest market.',
    })

    const nc_pillars = [
      {
        client_id: 'a1c3e5f7-b9d1-4a2b-c3e5-f7a9b1d3e5f7',
        pillar_name: 'Market Intelligence',
        description: 'Bangkok trends & consumer behavior',
        themes: [{ name: 'Market Trends' }],
        examples: ['Reports', 'Analysis'],
        claim: 'Market intelligence shapes strategy',
      },
      {
        client_id: 'a1c3e5f7-b9d1-4a2b-c3e5-f7a9b1d3e5f7',
        pillar_name: 'Brand Localization',
        description: 'Adapt brand for Thai market',
        themes: [{ name: 'Messaging' }],
        examples: ['Framework', 'Analysis'],
        claim: 'Global brands succeed when local',
      },
      {
        client_id: 'a1c3e5f7-b9d1-4a2b-c3e5-f7a9b1d3e5f7',
        pillar_name: 'Operations & Scale',
        description: 'Setup & scale operations',
        themes: [{ name: 'Team Building' }],
        examples: ['Manual', 'Plans'],
        claim: 'Success built on local excellence',
      },
    ]

    for (const pillar of nc_pillars) {
      await supabase.from('content_pillars').upsert(pillar, { onConflict: 'client_id,pillar_name' })
    }

    // LIDAR Home
    await supabase.from('brand_profiles').upsert({
      client_id: 'b2d4f6a8-c0e2-4b3c-d4f6-a8b2c4e6f8a0',
      name: 'LIDAR Home',
      mission: 'Revolutionize interior design by enabling precise 3D home scanning',
      values: ['Innovation', 'Precision', 'User-Friendly'],
      tone_of_voice: 'Tech-forward, innovative, accessible. Making 3D scanning easy.',
      description: 'Mobile app for LiDAR interior scanning and 3D home visualization.',
      proposition: 'See your home in 3D. Design with precision.',
    })

    const lidar_pillars = [
      {
        client_id: 'b2d4f6a8-c0e2-4b3c-d4f6-a8b2c4e6f8a0',
        pillar_name: 'Technology Innovation',
        description: 'LiDAR capabilities & accuracy',
        themes: [{ name: 'LiDAR' }],
        examples: ['Updates', 'Features'],
        claim: 'Precision tech = confident design',
      },
      {
        client_id: 'b2d4f6a8-c0e2-4b3c-d4f6-a8b2c4e6f8a0',
        pillar_name: 'Design Stories',
        description: 'Real projects & before/afters',
        themes: [{ name: 'Projects' }],
        examples: ['Cases', 'Results'],
        claim: 'Real projects, real precision',
      },
      {
        client_id: 'b2d4f6a8-c0e2-4b3c-d4f6-a8b2c4e6f8a0',
        pillar_name: 'Real Estate Revolution',
        description: '3D scans change property marketing',
        themes: [{ name: 'Tours' }],
        examples: ['Stories', 'Data'],
        claim: 'Tours close deals faster',
      },
    ]

    for (const pillar of lidar_pillars) {
      await supabase.from('content_pillars').upsert(pillar, { onConflict: 'client_id,pillar_name' })
    }

    // CERO Agency
    await supabase.from('brand_profiles').upsert({
      client_id: 'c3e5f7b9-d1f3-4c4d-e5f7-b9c3d5e7f9b1',
      name: 'CERO Agency',
      mission: 'Enable European digital entrepreneurs to relocate fiscally optimized and gain financial freedom',
      values: ['Freedom', 'Financial Optimization', 'Expertise', 'Community'],
      tone_of_voice: 'Entrepreneurial, freedom-focused, expert-driven. Liberating digital nomads.',
      description: 'Tax relocation and fiscal optimization for European digital entrepreneurs.',
      proposition: 'Choose freedom. Relocate. Optimize. Thrive.',
    })

    const cero_pillars = [
      {
        client_id: 'c3e5f7b9-d1f3-4c4d-e5f7-b9c3d5e7f9b1',
        pillar_name: 'Tax Optimization Stories',
        description: 'Real client success & savings',
        themes: [{ name: 'Savings' }],
        examples: ['Cases', 'Metrics'],
        claim: 'Legal optimization = more money',
      },
      {
        client_id: 'c3e5f7b9-d1f3-4c4d-e5f7-b9c3d5e7f9b1',
        pillar_name: 'Digital Nomad Lifestyle',
        description: 'Bangkok life, visas, community',
        themes: [{ name: 'Bangkok' }],
        examples: ['Guides', 'Profiles'],
        claim: 'Freedom = independence + optimization',
      },
      {
        client_id: 'c3e5f7b9-d1f3-4c4d-e5f7-b9c3d5e7f9b1',
        pillar_name: 'Tax Strategy & Compliance',
        description: 'How tax optimization works',
        themes: [{ name: 'Framework' }],
        examples: ['Guides', 'Checklist'],
        claim: 'Clarity beats complexity',
      },
    ]

    for (const pillar of cero_pillars) {
      await supabase.from('content_pillars').upsert(pillar, { onConflict: 'client_id,pillar_name' })
    }

    return NextResponse.json({
      status: '✅ Complete',
      clients: 3,
      profiles: 3,
      pillars: 9,
      message: 'NC Global Assets, LIDAR Home, and CERO Agency fully populated',
    })
  } catch (e: any) {
    console.error('Error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
