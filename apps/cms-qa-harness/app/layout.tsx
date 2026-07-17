import type { Metadata } from 'next'
import { initCmsClient } from '@sf/cms-client'
import './globals.css'

export const metadata: Metadata = {
  title: 'CMS QA Harness',
  description: 'Internal testing tool for SF-CMS validation',
}

// Initialize CMS client at app startup
initCmsClient({
  apiUrl: process.env.NEXT_PUBLIC_CMS_API_URL || 'http://localhost:3002/api/public',
  apiKey: process.env.NEXT_PUBLIC_CMS_API_KEY || 'sk-dummy',
  projectSlug: process.env.NEXT_PUBLIC_CMS_PROJECT_SLUG || 'qa-harness',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
