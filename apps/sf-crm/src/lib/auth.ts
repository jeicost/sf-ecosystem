import { cookies } from 'next/headers'
import type { AuthSession } from '@/types'
import { validateWorkspacePassword, getWorkspace } from './workspaces'

const SESSION_COOKIE_NAME = 'sf-crm-session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export async function createSession(workspaceId: string): Promise<string> {
  const workspace = getWorkspace(workspaceId)
  if (!workspace) {
    throw new Error('Workspace not found')
  }

  const session: AuthSession = {
    workspace,
    expiresAt: Date.now() + SESSION_DURATION,
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  })

  return workspaceId
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  try {
    const session: AuthSession = JSON.parse(sessionCookie.value)

    if (session.expiresAt < Date.now()) {
      await clearSession()
      return null
    }

    return session
  } catch (error) {
    console.error('Failed to parse session cookie:', error)
    await clearSession()
    return null
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export class AuthError extends Error {
  constructor(message = 'Unauthorized: No valid session') {
    super(message)
    this.name = 'AuthError'
  }
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await getSession()
  if (!session) {
    throw new AuthError()
  }
  return session
}

export function verifyWorkspacePassword(workspaceType: string, password: string): boolean {
  return validateWorkspacePassword(workspaceType, password)
}
