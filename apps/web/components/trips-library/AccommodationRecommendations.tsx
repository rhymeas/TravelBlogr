'use client'

import { Hotel, Home, ExternalLink, DollarSign } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import {
  generateBookingLink,
  generatesleekLink,
  trackAffiliateClick,
} from '@/lib/utils/affiliateLinks'

interface AccommodationRecommendationsProps {
  destination: string
  latitude?: number
  longitude?: number
  checkIn?: string
  checkOut?: string
}

export function AccommodationRecommendations({
  destination,
  latitude,
  longitude,
  checkIn,
  checkOut,
}: AccommodationRecommendationsProps) {
  const bookingUrl = generateBookingLink({
    locationName: destination,
    latitude,
    longitude,
    checkIn,
    checkOut,
  })

  const sleekUrl = generatesleekLink({
    locationName: destination,
    latitude,
    longitude,
  })

  const handleClick = (provider: string, url: string) => {
    trackAffiliateClick(provider, destination, 'trip_template_accommodation')
  }

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Hotel className="h-4 w-4 text-rausch-500" />
        <h4 className="font-semibold text-gray-900 text-sm">🏨 Where to Stay</h4>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 mb-4">
        Find the perfect accommodation in {destination}
      </p>

      {/* Booking Options */}
      <div className="space-y-2">
        {/* Hotels - Booking.com */}
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('booking.com', bookingUrl)}
          className="group block"
        >
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Hotel className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Hotels & Resorts</p>
                <p className="text-xs text-gray-600">Booking.com</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
          </div>
        </a>

        {/* Vacation Rentals - sleek */}
        <a
          href={sleekUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('sleek', sleekUrl)}
          className="group block"
        >
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-rausch-500 hover:bg-rausch-50 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rausch-100 rounded-lg">
                <Home className="h-4 w-4 text-rausch-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Vacation Rentals</p>
                <p className="text-xs text-gray-600">sleek</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-rausch-500" />
          </div>
        </a>
      </div>

      {/* Budget Tips */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <DollarSign className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-yellow-900 mb-1">Budget Tip</p>
            <p className="text-xs text-yellow-800">
              Book 2-3 months in advance for best rates.
            </p>
          </div>
        </div>
      </div>

      {/* Disclosure */}
      <p className="text-xs text-gray-500 italic mt-3 leading-relaxed">
         
      </p>
    </Card>
  )
}

