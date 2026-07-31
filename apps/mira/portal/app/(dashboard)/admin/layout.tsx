import React from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@sf/supabase'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      getAll: () => cookieStore.getAll(),
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || user.user_metadata?.plan !== 'super_admin') {
    redirect('/home')
  }

  return <div className="space-y-6">{children}</div>
}
