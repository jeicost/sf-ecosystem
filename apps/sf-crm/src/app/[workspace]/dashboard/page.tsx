import { requireWorkspaceSession } from '@/lib/auth'
import DashboardClient from './DashboardClient'

export const metadata = {
  title: 'Dashboard — SF CRM',
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const workspaceData = await requireWorkspaceSession(workspace)

  return <DashboardClient workspaceId={workspace} workspace={workspaceData} />
}
