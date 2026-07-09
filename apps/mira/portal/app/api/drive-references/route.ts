import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

// Handle Google Drive file uploads as references
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      client_id,
      drive_file_id, // Google Drive file ID
      drive_file_name,
      drive_file_url, // https://drive.google.com/file/d/{id}/view
      pillar, // Which content pillar this relates to
      why_worked, // Why this is a good reference
      what_to_repeat,
    } = body

    if (!client_id || !drive_file_id || !drive_file_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const db = createClient()

    // Insert as reference in brand_references
    const { data, error } = await db
      .from('brand_references')
      .insert({
        client_id,
        url: drive_file_url,
        title: drive_file_name,
        pillar,
        why_worked,
        what_to_repeat,
        // metadata: { drive_file_id, source: 'google_drive' },
      })
      .select()

    if (error) {
      console.error('Drive reference error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'saved',
      reference_id: data?.[0]?.id,
      message: `Drive file "${drive_file_name}" added to ${pillar || 'General'} references`,
    })
  } catch (error: any) {
    console.error('Error saving Drive reference:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// GET: List Drive references for a client
export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('client_id')
    const pillar = req.nextUrl.searchParams.get('pillar')

    if (!clientId) {
      return NextResponse.json(
        { error: 'client_id required' },
        { status: 400 }
      )
    }

    const db = createClient()

    let query = db
      .from('brand_references')
      .select('*')
      .eq('client_id', clientId)

    if (pillar) {
      query = query.eq('pillar', pillar)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      references: data || [],
      count: data?.length || 0,
    })
  } catch (error: any) {
    console.error('Error fetching Drive references:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
