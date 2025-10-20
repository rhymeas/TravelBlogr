'use client'

/**
 * Accommodation CTA - Modern, minimal affiliate links for booking
 * Placed after introduction in blog posts
 */

import { Building2, Home, ArrowRight } from 'lucide-react'
import {
  generateBookingLink,
  generateAirbnbLink,
  generateTravelpayoutsHotelLink,
  trackAffiliateClick,
} from '@/lib/utils/affiliateLinks'

interface AccommodationCTAProps {
  destination: string
  latitude?: number
  longitude?: number
  checkIn?: string
  checkOut?: string
  postId?: string
  className?: string
}

export function AccommodationCTA({
  destination,
  latitude,
  longitude,
  checkIn,
  checkOut,
  postId,
  className = ''
}: AccommodationCTAProps) {
  const bookingUrl = generateBookingLink({
    locationName: destination,
    latitude,
    longitude,
    checkIn,
    checkOut
  })

  const airbnbUrl = generateAirbnbLink({
    locationName: destination,
    latitude,
    longitude
  })

  const travelpayoutsUrl = generateTravelpayoutsHotelLink({
    locationName: destination,
    latitude,
    longitude,
    checkIn,
    checkOut
  })

  const handleClick = async (provider: string, url: string) => {
    await trackAffiliateClick(provider, destination, 'blog_post_accommodation', postId)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`border-l-2 border-gray-200 pl-6 my-8 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-gray-700" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Where to Stay
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Compare prices and find the best accommodation in {destination}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleClick('travelpayouts', travelpayoutsUrl)}
              className="group inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
            >
              Compare All Hotels
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => handleClick('booking', bookingUrl)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <Building2 className="h-3.5 w-3.5" />
              Hotels
            </button>
            <button
              onClick={() => handleClick('airbnb', airbnbUrl)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <Home className="h-3.5 w-3.5" />
              Vacation Rentals
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

