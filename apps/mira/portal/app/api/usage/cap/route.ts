import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, userCanAccessClient } from '@/lib/resolve-client'
import { getGenerationCapStatus } from '@/lib/generation-cap-server'

// Estado del techo de generaciones/mes del cliente activo, para que la UI avise
// ANTES de que checkGenerationCap corte. Hermano de /api/usage/summary (que
// enseña consumo y coste) pero con dos diferencias que importan: cuenta SOLO
// las filas que consumen techo (used_client_key=false, mes UTC) y sabe cuál es
// el techo, que vive en una env var de servidor y el navegador no puede leer.
// Con MAX_MONTHLY_GENERATIONS sin definir responde enabled:false sin tocar la
// base de datos: cero coste hasta que el flag se encienda.
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const clientId = new URL(req.url).searchParams.get('clientId')
    if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    if (!(await userCanAccessClient(user, clientId))) {
      return NextResponse.json({ error: 'No access to this client' }, { status: 403 })
    }

    return NextResponse.json(await getGenerationCapStatus(clientId))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation cap status failed' },
      { status: 500 }
    )
  }
}
