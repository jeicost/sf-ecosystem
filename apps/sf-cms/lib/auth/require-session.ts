import { cookies } from 'next/headers'

export async function requireSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('sf-cms-session')

  if (!session || session.value !== 'authenticated') {
    return false
  }

  return true
}

export async function requireSessionOrThrow() {
  if (!(await requireSession())) {
    throw new Error('Unauthorized: valid session required')
  }
}
