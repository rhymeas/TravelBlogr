'use client'

/**
 * Quick Book Buttons Component
 * 
 * Compact affiliate booking buttons for day itineraries
 */

import { Hotel, Compass, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  generateBookingLink,
  generateGetYourGuideLink,
  trackAffiliateClick,
} from '@/lib/utils/affiliateLinks'

interface QuickBookButtonsProps {
  destination: string
  dayNumber: number
  className?: string
}

export function QuickBookButtons({
  destination,
  dayNumber,
  className = '',
}: QuickBookButtonsProps) {
  const bookingUrl = generateBookingLink({ locationName: destination })
  const activitiesUrl = generateGetYourGuideLink(destination)

  const handleClick = (provider: string, url: string) => {
    trackAffiliateClick(provider, destination, `day_${dayNumber}_quick_book`)
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Book Hotels */}
      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => handleClick('booking.com', bookingUrl)}
        className="flex-1 min-w-[140px]"
      >
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 text-xs"
        >
          <Hotel className="h-3.5 w-3.5 text-blue-600" />
          <span>Book Hotels</span>
          <ExternalLink className="h-3 w-3 text-gray-400" />
        </Button>
      </a>

      {/* Book Activities */}
      <a
        href={activitiesUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={() => handleClick('getyourguide', activitiesUrl)}
        className="flex-1 min-w-[140px]"
      >
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2 hover:border-green-500 hover:bg-green-50 text-xs"
        >
          <Compass className="h-3.5 w-3.5 text-green-600" />
          <span>Book Tours</span>
          <ExternalLink className="h-3 w-3 text-gray-400" />
        </Button>
      </a>
    </div>
  )
}

