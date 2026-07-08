import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/auth'
import { getWorkspace, validateWorkspacePassword } from '@/lib/workspaces'

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, password } = await request.json()

    if (!workspaceId || !password) {
      return NextResponse.json(
        { error: 'Workspace ID and password are required' },
        { status: 400 }
      )
    }

    const workspace = getWorkspace(workspaceId)
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    const isValid = validateWorkspacePassword(workspace.type, password)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    await createSession(workspaceId)

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.name,
        type: workspace.type,
      },
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    )
  }
}
