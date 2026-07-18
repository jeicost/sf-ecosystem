import { requireWorkspaceSession } from '@/lib/auth'
import DiscoveryClient from './DiscoveryClient'

export const metadata = {
  title: 'Discovery — SF CRM',
}

export default async function DiscoveryPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const workspaceData = await requireWorkspaceSession(workspace)

  return <DiscoveryClient workspaceId={workspace} workspace={workspaceData} />
}
