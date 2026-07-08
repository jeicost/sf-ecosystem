import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
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
  const session = await getSession()
  if (!session || session.workspace.id !== workspace) {
    redirect('/')
  }

  return <MetricsClient workspaceId={workspace} workspace={session.workspace} />
}
