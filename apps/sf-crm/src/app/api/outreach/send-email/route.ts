import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAuth } from '@/lib/auth'
import { createOutreachEmail, createActivity } from '@/lib/db'
import { handleApiError } from '@/lib/api-errors'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { subject, body, recipients, workspaceId, contactId } = await request.json()

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

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Resend API key not configured' },
        { status: 500 }
      )
    }

    const results = {
      sent: 0,
      failed: 0,
      emails: [] as any[],
      errors: [] as string[],
    }

    for (const email of recipients) {
      try {
        // Send via Resend API
        const response = await resend.emails.send({
          from: 'noreply@startupsfactory.es',
          to: email,
          subject,
          html: body,
        })

        if (response.error) {
          results.failed++
          results.errors.push(`${email}: ${response.error.message}`)
          continue
        }

        // Create local record
        const outreachEmail = await createOutreachEmail({
          contactId: contactId || '',
          to: email,
          subject,
          body,
          status: 'sent',
          sentAt: new Date().toISOString(),
          workspaceId: workspaceId || session.workspace.id,
        })

        // Log activity
        if (contactId) {
          await createActivity({
            contactId,
            type: 'email_sent',
            description: `Email sent: ${subject}`,
            metadata: { emailId: outreachEmail.id, resendId: response.data?.id },
            createdBy: session.workspace.id,
          })
        }

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
    return handleApiError(error, 'Failed to send emails')
  }
}
