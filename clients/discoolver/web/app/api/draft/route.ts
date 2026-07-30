import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * Enters Next.js Draft Mode (EDUX-N4 preview, sf-cms side). Supports the
 * two CMS-wired pages here: home ('/') and influencers ('/influencers').
 * GET /api/draft?secret=<x>&slug=<home|influencers>
 */
export async function GET(request: NextRequest) {
  const previewSecret = process.env.SF_CMS_PREVIEW_SECRET
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  const slug = searchParams.get('slug')

  if (!previewSecret) {
    console.error('SF_CMS_PREVIEW_SECRET not configured')
    return new Response('Server misconfigured', { status: 500 })
  }
  if (!secret) return new Response('Missing secret', { status: 401 })

  const secretBuf = Buffer.from(secret)
  const previewSecretBuf = Buffer.from(previewSecret)
  const isValid =
    secretBuf.length === previewSecretBuf.length &&
    crypto.timingSafeEqual(secretBuf, previewSecretBuf)

  if (!isValid) return new Response('Invalid token', { status: 401 })

  ;(await draftMode()).enable()
  redirect(slug === 'influencers' ? '/influencers' : '/')
}
