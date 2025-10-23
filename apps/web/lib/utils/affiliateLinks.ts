/**
 * Affiliate Link Generation Utilities
 * 
 * Generates affiliate links for booking platforms with proper tracking parameters.
 * All links include affiliate IDs to earn commission on bookings.
 */

export interface AffiliateParams {
  locationName: string
  latitude?: number
  longitude?: number
  checkIn?: string
  checkOut?: string
}

// Track if we've already warned about missing affiliate IDs (only warn once)
let hasWarnedBooking = false
let hasWarnedGetYourGuide = false
let hasWarnedViator = false
let hasWarnedTravelpayouts = false

/**
 * Generate Booking.com affiliate link
 * Commission: 25-40% on hotel bookings
 */
export function generateBookingLink(params: AffiliateParams): string {
  const affiliateId = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID || ''

  // If no affiliate ID, warn once in development only
  if (!affiliateId && !hasWarnedBooking && process.env.NODE_ENV === 'development') {
    console.warn('NEXT_PUBLIC_BOOKING_AFFILIATE_ID not set - no commission will be earned')
    hasWarnedBooking = true
  }

  const baseUrl = 'https://www.booking.com/searchresults.html'
  
  const urlParams = new URLSearchParams({
    aid: affiliateId,
    label: 'travelblogr',
    ss: params.locationName,
    ...(params.latitude && { latitude: params.latitude.toString() }),
    ...(params.longitude && { longitude: params.longitude.toString() }),
    ...(params.checkIn && { checkin: params.checkIn }),
    ...(params.checkOut && { checkout: params.checkOut }),
  })
  
  return `${baseUrl}?${urlParams.toString()}`
}

/**
 * Generate sleek affiliate link
 * Commission: 3% (but high booking values)
 */
export function generatesleekLink(params: AffiliateParams): string {
  const affiliateId = process.env.NEXT_PUBLIC_sleek_AFFILIATE_ID || ''
  
  const baseUrl = 'https://www.sleek.com/s'
  
  const urlParams = new URLSearchParams({
    query: params.locationName,
    ...(params.latitude && {
      ne_lat: (params.latitude + 0.1).toString(),
      sw_lat: (params.latitude - 0.1).toString(),
    }),
    ...(params.longitude && {
      ne_lng: (params.longitude + 0.1).toString(),
      sw_lng: (params.longitude - 0.1).toString(),
    }),
    ...(affiliateId && { affiliate_id: affiliateId }),
  })
  
  return `${baseUrl}?${urlParams.toString()}`
}

/**
 * Generate GetYourGuide affiliate link
 * Commission: 8-12% on activities and tours
 */
export function generateGetYourGuideLink(locationName: string): string {
  const partnerId = process.env.NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID || ''

  if (!partnerId && !hasWarnedGetYourGuide && process.env.NODE_ENV === 'development') {
    console.warn('NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID not set - no commission will be earned')
    hasWarnedGetYourGuide = true
  }

  const baseUrl = 'https://www.getyourguide.com/s'
  
  const urlParams = new URLSearchParams({
    q: locationName,
    ...(partnerId && { partner_id: partnerId }),
    utm_source: 'travelblogr',
    utm_medium: 'affiliate',
  })
  
  return `${baseUrl}?${urlParams.toString()}`
}

/**
 * Generate Viator affiliate link
 * Commission: 8-10% on tours and activities
 */
export function generateViatorLink(locationName: string): string {
  const partnerId = process.env.NEXT_PUBLIC_VIATOR_PARTNER_ID || ''

  if (!partnerId && !hasWarnedViator && process.env.NODE_ENV === 'development') {
    console.warn('NEXT_PUBLIC_VIATOR_PARTNER_ID not set - no commission will be earned')
    hasWarnedViator = true
  }

  const baseUrl = 'https://www.viator.com/searchResults/all'
  
  const urlParams = new URLSearchParams({
    text: locationName,
    ...(partnerId && { pid: partnerId }),
  })
  
  return `${baseUrl}?${urlParams.toString()}`
}

/**
 * Track affiliate click (Google Analytics + Database)
 * This sends an event to GA4 and saves to database for revenue tracking
 */
