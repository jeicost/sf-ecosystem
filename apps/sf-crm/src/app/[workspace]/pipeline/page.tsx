import { requireWorkspaceSession } from '@/lib/auth'
import PipelineClient from './PipelineClient'

export const metadata = {
  title: 'Pipeline — SF CRM',
}

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace } = await params
  const workspaceData = await requireWorkspaceSession(workspace)

  return <PipelineClient workspaceId={workspace} workspace={workspaceData} />
}
