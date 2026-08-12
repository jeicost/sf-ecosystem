import { NextRequest, NextResponse } from 'next/server'
import { handleExtractRequest } from '@/lib/onboarding/extract-fields'

export const maxDuration = 60

// POST /api/onboarding/extract — {text, step, clientId?}
//
// Ruta CANÓNICA del extractor "pega texto y te relleno el paso". Abierta al
// dueño de la marca sobre su propio cliente (el permiso lo decide
// resolveRequestClient dentro del handler). La vieja
// /api/admin/onboarding/extract sigue funcionando como alias.
export async function POST(req: NextRequest): Promise<NextResponse> {
  return handleExtractRequest(req)
}
