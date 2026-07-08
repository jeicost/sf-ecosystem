import type { Workspace } from '@/types'

export const WORKSPACES: Workspace[] = [
  {
    id: '00000000-0000-0000-0000-000001',
    name: 'Startup Factory',
    type: 'sf',
    clientId: '00000000-0000-0000-0000-000001',
    logo: '/logos/sf.png',
  },
  {
    id: 'ws-discoolver',
    name: 'Discoolver',
    type: 'discoolver',
    logo: '/logos/discoolver.png',
  },
  {
    id: 'ws-dadybox',
    name: 'Dadybox',
    type: 'dadybox',
    clientId: 'e664873b-034d-48cd-9a45-8631672ef375',
    logo: '/logos/dadybox.png',
  },
]

export const WORKSPACE_PASSWORDS: Record<string, string> = {
  sf: process.env.SF_WORKSPACE_PASSWORD || 'sf2026',
  discoolver: process.env.DISCOOLVER_WORKSPACE_PASSWORD || 'disc2026',
  dadybox: process.env.DADYBOX_WORKSPACE_PASSWORD || 'dadybox2026',
}

export function getWorkspace(id: string): Workspace | undefined {
  return WORKSPACES.find(w => w.id === id)
}

export function getWorkspaceByType(type: string): Workspace | undefined {
  return WORKSPACES.find(w => w.type === type)
}

export function validateWorkspacePassword(workspaceType: string, password: string): boolean {
  const expectedPassword = WORKSPACE_PASSWORDS[workspaceType]
  return expectedPassword === password
}
