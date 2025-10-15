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

/**
 * Generate Booking.com affiliate link
 * Commission: 25-40% on hotel bookings
 */
export function generateBookingLink(params: AffiliateParams): string {
  const affiliateId = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID || ''
  
  // If no affiliate ID, return direct link (no commission)
  if (!affiliateId) {
    console.warn('NEXT_PUBLIC_BOOKING_AFFILIATE_ID not set - no commission will be earned')
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
  
  if (!partnerId) {
    console.warn('NEXT_PUBLIC_GETYOURGUIDE_PARTNER_ID not set - no commission will be earned')
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
  
  if (!partnerId) {
    console.warn('NEXT_PUBLIC_VIATOR_PARTNER_ID not set - no commission will be earned')
  }

  const baseUrl = 'https://www.viator.com/searchResults/all'
  
  const urlParams = new URLSearchParams({
    text: locationName,
    ...(partnerId && { pid: partnerId }),
  })
  
  return `${baseUrl}?${urlParams.toString()}`
}

/**
 * Track affiliate click (Google Analytics)
 * This sends an event to GA4 for tracking affiliate link clicks
 */
export function trackAffiliateClick(
  provider: string,
  locationName: string,
  context?: string
): void {
  // Google Analytics 4 event
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'affiliate_click', {
      provider,
      location: locationName,
      context: context || 'unknown',
      timestamp: new Date().toISOString(),
    })
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

