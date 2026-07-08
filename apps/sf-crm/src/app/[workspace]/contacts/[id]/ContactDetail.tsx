'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Workspace, Contact } from '@/types'
import { getHotScore } from '@/lib/utils'
import styles from './detail.module.css'

interface ContactDetailProps {
  workspaceId: string
  contactId: string
  workspace: Workspace
}

export default function ContactDetail({ workspaceId, contactId, workspace }: ContactDetailProps) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Contact>>({})

  useEffect(() => {
    async function loadContact() {
      try {
        setLoading(true)
        const res = await fetch(`/api/contacts/${contactId}`)
        if (!res.ok) throw new Error('Contact not found')
        const json = await res.json()
        setContact(json.data as Contact)
        setFormData(json.data as Contact)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact')
      } finally {
        setLoading(false)
      }
    }

    loadContact()
  }, [contactId])

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) throw new Error('Failed to update contact')
      const json = await res.json()
      setContact(json.data as Contact)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact')
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading contact...</div>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error || 'Contact not found'}</div>
        <Link href={`/${workspaceId}/contacts`} className={styles.backLink}>
          ← Back to Contacts
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href={`/${workspaceId}/contacts`} className={styles.backLink}>
          ← Back
        </Link>
        <h1>{contact.firstName} {contact.lastName}</h1>
        <button
          className={styles.editButton}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.card}>
          <h2>Basic Info</h2>
          <div className={styles.field}>
            <label>Company</label>
            {isEditing ? (
              <input
                value={formData.company || ''}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            ) : (
              <p>{contact.company}</p>
            )}
          </div>
          <div className={styles.field}>
            <label>Title</label>
            {isEditing ? (
              <input
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            ) : (
              <p>{contact.title}</p>
            )}
          </div>
          <div className={styles.field}>
            <label>Email</label>
            {isEditing ? (
              <input
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            ) : (
              <p>{contact.email}</p>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h2>Classification</h2>
          <div className={styles.field}>
            <label>Score</label>
            {isEditing ? (
              <input
                type="number"
                value={formData.score || 0}
                onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
              />
            ) : (
              <div className={styles.score}>
                <span className={styles[`score-${getHotScore(contact.score)}`]}>
                  {contact.score}
                </span>
              </div>
            )}
          </div>
          <div className={styles.field}>
            <label>Stage</label>
            {isEditing ? (
              <select
                value={formData.stage || 'prospect'}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
              >
                <option value="prospect">Prospect</option>
                <option value="qualified">Qualified</option>
                <option value="engaged">Engaged</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            ) : (
              <p>{contact.stage}</p>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h2>Details</h2>
          <div className={styles.field}>
            <label>Geography</label>
            <p>{contact.geography || '—'}</p>
          </div>
          <div className={styles.field}>
            <label>Industry</label>
            <p>{contact.industry || '—'}</p>
          </div>
          <div className={styles.field}>
            <label>LinkedIn</label>
            {contact.linkedinUrl ? (
              <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer">
                {contact.linkedinUrl}
              </a>
            ) : (
              <p>—</p>
            )}
          </div>
          <div className={styles.field}>
            <label>Notes</label>
            {isEditing ? (
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
              />
            ) : (
              <p className={styles.notes}>{contact.notes || '—'}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className={styles.actions}>
            <button className={styles.saveButton} onClick={handleSave}>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
