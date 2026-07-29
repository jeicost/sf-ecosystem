'use client'

// Client boundary del BrainChat: resuelve si el usuario es agencia
// (admin/super_admin confirman propuestas) desde la sesión de Supabase.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import BrainChat from '@/components/brain/BrainChat'

export default function BrainChatGate() {
  const [isAgency, setIsAgency] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const plan = (data.user?.user_metadata?.plan as string) ?? 'starter'
        setIsAgency(plan === 'super_admin' || plan === 'admin')
      })
      .finally(() => setReady(true))
  }, [])

  if (!ready) return null
  return <BrainChat isAgency={isAgency} />
}
