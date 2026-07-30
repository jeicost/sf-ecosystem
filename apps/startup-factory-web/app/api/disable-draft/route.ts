import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/** Exits Next.js Draft Mode. No auth required to leave preview, only to enter it. */
export async function GET() {
  ;(await draftMode()).disable()
  redirect('/es')
}
