import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import OutreachClient from './OutreachClient'

export const metadata = {
  title: 'Outreach — SF CRM',
}

export default async function OutreachPage({
  params,
}: {
  params: { workspace: string }
}) {
  const session = await getSession()
  if (!session || session.workspace.id !== params.workspace) {
    redirect('/')
  }

  return <OutreachClient workspaceId={params.workspace} workspace={session.workspace} />
}
