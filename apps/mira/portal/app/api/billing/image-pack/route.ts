import { NextRequest, NextResponse } from 'next/server'
import { resolveRequestClient } from '@/lib/resolve-client'
import { adminClient } from '@/lib/supabase'
import { BILLING_ADDONS, IMAGE_PACK_SIZE } from '@/lib/billing/plans'
import { getStripe, imagePackPriceId, appUrl, stripeEnabled } from '@/lib/billing/stripe'
import { getImageQuotaStatus } from '@/lib/image-quota-server'

// El pack de 100 imágenes: pago ÚNICO, no suscripción.
//
// Quien confirma la compra no es esta ruta, es el webhook — igual que en las
// suscripciones. Aquí solo se abre la sesión de pago; dar las imágenes al
// volver del navegador sería regalarlas a quien teclee la URL de éxito.

export async function GET(req: NextRequest) {
  const access = await resolveRequestClient(req.nextUrl.searchParams.get('clientId'))
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })
  const quota = await getImageQuotaStatus(access.clientId).catch(() => null)
  return NextResponse.json({
    // Dos condiciones distintas: que haya claves de Stripe y que exista el
    // precio del pack. Sin las dos, el botón no debe aparecer.
    payable: stripeEnabled() && Boolean(imagePackPriceId()),
    images: IMAGE_PACK_SIZE,
    eur: BILLING_ADDONS.image_pack.eur,
    quota,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const access = await resolveRequestClient(typeof body.clientId === 'string' ? body.clientId : null)
    if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status })

    const price = imagePackPriceId()
    if (!stripeEnabled() || !price) {
      return NextResponse.json(
        { error: 'Card payments are not switched on yet. Write to us and we will add the pack manually.' },
        { status: 503 }
      )
    }

    const stripe = getStripe()!
    const db = adminClient()
    const { data: client } = await db
      .from('clients')
      .select('id, name, owner_email, stripe_customer_id')
      .eq('id', access.clientId)
      .maybeSingle()
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    let customerId = client.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: client.owner_email ?? undefined,
        name: client.name,
        metadata: { mira_client_id: client.id },
      })
      customerId = customer.id
      await db.from('clients').update({ stripe_customer_id: customerId }).eq('id', client.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{ price, quantity: 1 }],
      metadata: {
        mira_client_id: client.id,
        mira_purchase: 'image_pack',
        mira_images: String(IMAGE_PACK_SIZE),
      },
      success_url: `${appUrl()}/tools?pack=1`,
      cancel_url: `${appUrl()}/tools?pack=canceled`,
      billing_address_collection: 'required',
      tax_id_collection: { enabled: true },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('billing/image-pack error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not start the payment' },
      { status: 500 }
    )
  }
}
