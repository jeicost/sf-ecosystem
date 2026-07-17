'use client'

import type { Workspace } from '@/types'
import styles from './integrations.module.css'

interface IntegrationsClientProps {
  workspaceId: string
  workspace: Workspace
}

const INTEGRATIONS = [
  {
    id: 'apollo',
    name: 'Apollo.io',
    description: 'Prospect enrichment and email finding',
    category: 'prospection',
    connected: false,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'LinkedIn profile data and outreach',
    category: 'prospection',
    connected: false,
  },
  {
    id: 'clearbit',
    name: 'Clearbit',
    description: 'Company data and enrichment',
    category: 'enrichment',
    connected: false,
  },
  {
    id: 'hunter',
    name: 'Hunter.io',
    description: 'Email finder and verification',
    category: 'enrichment',
    connected: false,
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Transactional email delivery',
    category: 'outreach',
    connected: true,
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email marketing and campaigns',
    category: 'outreach',
    connected: false,
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing platform',
    category: 'outreach',
    connected: false,
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'CRM and sales platform',
    category: 'analytics',
    connected: false,
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Enterprise CRM system',
    category: 'analytics',
    connected: false,
  },
  {
    id: 'pipedrive',
    name: 'Pipedrive',
    description: 'Sales pipeline management',
    category: 'analytics',
    connected: false,
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and notifications',
    category: 'other',
    connected: false,
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Workflow automation',
    category: 'other',
    connected: false,
  },
]

export default function IntegrationsClient({ workspace }: IntegrationsClientProps) {
  const categories = ['prospection', 'enrichment', 'outreach', 'analytics', 'other']

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Connections</h1>
        <p>{workspace.name}</p>
      </div>

      <div className={styles.comingSoon}>
        <p className={styles.icon}>🔧</p>
        <h2>Integration Hub Coming Soon</h2>
        <p>We're building a comprehensive integration marketplace for seamless third-party connections.</p>
        <p className={styles.details}>Check back soon for OAuth, API key management, and one-click integrations with your favorite tools.</p>
      </div>

      {categories.map(category => {
        const categoryIntegrations = INTEGRATIONS.filter(i => i.category === category)
        if (categoryIntegrations.length === 0) return null

        return (
          <div key={category} className={styles.section}>
            <h2>{category.charAt(0).toUpperCase() + category.slice(1)}</h2>
            <div className={styles.grid}>
              {categoryIntegrations.map(integration => (
                <div key={integration.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <strong>{integration.name}</strong>
                    <span className={styles.badge}>Coming Soon</span>
                  </div>
                  <p className={styles.description}>{integration.description}</p>
                  <button className={`${styles.button} ${styles.disabled}`} disabled>
                    Coming Soon
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
