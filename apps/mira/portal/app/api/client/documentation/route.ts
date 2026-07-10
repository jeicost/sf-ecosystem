import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const clientId = searchParams.get('client_id')

    if (!clientId) {
      return NextResponse.json(
        { error: 'client_id required' },
        { status: 400 }
      )
    }

    const db = createClient()

    // Fetch all documents for this client (not archived)
    const { data, error } = await db
      .from('client_documentation')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_archived', false)
      .order('uploaded_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Fetch failed' },
      { status: 500 }
    )
  }
}
