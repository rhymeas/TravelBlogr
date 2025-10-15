'use client'

/**
 * Quick Booking Links Component
 *
 * Displays affiliate booking links for hotels, stays, activities, and tours.
 * Uses existing UI components and design system.
 */

import { ExternalLink, Hotel, Home, Compass, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  generateBookingLink,
  generateAirbnbLink,
  generateGetYourGuideLink,
  generateViatorLink,
  trackAffiliateClick,
} from '@/lib/utils/affiliateLinks'

interface QuickBookingLinksProps {
  locationName: string
  latitude?: number
  longitude?: number
  className?: string
  context?: string // For analytics tracking
}

export function QuickBookingLinks({
  locationName,
  latitude,
  longitude,
  className = '',
  context = 'location_page',
}: QuickBookingLinksProps) {
  const bookingUrl = generateBookingLink({ locationName, latitude, longitude })
  const airbnbUrl = generateAirbnbLink({ locationName, latitude, longitude })
  const activitiesUrl = generateGetYourGuideLink(locationName)
  const toursUrl = generateViatorLink(locationName)

  const handleClick = (provider: string, url: string) => {
    trackAffiliateClick(provider, locationName, context)
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-4 w-4 text-rausch-500" />
        <h3 className="text-sm font-semibold text-airbnb-black">Book Your Trip</h3>
      </div>

      {/* Booking Links Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Hotels - Booking.com */}
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('booking.com', bookingUrl)}
          className="group"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 hover:border-blue-500 hover:bg-blue-50"
          >
            <Hotel className="h-4 w-4 text-blue-600" />
            <span className="flex-1 text-left">Hotels</span>
            <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-blue-500" />
          </Button>
        </a>

        {/* Stays - Airbnb */}
        <a
          href={airbnbUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('airbnb', airbnbUrl)}
          className="group"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 hover:border-rausch-500 hover:bg-rausch-50"
          >
            <Home className="h-4 w-4 text-rausch-600" />
            <span className="flex-1 text-left">Stays</span>
            <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-rausch-500" />
          </Button>
        </a>

        {/* Activities - GetYourGuide */}
        <a
          href={activitiesUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('getyourguide', activitiesUrl)}
          className="group"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 hover:border-green-500 hover:bg-green-50"
          >
            <Compass className="h-4 w-4 text-green-600" />
            <span className="flex-1 text-left">Activities</span>
            <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-green-500" />
          </Button>
        </a>

        {/* Tours - Viator */}
        <a
          href={toursUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('viator', toursUrl)}
          className="group"
        >
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 hover:border-purple-500 hover:bg-purple-50"
          >
            <Compass className="h-4 w-4 text-purple-600" />
            <span className="flex-1 text-left">Tours</span>
            <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-purple-500" />
          </Button>
        </a>
      </div>

      {/* Disclosure - Required by FTC */}
      <p className="text-xs text-muted-foreground italic leading-relaxed">
        We may earn a small commission from bookings made through these links at no extra cost to you. This helps us keep TravelBlogr free!
      </p>
    </div>
  )
}

