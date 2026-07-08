import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MetricsClient from './MetricsClient'

export const metadata = {
  title: 'Metrics — SF CRM',
}

export default async function MetricsPage({
  params,
}: {
  params: { workspace: string }
}) {
  const session = await getSession()
  if (!session || session.workspace.id !== params.workspace) {
    redirect('/')
  }

  return <MetricsClient workspaceId={params.workspace} workspace={session.workspace} />
}
