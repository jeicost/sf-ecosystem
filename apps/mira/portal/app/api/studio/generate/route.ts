import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, resolveRequestClient } from '@/lib/resolve-client'
import { generateStudioImage, STUDIO_FORMATS, type StudioFormat } from '@/lib/generation/image-studio'

export const maxDuration = 120

// Estudio Visual v1 — genera una imagen de marca. Valida acceso al cliente,
// compone el prompt desde el Brand Brain y devuelve la imagen. La generación
// puede tardar; maxDuration 120.
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const format: StudioFormat = body.format in STUDIO_FORMATS ? body.format : 'post'
    if (!prompt) return NextResponse.json({ error: 'A description is required' }, { status: 400 })

    const access = await resolveRequestClient(body.clientId ?? null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const result = await generateStudioImage({
      clientId: access.clientId,
      referenceImages: Array.isArray(body.referenceImages) ? body.referenceImages.slice(0, 3) : [],
      userPrompt: prompt,
      format,
      userId: user.id,
    })
    if (!result) {
      return NextResponse.json(
        { error: 'Could not generate the image. Check the OpenAI key in Integrations.' },
        { status: 502 }
      )
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error('studio/generate error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    )
  }
}
