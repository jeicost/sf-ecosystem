'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BrainRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/brand-brain')
  }, [router])

  return null
}
