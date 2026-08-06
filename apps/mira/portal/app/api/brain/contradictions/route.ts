import { NextRequest, NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'

// Contradicciones del Brand Brain del cliente activo.
//
// Hasta 2026-08-05 estas filas eran SOLO ESCRITURA: las creaban drive-sync y
// analyze-document, se pintaba un contador ámbar en el índice, y no existía
// ninguna línea de código en todo el repo que cambiara su `status`. Una
// contradicción abierta lo estaba para siempre, engordando el aviso del lint
// semanal sin que nadie pudiera hacer nada. Esta ruta (listar) y la de
// [id] (resolver) son la mitad que faltaba.

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const access = await resolveRequestClient(searchParams.get('clientId'))
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    // Quién puede resolver se decide en el SERVIDOR. El cliente lo miraba con
    // `supabase.auth.getUser()` en un useEffect de montaje único: si la sesión
    // aún no estaba hidratada, devolvía null, el plan caía a 'starter' y los
    // botones NO aparecían nunca — ni siquiera para un super_admin, porque el
    // efecto no se vuelve a ejecutar. Aquí la sesión es autoritativa.
    const plan = (await getSessionUser())?.user_metadata?.plan as string | undefined
    const isAgency = plan === 'super_admin' || plan === 'admin'

    const status = searchParams.get('status') || 'open'

    const { data, error } = await adminClient()
      .from('brain_contradictions')
      .select('id, field_path, existing_value_excerpt, proposed_value_excerpt, note, source_type, status, created_at, resolved_at, resolution_note')
      .eq('client_id', access.clientId)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      // La tabla llega en la migración 0062; si un entorno va por detrás, no
      // reventar la página entera del Brand Brain por esto.
      if (error.message.includes('brain_contradictions')) {
        return NextResponse.json({ contradictions: [], isAgency, pending_migration: true })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ contradictions: data ?? [], isAgency })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 }
    )
  }
}
