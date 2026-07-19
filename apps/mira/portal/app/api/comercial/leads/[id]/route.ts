import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { requireLeadAccess } from '@/lib/comercial/lead-access'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Ownership: cargar el lead y verificar acceso del usuario a su client_id
  const access = await requireLeadAccess(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

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

  const supabase = adminClient()
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
  const { id } = await params

  const access = await requireLeadAccess(id)
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

  const supabase = adminClient()
  const { data: activities } = await supabase
    .from('lead_activities')
    .select('*')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ lead: access.lead, activities: activities ?? [] })
}
