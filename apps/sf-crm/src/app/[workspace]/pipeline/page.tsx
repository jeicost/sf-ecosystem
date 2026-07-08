import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
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
  const session = await getSession()
  if (!session || session.workspace.id !== workspace) {
    redirect('/')
  }

  return <PipelineClient workspaceId={workspace} workspace={session.workspace} />
}
