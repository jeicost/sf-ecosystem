import type { HotScore, Contact } from '@/types'

export function getHotScore(score: number): HotScore {
  if (score >= 75) return 'hot'
  if (score >= 50) return 'warm'
  return 'cold'
}

export function calculateScore(contact: Partial<Contact>): number {
  let score = 0

  // Email present: +20 points
  if (contact.email) score += 20

  // Phone present: +10 points
  if (contact.phone) score += 10

  // LinkedIn URL present: +15 points
  if (contact.linkedinUrl) score += 15

  // Company present: +20 points
  if (contact.company) score += 20

  // Title present: +15 points
  if (contact.title) score += 15

  // Industry present: +10 points
  if (contact.industry) score += 10

  // Geography present: +5 points
  if (contact.geography) score += 5

  return Math.min(score, 100) // Cap at 100
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  // Basic phone validation - can be customized per region
  const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}
