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
    // Check if brand_references table exists by attempting to query it
    const { error: checkError, data: testData } = await supabase
      .from('brand_references')
      .select('count', { count: 'exact' })
      .limit(0)

    if (!checkError) {
      console.log('✅ brand_references table already exists')
      return NextResponse.json({
        status: 'ready',
        message: 'All tables ready for Brand Brain operations'
      })
    }

    // Table doesn't exist or there's an error - we need to create it via SQL
    console.log('📋 brand_references table missing, creating via SQL...')

    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS brand_references (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      url text NOT NULL,
      title text NOT NULL,
      pillar text,
      why_worked text,
      what_to_repeat text,
      created_at timestamp WITH TIME ZONE DEFAULT now(),
      updated_at timestamp WITH TIME ZONE DEFAULT now(),
      UNIQUE(client_id, url)
    );

    CREATE INDEX IF NOT EXISTS idx_brand_references_client_id ON brand_references(client_id);

    ALTER TABLE brand_references ENABLE ROW LEVEL SECURITY;

    CREATE POLICY brand_references_select ON brand_references
      FOR SELECT
      USING (client_id = auth.jwt() ->> 'client_id'::text
        OR EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'plan' IN ('admin', 'super_admin')));

    CREATE POLICY brand_references_insert ON brand_references
      FOR INSERT
      WITH CHECK (client_id = auth.jwt() ->> 'client_id'::text
        OR EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'plan' IN ('admin', 'super_admin')));

    CREATE POLICY brand_references_update ON brand_references
      FOR UPDATE
      USING (client_id = auth.jwt() ->> 'client_id'::text
        OR EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'plan' IN ('admin', 'super_admin')))
      WITH CHECK (client_id = auth.jwt() ->> 'client_id'::text
        OR EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'plan' IN ('admin', 'super_admin')));

    CREATE POLICY brand_references_delete ON brand_references
      FOR DELETE
      USING (client_id = auth.jwt() ->> 'client_id'::text
        OR EXISTS(SELECT 1 FROM auth.users WHERE id = auth.uid() AND raw_user_meta_data->>'plan' IN ('admin', 'super_admin')));
    `

    const { error: createError } = await supabase.rpc('exec', {
      sql: createTableSQL
    }).catch(() => ({ error: { message: 'RPC not available, table creation requires manual SQL migration' } }))

    if (createError) {
      console.warn('⚠️ Could not create table via RPC:', createError.message)
      console.log('📝 Run this SQL manually in Supabase dashboard:')
      console.log(createTableSQL)
      return NextResponse.json({
        status: 'needs_migration',
        message: 'brand_references table needs to be created. Use the SQL script in logs or Supabase dashboard.',
        sql: createTableSQL
      })
    }

    return NextResponse.json({
      status: 'created',
      message: 'brand_references table created successfully'
    })
  } catch (e: any) {
    console.error('❌ Error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
