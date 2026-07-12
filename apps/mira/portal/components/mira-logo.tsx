'use client'
import { useId } from 'react'

/**
 * MIRA Logo — "La M que Ve"
 * Concepto: dos arcos formando una M con ojo/pupila en el espacio negativo central
 * Expresión: Dusk (blanco → violeta · gradiente) — versión principal
 */

interface LogoProps {
  size?: number
  variant?: 'icon' | 'lockup' | 'stacked'
  glow?: boolean
  className?: string
}

export default function MiraLogo({ size = 32, variant = 'icon', glow = false, className }: LogoProps) {
  const reactId = useId()
  const id = reactId.replace(/:/g, '')

  const strokeW = size < 24 ? 9 : size < 36 ? 7.5 : size < 56 ? 6 : 5.5
  const pupilR  = size < 24 ? 5 : size < 36 ? 3.5 : 2.2

  const Icon = (
    <svg viewBox="0 0 100 100" fill="none" width={size} height={size} className={variant === 'icon' ? className : undefined}>
      <defs>
        <linearGradient id={`g-${id}`} x1="30%" y1="0%" x2="70%" y2="100%">
          <stop offset="0%"   stopColor="#f4f4f8" />
          <stop offset="60%"  stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <radialGradient id={`p-${id}`} cx="38%" cy="38%" r="62%">
          <stop offset="0%"   stopColor="#fefeff" />
          <stop offset="100%" stopColor="#e9d5ff" />
        </radialGradient>
        {glow && (
          <filter id={`glow-${id}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>

      {/* Left arc */}
      <path
        d="M16,82 L16,26 C16,12 24,10 35,10 C46,10 55,24 50,42 C40,56 40,66 50,72"
        stroke={`url(#g-${id})`}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glow ? `url(#glow-${id})` : undefined}
      />
      {/* Right arc */}
      <path
        d="M84,82 L84,26 C84,12 76,10 65,10 C54,10 45,24 50,42 C60,56 60,66 50,72"
        stroke={`url(#g-${id})`}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={glow ? `url(#glow-${id})` : undefined}
      />
      {/* Glow halo */}
      {size >= 40 && <circle cx="50" cy="57" r="6" fill="#7c3aed" opacity=".1" />}
      {/* Pupil */}
      <circle cx="50" cy="57" r={pupilR} fill={`url(#p-${id})`} />
      {/* Highlight */}
      {size >= 24 && <circle cx="49.2" cy="56.2" r={pupilR * 0.3} fill="white" opacity=".9" />}
    </svg>
  )

  if (variant === 'icon') return Icon

  if (variant === 'lockup') {
    const textSize = size * 0.43
    const totalW   = size + size * 0.22 + textSize * 2.8
    return (
      <svg viewBox={`0 0 ${totalW} ${size}`} fill="none" width={totalW} height={size} className={className}>
        <defs>
          <linearGradient id={`g-${id}`} x1="30%" y1="0%" x2="70%" y2="100%">
            <stop offset="0%"   stopColor="#f4f4f8" />
            <stop offset="60%"  stopColor="#c4b5fd" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          <radialGradient id={`p-${id}`} cx="38%" cy="38%" r="62%">
            <stop offset="0%"   stopColor="#fefeff" />
            <stop offset="100%" stopColor="#e9d5ff" />
          </radialGradient>
        </defs>
        {/* Icon scaled to size */}
        <g transform={`scale(${size / 100})`}>
          <path d="M16,82 L16,26 C16,12 24,10 35,10 C46,10 55,24 50,42 C40,56 40,66 50,72"
                stroke={`url(#g-${id})`} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M84,82 L84,26 C84,12 76,10 65,10 C54,10 45,24 50,42 C60,56 60,66 50,72"
                stroke={`url(#g-${id})`} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="50" cy="57" r={pupilR} fill={`url(#p-${id})`} />
          {size >= 24 && <circle cx="49.2" cy="56.2" r={pupilR * 0.3} fill="white" opacity=".9" />}
        </g>
        {/* Wordmark */}
        <text
          x={size + size * 0.18}
          y={size * 0.68}
          fontFamily="'Space Grotesk', 'Inter', sans-serif"
          fontSize={textSize}
          fontWeight="500"
          letterSpacing="1"
          fill="#f4f4f8"
        >
          MIRA
        </text>
      </svg>
    )
  }

  // stacked variant
  return (
    <div className={`flex flex-col items-center gap-2 ${className ?? ''}`}>
      {Icon}
      <span style={{
        fontFamily: "'Space Grotesk', 'Inter', sans-serif",
        fontSize: size * 0.28,
        fontWeight: 500,
        letterSpacing: '0.15em',
        color: '#f4f4f8',
      }}>MIRA</span>
    </div>
  )
}