export async function trackAffiliateClick(
  provider: string,
  locationName: string,
  context?: string,
  postId?: string,
  tripId?: string
): Promise<void> {
  // Google Analytics 4 event
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'affiliate_click', {
      provider,
      location: locationName,
      context: context || 'unknown',
      timestamp: new Date().toISOString(),
    })
  }

  // Save to database for revenue tracking
  if (typeof window !== 'undefined') {
    try {
      // Get session ID
      let sessionId = localStorage.getItem('visitor_session_id')
      if (!sessionId) {
        sessionId = crypto.randomUUID()
        localStorage.setItem('visitor_session_id', sessionId)
      }

      // Track click in database
      await fetch('/api/affiliate/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          locationName,
          context: context || 'unknown',
          postId,
          tripId,
          referrer: document.referrer || null,
          userAgent: navigator.userAgent,
          sessionId
        })
      })
    } catch (error) {
      console.error('Failed to track affiliate click:', error)
    }
  }

  // Console log for debugging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Affiliate Click] ${provider} - ${locationName} (${context})`)
  }
}

/**
 * Generate Travelpayouts hotel search link
 * Travelpayouts is a FREE affiliate aggregator with access to 100+ travel brands
 * Commission: 25-40% on hotels (via Booking.com, Agoda, Hotels.com)
 */
export function generateTravelpayoutsHotelLink(params: AffiliateParams): string {
  const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || ''

  if (!marker && !hasWarnedTravelpayouts && process.env.NODE_ENV === 'development') {
    console.warn('NEXT_PUBLIC_TRAVELPAYOUTS_MARKER not set - no commission will be earned')
    hasWarnedTravelpayouts = true
  }

  // Travelpayouts hotel search widget
  const baseUrl = 'https://search.hotellook.com'

  const urlParams = new URLSearchParams({
    marker: marker || 'travelblogr',
    locale: 'en',
    currency: 'USD',
    destination: params.locationName,
    ...(params.checkIn && { checkIn: params.checkIn }),
    ...(params.checkOut && { checkOut: params.checkOut }),
  })

  return `${baseUrl}?${urlParams.toString()}`
}

/**
 * Generate Travelpayouts activities/tours link
 * Commission: 8-12% on tours and activities (via GetYourGuide, Viator)
 */
export function generateTravelpayoutsActivitiesLink(locationName: string): string {
  const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || ''

  // Travelpayouts GetYourGuide integration
  const baseUrl = 'https://www.getyourguide.com/s'

  const urlParams = new URLSearchParams({
    q: locationName,
    partner_id: marker || 'travelblogr',
    utm_source: 'travelblogr',
    utm_medium: 'affiliate',
    utm_campaign: 'travelpayouts',
  })

  return `${baseUrl}?${urlParams.toString()}`
}

/**
 * Generate Travelpayouts flight search link
 * Commission: Up to 70% on flight bookings (via Aviasales, Kiwi.com)
 */
export function generateTravelpayoutsFlightLink(
  origin: string,
  destination: string,
  departDate?: string,
  returnDate?: string
): string {
  const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || ''

  // Travelpayouts Aviasales integration
  const baseUrl = 'https://www.aviasales.com/search'

  const urlParams = new URLSearchParams({
    origin_iata: origin,
    destination_iata: destination,
    marker: marker || 'travelblogr',
    ...(departDate && { depart_date: departDate }),
    ...(returnDate && { return_date: returnDate }),
  })

  return `${baseUrl}?${urlParams.toString()}`
}

/**
 * Generate Travelpayouts car rental link
 * Commission: Up to 70% on car rentals (via Rentalcars.com, Discover Cars)
 */
export function generateTravelpayoutsCarRentalLink(
  locationName: string,
  pickupDate?: string,
  dropoffDate?: string
): string {
  const marker = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER || ''

  // Travelpayouts Rentalcars integration
  const baseUrl = 'https://www.rentalcars.com/SearchResults.do'

  const urlParams = new URLSearchParams({
    city: locationName,
    affiliateCode: marker || 'travelblogr',
    ...(pickupDate && { pickUpDate: pickupDate }),
    ...(dropoffDate && { dropOffDate: dropoffDate }),
  })

  return `${baseUrl}?${urlParams.toString()}`
}

/**
 * Get all affiliate links for a location
 * Convenience function to generate all links at once
 */
export function getAllAffiliateLinks(params: AffiliateParams) {
  return {
    // Direct providers
    booking: generateBookingLink(params),
    sleek: generatesleekLink(params),
    travelpayoutsHotel: generateTravelpayoutsHotelLink(params),
    activities: generateGetYourGuideLink(params.locationName),
    tours: generateViatorLink(params.locationName),

    // Travelpayouts aggregator (recommended - easier setup)
    travelpayoutsHotels: generateTravelpayoutsHotelLink(params),
    travelpayoutsActivities: generateTravelpayoutsActivitiesLink(params.locationName),
  }
}

