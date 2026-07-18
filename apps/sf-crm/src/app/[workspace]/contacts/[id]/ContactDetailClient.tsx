'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Contact } from '@/types'
import styles from './contactDetail.module.css'

interface ContactDetailClientProps {
  contactId: string
}

export default function ContactDetailClient({
  contactId,
}: ContactDetailClientProps) {
  const router = useRouter()
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchContact() {
      try {
        const response = await fetch(`/api/contacts/${contactId}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Contact not found')
          } else {
            setError('Failed to load contact')
          }
          return
        }
        const data = await response.json()
        setContact(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact')
      } finally {
        setLoading(false)
      }
    }

    fetchContact()
  }, [contactId])

  if (loading) {
    return <div className={styles.container}>Loading...</div>
  }

  if (error || !contact) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Contact not found'}</div>
        <button className={styles.backButton} onClick={() => router.back()}>
          ← Back
        </button>
      </div>
    )
  }

  const hotScore = contact.score ?? 0
  const scoreClass =
    hotScore >= 75 ? 'hot' : hotScore >= 50 ? 'warm' : 'cold'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => router.back()}>
          ← Back to Contacts
        </button>
        <div className={styles.titleSection}>
          <h1>
            {contact.firstName && contact.lastName
              ? `${contact.firstName} ${contact.lastName}`
              : contact.company || 'Contact'}
          </h1>
          <span className={`${styles.scoreBadge} ${styles[scoreClass]}`}>
            {scoreClass.toUpperCase()}
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.section}>
          <h2>Company</h2>
          <p className={styles.value}>{contact.company || 'N/A'}</p>
        </div>

        <div className={styles.section}>
          <h2>Title</h2>
          <p className={styles.value}>{contact.title || 'N/A'}</p>
        </div>

        <div className={styles.section}>
          <h2>Email</h2>
          <a href={`mailto:${contact.email}`} className={styles.link}>
            {contact.email || 'N/A'}
          </a>
        </div>

        {contact.phone && (
          <div className={styles.section}>
            <h2>Phone</h2>
            <a href={`tel:${contact.phone}`} className={styles.link}>
              {contact.phone}
            </a>
          </div>
        )}

        {contact.geography && (
          <div className={styles.section}>
            <h2>Location</h2>
            <p className={styles.value}>{contact.geography}</p>
          </div>
        )}

        {contact.industry && (
          <div className={styles.section}>
            <h2>Industry</h2>
            <p className={styles.value}>{contact.industry}</p>
          </div>
        )}

        <div className={styles.section}>
          <h2>Stage</h2>
          <p className={styles.value}>{contact.stage || 'prospect'}</p>
        </div>

        <div className={styles.section}>
          <h2>Score</h2>
          <p className={styles.value}>{hotScore}</p>
        </div>

        {contact.linkedinUrl && (
          <div className={styles.section}>
            <h2>LinkedIn</h2>
            <a
              href={contact.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
            >
              View Profile →
            </a>
          </div>
        )}

        {contact.notes && (
          <div className={styles.section}>
            <h2>Notes</h2>
            <p className={styles.value}>{contact.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
