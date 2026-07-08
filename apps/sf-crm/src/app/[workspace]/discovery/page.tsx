import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
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
  const session = await getSession()
  if (!session || session.workspace.id !== workspace) {
    redirect('/')
  }

  return <DiscoveryClient workspaceId={workspace} workspace={session.workspace} />
}
