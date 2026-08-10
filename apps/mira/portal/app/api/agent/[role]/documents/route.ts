import { createServerComponentClient } from '@sf/supabase'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { userCanAccessClient } from '@/lib/resolve-client'

export async function GET(
  req: NextRequest,
  // Next 16: params llega como Promise — sin el await, role era undefined y la
  // lista salía siempre vacía (auditoría 2026-08-10).
  { params }: { params: Promise<{ role: string }> }
) {
  try {
    const { role } = await params
    const searchParams = req.nextUrl.searchParams
    const explicitClientId = searchParams.get('clientId')

    const cookieStore = await cookies()
    const supabase = createServerComponentClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { getAll: () => cookieStore.getAll() }
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
      .eq('agent_role', role)
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
