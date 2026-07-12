import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAuthGate } from '@/lib/auth-gate'

export async function POST() {
  try {
    await requireAuthGate()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({ 
      error: 'Service key not configured',
      solution: 'Add SUPABASE_SERVICE_ROLE_KEY to Vercel env vars'
    }, { status: 500 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    serviceKey
  )

  try {
    // Check current RLS status
    const { data: policies, error: checkError } = await supabase
      .from('clients')
      .select('*')
      .limit(1)

    if (!checkError) {
      return NextResponse.json({ 
        status: 'clients table is readable',
        message: 'Table access working with service role'
      })
    }

    return NextResponse.json({
      status: 'Table access issue detected',
      error: checkError.message,
      solution: 'RLS policy needed for authenticated users'
    })
  } catch (e: any) {
    return NextResponse.json({ 
      error: 'Unexpected error',
      message: e.message
    }, { status: 500 })
  }
}
