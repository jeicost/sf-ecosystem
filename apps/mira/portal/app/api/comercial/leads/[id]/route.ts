import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { id } = await params
  const body = await req.json()

  const allowed = ['stage', 'notes', 'assigned_to', 'icebreaker_used', 'hot_score', 'bant_score',
    'first_contact_at', 'last_contact_at', 'email', 'linkedin_url']

  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { id } = await params

  const [{ data: lead }, { data: activities }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', id).single(),
    supabase.from('lead_activities').select('*').eq('lead_id', id).order('created_at', { ascending: false }).limit(10),
  ])

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  return NextResponse.json({ lead, activities: activities ?? [] })
}
