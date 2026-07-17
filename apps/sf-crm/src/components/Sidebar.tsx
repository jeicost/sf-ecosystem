'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

interface SidebarProps {
  workspaceId: string
  workspaceName: string
}

const SECTIONS = [
  {
    title: 'Pipeline',
    items: [
      { label: 'Pipeline', href: '/pipeline' },
    ],
  },
  {
    title: 'Prospection',
    items: [
      { label: 'Search', href: '/prospection' },
    ],
  },
  {
    title: 'Contactos',
    items: [
      { label: 'All Contacts', href: '/contacts' },
      { label: 'Hot Leads', href: '/contacts?score=hot' },
      { label: 'Warm Leads', href: '/contacts?score=warm' },
    ],
  },
  {
    title: 'Outreach',
    items: [
      { label: 'Email Campaigns', href: '/outreach' },
      { label: 'Compose', href: '/outreach?view=compose' },
      { label: 'History', href: '/outreach?view=history' },
    ],
  },
  {
    title: 'Discovery',
    items: [
      { label: 'Runs', href: '/discovery' },
    ],
  },
  {
    title: 'Métricas',
    items: [
      { label: 'Overview', href: '/metrics' },
    ],
  },
  {
    title: 'Connections',
    items: [
      { label: 'Integrations', href: '/integrations' },
    ],
  },
]

export default function Sidebar({ workspaceId, workspaceName }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    const basePath = href.split('?')[0]
    return pathname === `/${workspaceId}${basePath}` || pathname.startsWith(`/${workspaceId}${basePath}/`)
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2>{workspaceName}</h2>
        <p className={styles.subtitle}>CRM</p>
      </div>

      <nav className={styles.nav}>
        {SECTIONS.map(section => (
          <div key={section.title} className={styles.section}>
            <h3 className={styles.sectionTitle}>{section.title}</h3>
            <ul className={styles.sectionItems}>
              {section.items.map(item => (
                <li key={item.href}>
                  <Link
                    href={`/${workspaceId}${item.href}`}
                    className={`${styles.link} ${isActive(item.href) ? styles.active : ''}`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutButton} onClick={() => {
          fetch('/api/auth/logout', { method: 'POST' }).then(() => {
            window.location.href = '/'
          })
        }}>
          Sign Out
        </button>
      </div>
    </aside>
  )
}
