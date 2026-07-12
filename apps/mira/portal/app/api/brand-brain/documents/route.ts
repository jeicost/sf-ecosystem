import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const explicitClientId = searchParams.get('clientId')

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    let clientId: string
    if (explicitClientId) {
      clientId = explicitClientId
    } else if (process.env.NEXT_PUBLIC_DEV_MODE_BYPASS === 'true' && (!user || authError)) {
      clientId = 'c375bb80-b0d1-4923-a73a-ac96a3ce7799'
    } else if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } else {
      const admin = adminClient()
      const { data: accessData } = await admin
        .from('mira_project_access')
        .select('project_id')
        .eq('user_id', user.id)
        .limit(1)

      if (!accessData?.length) {
        return NextResponse.json({ error: 'No client access' }, { status: 403 })
      }
      clientId = accessData[0].project_id
    }

    const admin = adminClient()
    const { data, error } = await admin
      .from('brand_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('uploaded_at', { ascending: false })

    if (error) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Brand documents GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
