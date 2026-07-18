import { requireWorkspaceSession } from '@/lib/auth'
import ProspectionClient from './ProspectionClient'

export const metadata = {
  title: 'Prospection — SF CRM',
}

export default async function ProspectionPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const workspaceData = await requireWorkspaceSession(workspace)

  return <ProspectionClient workspaceId={workspace} workspace={workspaceData} />
}
