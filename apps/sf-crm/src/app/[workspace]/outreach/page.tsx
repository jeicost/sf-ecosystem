import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
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
  const session = await getSession()
  if (!session || session.workspace.id !== workspace) {
    redirect('/')
  }

  return <OutreachClient workspaceId={workspace} workspace={session.workspace} />
}
