import React, { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow: string
  title: string
  subtitle?: string | ReactNode
  eyebrowColor?: string
  className?: string
}

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  eyebrowColor,
  className = '',
}: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <p
        className="text-[10px] uppercase tracking-widest font-semibold mb-2"
        style={{
          color: eyebrowColor ? `${eyebrowColor}cc` : 'var(--text-secondary)',
          letterSpacing: '0.12em',
        }}
      >
        {eyebrow}
      </p>
      <h1 className="text-3xl font-semibold text-ink tracking-tight">{title}</h1>
      {subtitle && (
        <p className="text-sm mt-1.5" style={{ color: 'var(--text-tertiary)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
