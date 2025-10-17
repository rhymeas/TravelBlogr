'use client'

import { Ticket, Compass, ExternalLink, Star } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import {
  generateGetYourGuideLink,
  generateViatorLink,
  trackAffiliateClick,
} from '@/lib/utils/affiliateLinks'

interface ActivitiesAndToursProps {
  destination: string
}

export function ActivitiesAndTours({ destination }: ActivitiesAndToursProps) {
  const getYourGuideUrl = generateGetYourGuideLink(destination)
  const viatorUrl = generateViatorLink(destination)

  const handleClick = (provider: string, url: string) => {
    trackAffiliateClick(provider, destination, 'trip_template_activities')
  }

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Ticket className="h-4 w-4 text-rausch-500" />
        <h4 className="font-semibold text-gray-900 text-sm">🎫 Things to Do</h4>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-600 mb-4">
        Discover amazing tours and experiences in {destination}
      </p>

      {/* Activity Options */}
      <div className="space-y-2">
        {/* GetYourGuide */}
        <a
          href={getYourGuideUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => handleClick('getyourguide', getYourGuideUrl)}
          className="group block"
        >
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Compass className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Tours & Activities</p>
                <p className="text-xs text-gray-600">GetYourGuide</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-purple-500" />
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
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Star className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Experiences</p>
                <p className="text-xs text-gray-600">Viator</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-teal-500" />
          </div>
        </a>
      </div>

      {/* Tip */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Ticket className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-900 mb-1">Pro Tip</p>
            <p className="text-xs text-blue-800">
              Book popular activities in advance to secure your spot!
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

