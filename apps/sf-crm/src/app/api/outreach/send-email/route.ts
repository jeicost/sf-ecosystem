import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createOutreachEmail, createActivity } from '@/lib/db'

// This would use Resend API in production
// For now, we'll create mock implementation

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { subject, body, recipients, workspaceId } = await request.json()

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients provided' },
        { status: 400 }
      )
    }

    if (!subject || !body) {
      return NextResponse.json(
        { error: 'Subject and body are required' },
        { status: 400 }
      )
    }

    const results = {
      sent: 0,
      failed: 0,
      emails: [] as any[],
    }

    for (const email of recipients) {
      try {
        // In production, call Resend API here
        // const response = await resend.emails.send({ to: email, subject, html: body })

        // For now, create local record
        const outreachEmail = await createOutreachEmail({
          contactId: '', // Would be looked up from contact
          to: email,
          subject,
          body,
          status: 'sent',
          sentAt: new Date().toISOString(),
          workspaceId,
          createdAt: new Date().toISOString(),
        })

        // Log activity
        await createActivity({
          contactId: '', // Would be looked up from contact
          type: 'email_sent',
          description: `Email sent: ${subject}`,
          metadata: { emailId: outreachEmail.id },
          createdAt: new Date().toISOString(),
          createdBy: 'system',
        })

        results.sent++
        results.emails.push(outreachEmail)
      } catch (err) {
        results.failed++
        console.error(`Failed to send to ${email}:`, err)
      }
    }

    return NextResponse.json({
      success: results.failed === 0,
      ...results,
    })
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    )
  }
}
