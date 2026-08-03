import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { requireAuth } from '@/lib/auth'
import { createOutreachEmail, createActivity } from '@/lib/db'
import { handleApiError, isSchemaMissingError } from '@/lib/api-errors'

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

    // Instanciar aquí y no a nivel de módulo: el constructor lanza sin key
    // y rompía la build de Vercel al recolectar page data.
    const resend = new Resend(process.env.RESEND_API_KEY)

    const results = {
      sent: 0,
      failed: 0,
      emails: [] as any[],
      errors: [] as string[],
    }
    let recordingUnavailable = false

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

        // Past this point the email HAS been delivered to Resend — local
        // record-keeping is best-effort and must never flag the send as failed
        // (outreach_emails is not provisioned in the live DB yet: PGRST205).
        let outreachEmail: any = null
        try {
          outreachEmail = await createOutreachEmail({
            contactId: contactId || '',
            to: email,
            subject,
            body,
            status: 'sent',
            sentAt: new Date().toISOString(),
            workspaceId: workspaceId || session.workspace.id,
          })
        } catch (recordErr) {
          if (isSchemaMissingError(recordErr)) {
            recordingUnavailable = true
          } else {
            console.error(`Failed to record outreach email for ${email}:`, recordErr)
          }
        }

        // Log activity (best-effort too)
        if (contactId) {
          try {
            await createActivity({
              contactId,
              type: 'email_sent',
              description: `Email sent: ${subject}`,
              metadata: { emailId: outreachEmail?.id, resendId: response.data?.id },
              createdBy: session.workspace.id,
            })
          } catch (activityErr) {
            console.error(`Failed to log activity for ${email}:`, activityErr)
          }
        }

        results.sent++
        if (outreachEmail) results.emails.push(outreachEmail)
      } catch (err) {
        results.failed++
        results.errors.push(`${email}: ${err instanceof Error ? err.message : 'send failed'}`)
        console.error(`Failed to send to ${email}:`, err)
      }
    }

    return NextResponse.json({
      success: results.failed === 0,
      ...results,
      ...(recordingUnavailable
        ? {
            warning:
              'emails sent but not recorded: outreach_emails table not provisioned yet (no migration defines it — apply DDL via the Supabase SQL editor)',
          }
        : {}),
    })
  } catch (error) {
    return handleApiError(error, 'Failed to send emails')
  }
}
