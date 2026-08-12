import { NextRequest, NextResponse } from 'next/server'
import { handleExtractRequest } from '@/lib/onboarding/extract-fields'

export const maxDuration = 60

// ALIAS de compatibilidad. La ruta canónica es POST /api/onboarding/extract.
//
// El extractor estaba aquí, bajo /admin y detrás de requireSuperAdmin(): la
// pieza que más trabajo ahorra en un alta ("pega tu web y te la relleno")
// reservada precisamente a quien no la necesita. La lógica se movió a
// lib/onboarding/extract-fields.ts y el permiso lo decide ahora
// resolveRequestClient — cada quien extrae sobre su propio cliente.
//
// Esta ruta se mantiene porque el AssistantPanel del wizard de agencia
// (components/admin/onboarding-wizard/AssistantPanel.tsx) ya apunta a ella.
// El comportamiento es idéntico: el super_admin sigue pudiendo extraer sin
// cliente resuelto mientras da de alta uno que aún no existe.
export async function POST(req: NextRequest): Promise<NextResponse> {
  return handleExtractRequest(req)
}
