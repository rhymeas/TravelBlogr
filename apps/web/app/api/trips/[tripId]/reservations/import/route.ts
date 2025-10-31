import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schema
const importReservationSchema = z.object({
  text: z.string().min(10, 'Reservation text must be at least 10 characters'),
  source: z.enum(['paste', 'email', 'file']).default('paste'),
})

/**
 * POST /api/trips/:tripId/reservations/import
 * Import reservations from pasted text, email, or file upload
 * 
 * Body: { text: string, source?: 'paste' | 'email' | 'file' }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate trip ownership
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', params.tripId)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    if (trip.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = importReservationSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { text, source } = validation.data

    // Parse reservations from text
    const reservations = parseReservations(text, params.tripId, user.id, source)

    if (reservations.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No reservations found in the provided text. Please check the format and try again.',
          parsed: 0
        },
        { status: 400 }
      )
    }

    // Insert reservations into database
    const { data: inserted, error: insertError } = await supabase
      .from('reservations')
      .insert(reservations)
      .select()

    if (insertError) {
      console.error('Error inserting reservations:', insertError)
      return NextResponse.json(
        { error: 'Failed to save reservations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      parsed: reservations.length,
      saved: inserted?.length || 0,
      reservations: inserted,
    })
  } catch (error) {
    console.error('Error importing reservations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Parse reservations from text
 * Supports common booking confirmation formats:
 * - Booking.com
 * - Airbnb
 * - Airlines (confirmation numbers)
 * - Hotels
 * - Car rentals
 */
function parseReservations(
  text: string,
  tripId: string,
  userId: string,
  source: string
): Array<{
  trip_id: string
  user_id: string
  provider: string | null
  type: string
  name: string
  start_time: string | null
  end_time: string | null
  location: string | null
  address: string | null
  confirmation_number: string | null
  price: number | null
  currency: string
  details: object
  raw_email_text: string
}> {
  const reservations: any[] = []
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  // Detect provider
  const provider = detectProvider(text)

  // Parse based on provider
  if (provider === 'booking.com') {
    const parsed = parseBookingCom(text, lines)
    if (parsed) reservations.push(parsed)
  } else if (provider === 'airbnb') {
    const parsed = parseAirbnb(text, lines)
    if (parsed) reservations.push(parsed)
  } else if (provider === 'airline') {
    const parsed = parseAirline(text, lines)
    if (parsed) reservations.push(parsed)
  } else {
    // Generic parser - try to extract key information
    const parsed = parseGeneric(text, lines)
    if (parsed) reservations.push(parsed)
  }

  // Add common fields to all reservations
  return reservations.map(r => ({
    ...r,
    trip_id: tripId,
    user_id: userId,
    raw_email_text: text,
    details: r.details || {},
    currency: r.currency || 'USD',
  }))
}

/**
 * Detect booking provider from text
 */
function detectProvider(text: string): string {
  const lower = text.toLowerCase()
  
  if (lower.includes('booking.com') || lower.includes('booking confirmation')) {
    return 'booking.com'
  }
  if (lower.includes('airbnb')) {
    return 'airbnb'
  }
  if (lower.includes('confirmation code') && (lower.includes('flight') || lower.includes('airline'))) {
    return 'airline'
  }
  if (lower.includes('expedia')) {
    return 'expedia'
  }
  if (lower.includes('hotels.com')) {
    return 'hotels.com'
  }
  
  return 'unknown'
}

/**
 * Parse Booking.com confirmation
 */
function parseBookingCom(text: string, lines: string[]) {
  const confirmationMatch = text.match(/(?:confirmation|booking)\s*(?:number|code|#)?\s*:?\s*([A-Z0-9]{6,})/i)
  const hotelMatch = text.match(/(?:hotel|property)\s*:?\s*(.+?)(?:\n|$)/i)
  const checkInMatch = text.match(/check-?in\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
  const checkOutMatch = text.match(/check-?out\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
  const priceMatch = text.match(/(?:total|price)\s*:?\s*\$?([0-9,]+\.?\d{0,2})/i)

  return {
    provider: 'booking.com',
    type: 'accommodation',
    name: hotelMatch?.[1]?.trim() || 'Hotel Reservation',
    start_time: checkInMatch ? parseDate(checkInMatch[1]) : null,
    end_time: checkOutMatch ? parseDate(checkOutMatch[1]) : null,
    location: null,
    address: null,
    confirmation_number: confirmationMatch?.[1] || null,
    price: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null,
  }
}

/**
 * Parse Airbnb confirmation
 */
function parseAirbnb(text: string, lines: string[]) {
  const confirmationMatch = text.match(/confirmation\s*code\s*:?\s*([A-Z0-9]+)/i)
  const propertyMatch = text.match(/(?:staying at|property)\s*:?\s*(.+?)(?:\n|$)/i)
  const checkInMatch = text.match(/check-?in\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
  const checkOutMatch = text.match(/check-?out\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
  const priceMatch = text.match(/(?:total|price)\s*:?\s*\$?([0-9,]+\.?\d{0,2})/i)

  return {
    provider: 'airbnb',
    type: 'accommodation',
    name: propertyMatch?.[1]?.trim() || 'Airbnb Reservation',
    start_time: checkInMatch ? parseDate(checkInMatch[1]) : null,
    end_time: checkOutMatch ? parseDate(checkOutMatch[1]) : null,
    location: null,
    address: null,
    confirmation_number: confirmationMatch?.[1] || null,
    price: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null,
  }
}

/**
 * Parse airline confirmation
 */
function parseAirline(text: string, lines: string[]) {
  const confirmationMatch = text.match(/(?:confirmation|booking|record locator)\s*(?:code|number)?\s*:?\s*([A-Z0-9]{5,6})/i)
  const flightMatch = text.match(/flight\s*(?:number)?\s*:?\s*([A-Z]{2}\d{1,4})/i)
  const dateMatch = text.match(/(?:departure|date)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
  const routeMatch = text.match(/([A-Z]{3})\s*(?:to|→|-)\s*([A-Z]{3})/i)

  return {
    provider: 'airline',
    type: 'flight',
    name: flightMatch?.[1] || 'Flight',
    start_time: dateMatch ? parseDate(dateMatch[1]) : null,
    end_time: null,
    location: routeMatch ? `${routeMatch[1]} → ${routeMatch[2]}` : null,
    address: null,
    confirmation_number: confirmationMatch?.[1] || null,
    price: null,
  }
}

/**
 * Generic parser for unknown formats
 */
function parseGeneric(text: string, lines: string[]) {
  const confirmationMatch = text.match(/(?:confirmation|booking|reservation)\s*(?:number|code|#)?\s*:?\s*([A-Z0-9]{5,})/i)
  const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)

  return {
    provider: null,
    type: 'activity',
    name: lines[0]?.substring(0, 100) || 'Reservation',
    start_time: dateMatch ? parseDate(dateMatch[1]) : null,
    end_time: null,
    location: null,
    address: null,
    confirmation_number: confirmationMatch?.[1] || null,
    price: null,
  }
}

/**
 * Parse date string to ISO format
 */
function parseDate(dateStr: string): string | null {
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return null
    return date.toISOString()
  } catch {
    return null
  }
}

