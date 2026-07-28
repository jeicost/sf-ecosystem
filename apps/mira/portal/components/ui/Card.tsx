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

// Fondo/borde por tokens del tema (bg-card/border-line), NO estilo inline:
// el rgba(255,255,255,...) hardcodeado anterior ganaba a las clases y dejaba
// estos cards prácticamente invisibles en modo claro (blanco sobre blanco).
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
      el.style.borderColor = ''
      el.style.boxShadow = ''
    }
  }

  const combinedClassName = `bg-card border border-line ${radiusClass} ${paddingClass} ${interactive ? 'transition-all duration-200 cursor-pointer' : ''} ${className}`

  if (as === 'a' && href) {
    return (
      <Link
        href={href}
        ref={ref as any}
        className={combinedClassName}
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}
