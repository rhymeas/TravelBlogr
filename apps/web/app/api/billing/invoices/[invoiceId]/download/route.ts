/**
 * Invoice Download API
 * 
 * GET /api/billing/invoices/[invoiceId]/download - Download invoice PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { invoiceId } = params

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 })
    }

    const stripe = getStripe()

    // Get invoice from Stripe
    const invoice = await stripe.invoices.retrieve(invoiceId)

    // Verify this invoice belongs to the user
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const email = user.email || profile?.email

    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    // Get customer to verify ownership
    const customer = await stripe.customers.retrieve(invoice.customer as string)
    
    if ('deleted' in customer || customer.email !== email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get PDF URL
    const pdfUrl = invoice.invoice_pdf

    if (!pdfUrl) {
      return NextResponse.json({ error: 'PDF not available' }, { status: 404 })
    }

    // Fetch PDF from Stripe
    const pdfResponse = await fetch(pdfUrl)
    
    if (!pdfResponse.ok) {
      throw new Error('Failed to fetch PDF from Stripe')
    }

    const pdfBuffer = await pdfResponse.arrayBuffer()

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.number}.pdf"`
      }
    })

  } catch (error: any) {
    console.error('Error downloading invoice:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to download invoice' },
      { status: 500 }
    )
  }
}

