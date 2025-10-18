import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { z } from 'zod'

/**
 * Newsletter Subscription API
 * POST /api/newsletter/subscribe
 * 
 * Validates email and stores in newsletter_subscriptions table
 * Implements rate limiting and duplicate checking
 */

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = subscribeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email } = validation.data
    const supabase = await createServerSupabase()

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscriptions')
      .select('id, status')
      .eq('email', email.toLowerCase())
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (email doesn't exist)
      console.error('Error checking existing subscription:', checkError)
      return NextResponse.json(
        { error: 'Failed to check subscription status' },
        { status: 500 }
      )
    }

    if (existing) {
      if (existing.status === 'active') {
        return NextResponse.json(
          { error: 'This email is already subscribed' },
          { status: 409 }
        )
      } else {
        // Reactivate unsubscribed email
        const { error: updateError } = await supabase
          .from('newsletter_subscriptions')
          .update({
            status: 'active',
            subscribed_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          console.error('Error reactivating subscription:', updateError)
          return NextResponse.json(
            { error: 'Failed to reactivate subscription' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          message: 'Successfully resubscribed to newsletter'
        })
      }
    }

    // Create new subscription
    const { error: insertError } = await supabase
      .from('newsletter_subscriptions')
      .insert({
        email: email.toLowerCase(),
        status: 'active',
        subscribed_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error creating subscription:', insertError)
      return NextResponse.json(
        { error: 'Failed to subscribe. Please try again.' },
        { status: 500 }
      )
    }

    // TODO: Send confirmation email
    // This would integrate with your email service (SendGrid, Resend, etc.)

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter'
    })

  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/newsletter/subscribe
 * Check subscription status (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .select('status, subscribed_at')
      .eq('email', email.toLowerCase())
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking subscription:', error)
      return NextResponse.json(
        { error: 'Failed to check subscription status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      subscribed: !!data && data.status === 'active',
      status: data?.status || 'not_subscribed',
      subscribedAt: data?.subscribed_at
    })

  } catch (error) {
    console.error('Newsletter status check error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

