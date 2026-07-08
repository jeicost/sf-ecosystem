import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PipelineClient from './PipelineClient'

export const metadata = {
  title: 'Pipeline — SF CRM',
}

export default async function PipelinePage({
  params,
}: {
  params: { workspace: string }
}) {
  const session = await getSession()
  if (!session || session.workspace.id !== params.workspace) {
    redirect('/')
  }

  return <PipelineClient workspaceId={params.workspace} workspace={session.workspace} />
}
