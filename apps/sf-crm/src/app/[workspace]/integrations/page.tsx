import { requireWorkspaceSession } from '@/lib/auth'
import IntegrationsClient from './IntegrationsClient'

export const metadata = {
  title: 'Integrations — SF CRM',
}

export default async function IntegrationsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const workspaceData = await requireWorkspaceSession(workspace)

  return <IntegrationsClient workspaceId={workspace} workspace={workspaceData} />
}
