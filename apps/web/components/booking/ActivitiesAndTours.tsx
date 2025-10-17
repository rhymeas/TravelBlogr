'use client'

/**
 * Activities and Tours Component
 * 
 * Displays activity/tour booking options with affiliate links
 */

import { Compass, MapPin, ExternalLink, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import {
  generateGetYourGuideLink,
  generateViatorLink,
  trackAffiliateClick,
} from '@/lib/utils/affiliateLinks'

interface ActivitiesAndToursProps {
  destination: string
  className?: string
}

export function ActivitiesAndTours({
  destination,
  className = '',
}: ActivitiesAndToursProps) {
  const getYourGuideUrl = generateGetYourGuideLink(destination)
  const viatorUrl = generateViatorLink(destination)

  const handleClick = (provider: string, url: string) => {
    trackAffiliateClick(provider, destination, 'trip_template_activities')
  }

  return (
    <Card className={`p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Compass className="h-4 w-4 text-rausch-500" />
        <h3 className="text-sm font-semibold text-gray-900">Activities & Tours</h3>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 mb-4">
        Book skip-the-line tickets and guided tours in {destination}
      </p>

      {/* Booking Options */}
      <div className="space-y-2">
        {/* GetYourGuide */}
        <a
          href={getYourGuideUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('getyourguide', getYourGuideUrl)}
          className="group block"
        >
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Compass className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Tours & Experiences</p>
                <p className="text-xs text-gray-600">GetYourGuide</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-green-500" />
          </div>
        </a>

        {/* Viator */}
        <a
          href={viatorUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('viator', viatorUrl)}
          className="group block"
        >
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Activities & Attractions</p>
                <p className="text-xs text-gray-600">Viator</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-purple-500" />
          </div>
        </a>
      </div>

      {/* Pro Tip */}
      <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-purple-900 mb-1">Pro Tip</p>
            <p className="text-xs text-purple-800">
              Book popular attractions in advance to skip long queues. Many tours offer free cancellation up to 24 hours before.
            </p>
          </div>
        </div>
      </div>

      {/* Disclosure */}
      <p className="text-xs text-gray-500 italic mt-3 leading-relaxed">
        We earn a commission from bookings at no extra cost to you.
      </p>
    </Card>
  )
}

