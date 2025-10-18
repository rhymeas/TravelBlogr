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
 * Generate Airbnb affiliate link
 * Commission: 3% (but high booking values)
 */
export function generateAirbnbLink(params: AffiliateParams): string {
  const affiliateId = process.env.NEXT_PUBLIC_AIRBNB_AFFILIATE_ID || ''
  
  const baseUrl = 'https://www.airbnb.com/s'
  
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
 * Get all affiliate links for a location
 * Convenience function to generate all links at once
 */
export function getAllAffiliateLinks(params: AffiliateParams) {
  return {
    booking: generateBookingLink(params),
    airbnb: generateAirbnbLink(params),
    activities: generateGetYourGuideLink(params.locationName),
    tours: generateViatorLink(params.locationName),
  }
}

