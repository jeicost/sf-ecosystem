import React from 'react'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href: string
  }
  className?: string
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`card rounded-2xl p-12 flex flex-col items-center justify-center text-center ${className}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      {icon && (
        <div className="mb-4 text-ink-tertiary">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>

      {description && (
        <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
          {description}
        </p>
      )}

      {action && (
        <Link
          href={action.href}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
          style={{
            background: 'rgba(99,102,241,0.2)',
            color: '#6366F1',
            border: '1px solid rgba(99,102,241,0.3)',
          }}
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
