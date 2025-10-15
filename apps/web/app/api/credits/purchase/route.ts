/**
 * Credit Purchase API - Stripe Checkout
 * 
 * Creates a Stripe checkout session for purchasing credit packs.
 * After successful payment, webhook will add credits to user account.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import Stripe from 'stripe'

// Lazy initialize Stripe to avoid errors during build
let stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    stripe = new Stripe(apiKey, {
      apiVersion: '2025-09-30.clover',
    })
  }
  return stripe
}

// Credit pack configurations
const CREDIT_PACKS = {
  '10': {
    credits: 10,
    price: 15, // $15
    priceId: process.env.STRIPE_CREDITS_10_PRICE_ID!,
    name: 'Starter Pack',
    description: '10 AI itinerary generations',
  },
  '25': {
    credits: 25,
    price: 30, // $30 (save $7.50)
    priceId: process.env.STRIPE_CREDITS_25_PRICE_ID!,
    name: 'Explorer Pack',
    description: '25 AI itinerary generations',
    popular: true,
  },
  '50': {
    credits: 50,
    price: 50, // $50 (save $25)
    priceId: process.env.STRIPE_CREDITS_50_PRICE_ID!,
    name: 'Adventurer Pack',
    description: '50 AI itinerary generations',
    bestValue: true,
  },
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { packSize } = body

    // Validate pack size
    if (!packSize || !CREDIT_PACKS[packSize as keyof typeof CREDIT_PACKS]) {
      return NextResponse.json(
        { error: 'Invalid pack size. Choose 10, 25, or 50.' },
        { status: 400 }
      )
    }

    const pack = CREDIT_PACKS[packSize as keyof typeof CREDIT_PACKS]

    // Verify price ID is configured
    if (!pack.priceId || pack.priceId.includes('your_')) {
      return NextResponse.json(
        { error: 'Stripe price ID not configured. Please contact support.' },
        { status: 500 }
      )
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Create Stripe checkout session
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: pack.priceId,
          quantity: 1,
        },
      ],
      customer_email: user.email || profile?.email,
      client_reference_id: user.id, // Link to our user
      metadata: {
        user_id: user.id,
        credits: pack.credits.toString(),
        pack_size: packSize,
        pack_name: pack.name,
      },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?credits_purchased=true&amount=${pack.credits}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?credits_cancelled=true`,
      allow_promotion_codes: true, // Allow discount codes
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to retrieve credit pack information
 */
export async function GET() {
  return NextResponse.json({
    packs: CREDIT_PACKS,
    freeTierLimit: 5,
  })
}

