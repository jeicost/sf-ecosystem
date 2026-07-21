import type { Workspace } from '@/types'

export const WORKSPACES: Workspace[] = [
  {
    id: '00000000-0000-0000-0000-000001',
    name: 'Startup Factory',
    type: 'sf',
    clientId: '00000000-0000-0000-0000-000000000001',
    logo: '/logos/sf.png',
  },
  {
    id: 'ws-discoolver',
    name: 'Discoolver',
    type: 'discoolver',
    clientId: '160d5a90-0da7-4db1-a1fb-9c29ea57a736',
    logo: '/logos/discoolver.png',
  },
  {
    id: 'ws-dadybox',
    name: 'Dadybox',
    type: 'dadybox',
    clientId: 'e664873b-034d-48cd-9a45-8631672ef375',
    logo: '/logos/dadybox.png',
  },
  {
    id: 'ws-salsaburgers',
    name: 'Salsa Burgers',
    type: 'salsaburgers',
    clientId: 'c375bb80-b0d1-4923-a73a-ac96a3ce7799',
    logo: '/logos/salsa-burgers.png',
  },
  {
    id: 'ws-ncglobal',
    name: 'NC Global Assets',
    type: 'ncglobal',
    clientId: 'a1c3e5f7-b9d1-4a2b-c3e5-f7a9b1d3e5f7',
    logo: '/logos/nc-global.png',
  },
]

export const WORKSPACE_PASSWORDS: Record<string, string> = {
  sf: process.env.SF_WORKSPACE_PASSWORD || 'sf2026',
  discoolver: process.env.DISCOOLVER_WORKSPACE_PASSWORD || 'disc2026',
  dadybox: process.env.DADYBOX_WORKSPACE_PASSWORD || 'dadybox2026',
  salsaburgers: process.env.SALSA_WORKSPACE_PASSWORD || 'salsa2026',
  ncglobal: process.env.NC_WORKSPACE_PASSWORD || 'nc2026',
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
