'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function ClientPortalHome() {
  useEffect(() => {
    redirect('/home')
  }, [])

  return null
}
