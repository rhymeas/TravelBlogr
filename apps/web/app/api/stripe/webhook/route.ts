/**
 * Stripe Webhook Handler
 *
 * Processes Stripe events, particularly checkout.session.completed
 * to add credits to user accounts after successful payment.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { addCreditsServer } from '@/lib/services/creditService.server'

import { sendPurchaseReceiptEmail } from '@/lib/resend'

// Lazy initialize Stripe to avoid errors during build
let stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    stripe = new Stripe(apiKey)
  }
  return stripe
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('No Stripe signature found')
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        console.log('PaymentIntent succeeded:', event.data.object.id)
        break

      case 'payment_intent.payment_failed':
        console.error('PaymentIntent failed:', event.data.object.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Processing checkout session:', session.id)

    // Extract metadata
    const userId = session.metadata?.userId || session.metadata?.user_id || session.client_reference_id
    const credits = parseInt((session.metadata?.credits as string) || '0')
    const packName = session.metadata?.pack_name || 'Credits'

    if (!userId) {
      console.error('No user_id in session metadata:', session.id)
      return
    }

    if (!credits || credits <= 0) {
      console.error('Invalid credits amount:', credits)
      return
    }

    // Add credits to user account
    const result = await addCreditsServer(
      userId,
      credits,
      'purchase',
      session.payment_intent as string
    )

    if (result.success) {
      console.log(`✅ Added ${credits} credits to user ${userId} (${packName})`)
      // Send receipt email (best-effort)
      const email = session?.customer_details?.email || (session as any)?.customer_email
      if (email) {
        try {
          await sendPurchaseReceiptEmail({ to: email, credits, amountCents: (session.amount_total as number) || credits * 100, sessionId: String(session.id) })
        } catch (e) {
          console.warn('Failed to send receipt email', e)
        }
      }
    } else {
      console.error(`❌ Failed to add credits: ${result.error}`)
    }
  } catch (error) {
    console.error('Error handling checkout completed:', error)
  }
}

// Disable body parsing for webhook
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

