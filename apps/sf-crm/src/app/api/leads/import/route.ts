import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createLead, createCrmContact } from '@/lib/db'
import { calculateScore, validateEmail } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { leads } = await request.json()

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty leads array' },
        { status: 400 }
      )
    }

    const results = {
      imported: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (let i = 0; i < leads.length; i++) {
      try {
        const lead = leads[i]

        // Validate required fields
        if (!lead.email || !validateEmail(lead.email)) {
          results.errors.push(`Row ${i + 1}: Invalid email`)
          results.failed++
          continue
        }

        if (!lead.firstName || !lead.lastName) {
          results.errors.push(`Row ${i + 1}: Missing first or last name`)
          results.failed++
          continue
        }

        // Calculate score based on enriched data
        const score = calculateScore(lead)

        // Create contact based on workspace type
        if (session.workspace.type === 'sf') {
          await createLead(session.workspace.clientId || '', {
            firstName: lead.firstName,
            lastName: lead.lastName,
            company: lead.company || '',
            title: lead.title || '',
            email: lead.email,
            phone: lead.phone,
            linkedinUrl: lead.linkedinUrl,
            geography: lead.geography,
            industry: lead.industry,
            score,
            stage: 'prospect',
          })
        } else {
          await createCrmContact(session.workspace.id, {
            firstName: lead.firstName,
            lastName: lead.lastName,
            company: lead.company || '',
            title: lead.title || '',
            email: lead.email,
            phone: lead.phone,
            linkedinUrl: lead.linkedinUrl,
            geography: lead.geography,
            industry: lead.industry,
            score,
            stage: 'prospect',
          })
        }

        results.imported++
      } catch (err) {
        results.errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        results.failed++
      }
    }

    return NextResponse.json({
      success: results.failed === 0,
      ...results,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import leads' },
      { status: 500 }
    )
  }
}
