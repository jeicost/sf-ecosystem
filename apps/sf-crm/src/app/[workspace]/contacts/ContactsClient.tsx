'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Workspace, Contact } from '@/types'
import { getHotScore } from '@/lib/utils'
import styles from './contacts.module.css'

interface ContactsClientProps {
  workspaceId: string
  workspace: Workspace
}

export default function ContactsClient({ workspaceId, workspace }: ContactsClientProps) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterScore, setFilterScore] = useState<'all' | 'hot' | 'warm' | 'cold'>('all')

  useEffect(() => {
    async function loadContacts() {
      try {
        setLoading(true)
        // TODO: Fetch actual contacts from API
        const mockContacts: Contact[] = [
          {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            company: 'TechCorp',
            title: 'CTO',
            email: 'john@techcorp.com',
            phone: '+34 912 345 678',
            linkedinUrl: 'https://linkedin.com/in/johndoe',
            geography: 'Madrid',
            industry: 'Technology',
            score: 85,
            stage: 'proposal',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            company: 'FinanceHub',
            title: 'Director',
            email: 'jane@financehub.com',
            phone: '+34 934 567 890',
            linkedinUrl: 'https://linkedin.com/in/janesmith',
            geography: 'Barcelona',
            industry: 'Finance',
            score: 62,
            stage: 'engaged',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]
        setContacts(mockContacts)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contacts')
      } finally {
        setLoading(false)
      }
    }

    loadContacts()
  }, [workspaceId])

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm ||
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesScore = filterScore === 'all' || getHotScore(contact.score) === filterScore

    return matchesSearch && matchesScore
  })

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading contacts...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Contactos</h1>
        <p>{workspace.name} — {filteredContacts.length} contacts</p>
      </div>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <div className={styles.filters}>
          <button
            className={`${styles.filterButton} ${filterScore === 'all' ? styles.active : ''}`}
            onClick={() => setFilterScore('all')}
          >
            All
          </button>
          <button
            className={`${styles.filterButton} ${filterScore === 'hot' ? styles.active : ''}`}
            onClick={() => setFilterScore('hot')}
          >
            Hot
          </button>
          <button
            className={`${styles.filterButton} ${filterScore === 'warm' ? styles.active : ''}`}
            onClick={() => setFilterScore('warm')}
          >
            Warm
          </button>
          <button
            className={`${styles.filterButton} ${filterScore === 'cold' ? styles.active : ''}`}
            onClick={() => setFilterScore('cold')}
          >
            Cold
          </button>
        </div>
      </div>

      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Company</th>
              <th>Title</th>
              <th>Email</th>
              <th>Score</th>
              <th>Stage</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredContacts.map(contact => (
              <tr key={contact.id}>
                <td>
                  <strong>
                    {contact.firstName} {contact.lastName}
                  </strong>
                </td>
                <td>{contact.company}</td>
                <td>{contact.title}</td>
                <td>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </td>
                <td>
                  <span className={`${styles.score} ${styles[getHotScore(contact.score)]}`}>
                    {contact.score}
                  </span>
                </td>
                <td>
                  <span className={styles.stage}>{contact.stage}</span>
                </td>
                <td>
                  <Link href={`/${workspaceId}/contacts/${contact.id}`} className={styles.viewLink}>
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredContacts.length === 0 && (
          <div className={styles.empty}>
            <p>No contacts found</p>
          </div>
        )}
      </div>
    </div>
  )
}
