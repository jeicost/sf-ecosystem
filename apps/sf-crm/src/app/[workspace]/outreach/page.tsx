import { requireWorkspaceSession } from '@/lib/auth'
import OutreachClient from './OutreachClient'

export const metadata = {
  title: 'Outreach — SF CRM',
}

export default async function OutreachPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const workspaceData = await requireWorkspaceSession(workspace)

  return <OutreachClient workspaceId={workspace} workspace={workspaceData} />
}
