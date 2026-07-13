import { createClient } from '@/lib/supabase'

export async function GET() {
  try {
    const db = createClient()
    const { data, error } = await db
      .from('clients')
      .select('id, name, slug, status, icp, created_at')
      .order('name')

    if (error) {
      return Response.json({ error: error.message, details: error }, { status: 500 })
    }

    return Response.json({
      count: data?.length || 0,
      data,
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
