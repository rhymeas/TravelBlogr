/**
 * Smart Affiliate Link Generator
 * Automatically generates contextual affiliate links based on activity type
 */

import { generateTravelpayoutsActivitiesLink, generateTravelpayoutsHotelLink } from './affiliateLinks'

export interface SmartAffiliateLink {
  url: string
  text: string
  provider: 'sleek' | 'booking' | 'getyourguide' | 'viator' | 'coworker' | 'travelpayouts' | 'generic'
  icon?: string
}

/**
 * Generate smart affiliate link based on activity text
 */
export function generateSmartAffiliateLink(
  activity: string,
  location: string
): SmartAffiliateLink | null {
  const activityLower = activity.toLowerCase()
  const locationEncoded = encodeURIComponent(location)

  // 1. ACCOMMODATION - sleek affiliate
  if (
    activityLower.includes('apartment') ||
    activityLower.includes('sleek') ||
    activityLower.includes('rental') ||
    activityLower.includes('flat') ||
    activityLower.includes('accommodation') ||
    activityLower.includes('stay at') ||
    activityLower.includes('check in')
  ) {
    return {
      url: `https://www.sleek.com/s/${locationEncoded}/homes`,
      text: 'Find apartments on sleek',
      provider: 'sleek',
      icon: '🏠'
    }
  }

  // 2. COWORKING - Coworker.com affiliate
  if (
    activityLower.includes('coworking') ||
    activityLower.includes('co-working') ||
    activityLower.includes('workspace') ||
    activityLower.includes('work space') ||
    activityLower.includes('office') ||
    activityLower.includes('desk') ||
    activityLower.includes('wifi') ||
    activityLower.includes('remote work')
  ) {
    return {
      url: `https://www.coworker.com/search/${locationEncoded}`,
      text: 'Find coworking spaces',
      provider: 'coworker',
      icon: '💼'
    }
  }

  // 3. HOTELS - Booking.com via Travelpayouts
  if (
    activityLower.includes('hotel') ||
    activityLower.includes('hostel') ||
    activityLower.includes('resort') ||
    activityLower.includes('lodge') ||
    activityLower.includes('inn') ||
    activityLower.includes('guesthouse')
  ) {
    return {
      url: generateTravelpayoutsHotelLink({ locationName: location }),
      text: 'Book hotels',
      provider: 'travelpayouts',
      icon: '🏨'
    }
  }

  // 4. TOURS & ACTIVITIES - GetYourGuide/Viator via Travelpayouts
  if (
    activityLower.includes('tour') ||
    activityLower.includes('visit') ||
    activityLower.includes('explore') ||
    activityLower.includes('museum') ||
    activityLower.includes('gallery') ||
    activityLower.includes('attraction') ||
    activityLower.includes('ticket') ||
    activityLower.includes('entrance') ||
    activityLower.includes('guided') ||
    activityLower.includes('excursion') ||
    activityLower.includes('sightseeing')
  ) {
    return {
      url: generateTravelpayoutsActivitiesLink(location),
      text: 'Book tours & activities',
      provider: 'travelpayouts',
      icon: '🎫'
    }
  }

  // 5. FOOD & DINING - Generic (no affiliate yet)
  if (
    activityLower.includes('restaurant') ||
    activityLower.includes('cafe') ||
    activityLower.includes('coffee') ||
    activityLower.includes('dinner') ||
    activityLower.includes('lunch') ||
    activityLower.includes('breakfast') ||
    activityLower.includes('eat') ||
    activityLower.includes('food') ||
    activityLower.includes('dining')
  ) {
    // Could integrate OpenTable or similar in future
    return null
  }

  // 6. TRANSPORTATION - Generic (no affiliate yet)
  if (
    activityLower.includes('train') ||
    activityLower.includes('bus') ||
    activityLower.includes('metro') ||
    activityLower.includes('subway') ||
    activityLower.includes('taxi') ||
    activityLower.includes('uber') ||
    activityLower.includes('transport')
  ) {
    // Could integrate Omio or similar in future
    return null
  }

  // 7. OUTDOOR ACTIVITIES - Generic activities link
  if (
    activityLower.includes('hike') ||
    activityLower.includes('hiking') ||
    activityLower.includes('trek') ||
    activityLower.includes('trekking') ||
    activityLower.includes('climb') ||
    activityLower.includes('climbing') ||
    activityLower.includes('kayak') ||
    activityLower.includes('surf') ||
    activityLower.includes('dive') ||
    activityLower.includes('snorkel') ||
    activityLower.includes('bike') ||
    activityLower.includes('cycling')
  ) {
    return {
      url: generateTravelpayoutsActivitiesLink(location),
      text: 'Book outdoor activities',
      provider: 'travelpayouts',
      icon: '🏔️'
    }
  }

  // Default: No specific affiliate link
  return null
}

/**
 * Generate multiple smart links for a list of activities
 */
export function generateSmartLinksForActivities(
  activities: string[],
  location: string
): SmartAffiliateLink[] {
  const links: SmartAffiliateLink[] = []
  const seenProviders = new Set<string>()

  for (const activity of activities) {
    const link = generateSmartAffiliateLink(activity, location)
    
    // Only add unique provider links (avoid duplicates)
    if (link && !seenProviders.has(link.provider)) {
      links.push(link)
      seenProviders.add(link.provider)
    }
  }

  return links
}

/**
 * Check if activity has a smart affiliate link
 */
export function hasSmartAffiliateLink(activity: string, location: string): boolean {
  return generateSmartAffiliateLink(activity, location) !== null
}

