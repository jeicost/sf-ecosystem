import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { userCanAccessClient } from '@/lib/resolve-client'

export async function GET(
  req: NextRequest,
  { params }: { params: { role: string } }
) {
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
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    } else if (explicitClientId) {
      // clientId explícito: validar el grant antes de usarlo
      if (!(await userCanAccessClient(user, explicitClientId))) {
        return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
      }
      clientId = explicitClientId
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
      .from('agent_documents')
      .select('*')
      .eq('client_id', clientId)
      .eq('agent_role', params.role)
      .order('uploaded_at', { ascending: false })

    if (error) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('Agent documents GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
