'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Workspace } from '@/types'
import styles from './outreach.module.css'

interface OutreachClientProps {
  workspaceId: string
  workspace: Workspace
}

export default function OutreachClient({ workspaceId, workspace }: OutreachClientProps) {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'campaigns' | 'compose'>('campaigns')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipients, setRecipients] = useState('')

  useEffect(() => {
    const view = searchParams.get('view')
    if (view === 'compose') {
      setTab('compose')
    } else {
      setTab('campaigns')
    }
  }, [searchParams])

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault()

    try {
      const response = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          recipients: recipients.split('\n').filter(Boolean),
          workspaceId,
        }),
      })

      if (response.ok) {
        alert('Email sent successfully')
        setSubject('')
        setBody('')
        setRecipients('')
      }
    } catch (error) {
      console.error('Send error:', error)
      alert('Failed to send email')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Outreach</h1>
        <p>{workspace.name}</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'campaigns' ? styles.active : ''}`}
          onClick={() => setTab('campaigns')}
        >
          Campaigns
        </button>
        <button
          className={`${styles.tab} ${tab === 'compose' ? styles.active : ''}`}
          onClick={() => setTab('compose')}
        >
          Compose
        </button>
      </div>

      {tab === 'campaigns' && (
        <div className={styles.content}>
          <div className={styles.empty}>
            <p>No campaigns yet</p>
          </div>
        </div>
      )}

      {tab === 'compose' && (
        <div className={styles.content}>
          <form onSubmit={handleSendEmail} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="recipients">Recipients (one email per line)</label>
              <textarea
                id="recipients"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
                placeholder="email1@example.com&#10;email2@example.com"
                className={styles.textarea}
                rows={4}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="subject">Subject</label>
              <input
                id="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="body">Message</label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Email body"
                className={styles.textarea}
                rows={10}
              />
            </div>

            <button type="submit" className={styles.submitButton}>
              Send Email
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
