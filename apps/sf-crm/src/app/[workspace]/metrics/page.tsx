import { requireWorkspaceSession } from '@/lib/auth'
import MetricsClient from './MetricsClient'

export const metadata = {
  title: 'Metrics — SF CRM',
}

export default async function MetricsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const workspaceData = await requireWorkspaceSession(workspace)

  return <MetricsClient workspaceId={workspace} workspace={workspaceData} />
}
