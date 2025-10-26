import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PRICE_PER_CREDIT_CENTS = Number(process.env.PRICE_PER_CREDIT_CENTS || 100) // $1 per credit by default

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { credits = 0, success_url, cancel_url }: { credits: number, success_url?: string, cancel_url?: string } = await req.json()
    if (!credits || credits <= 0 || !Number.isFinite(credits)) {
      return NextResponse.json({ error: 'Invalid credits amount' }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const successUrl = success_url || `${siteUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = cancel_url || `${siteUrl}/pricing?canceled=1`

    const amountCents = credits * PRICE_PER_CREDIT_CENTS

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email || undefined,
      line_items: [
        {
          price_data: {
            currency: process.env.STRIPE_CURRENCY || 'usd',
            product_data: {
              name: `TravelBlogr Credits (${credits})`,
              description: 'Credits for AI itinerary generations',
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
        credits: String(credits),
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('create-checkout error', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

