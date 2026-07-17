'use client'

import React, { useRef } from 'react'
import Link from 'next/link'

type CardRadius = 'card' | 'hero'
type CardPadding = 'sm' | 'md' | 'lg'
type CardElement = 'div' | 'a'

interface CardProps {
  as?: CardElement
  href?: string
  radius?: CardRadius
  interactive?: boolean
  accentColor?: string
  padding?: CardPadding
  className?: string
  children: React.ReactNode
}

const PADDING_MAP: Record<CardPadding, string> = {
  sm: 'px-4 py-3',
  md: 'p-5',
  lg: 'p-4',
}

const RADIUS_MAP: Record<CardRadius, string> = {
  card: 'rounded-xl',
  hero: 'rounded-2xl',
}

export default function Card({
  as = 'div',
  href,
  radius = 'card',
  interactive = false,
  accentColor,
  padding = 'md',
  className = '',
  children,
}: CardProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const paddingClass = PADDING_MAP[padding]
  const radiusClass = RADIUS_MAP[radius]

  const baseStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    boxShadow: 'none',
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (interactive && accentColor) {
      const el = e.currentTarget as HTMLElement
      el.style.borderColor = `${accentColor}40`
      el.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px ${accentColor}20`
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (interactive) {
      const el = e.currentTarget as HTMLElement
      el.style.borderColor = 'rgba(255,255,255,0.09)'
      el.style.boxShadow = 'none'
    }
  }

  const combinedClassName = `${radiusClass} ${paddingClass} ${interactive ? 'transition-all duration-200 cursor-pointer' : ''} ${className}`

  if (as === 'a' && href) {
    return (
      <Link
        href={href}
        ref={ref as any}
        className={combinedClassName}
        style={baseStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </Link>
    )
  }

  return (
    <div
      className={combinedClassName}
      style={baseStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}
