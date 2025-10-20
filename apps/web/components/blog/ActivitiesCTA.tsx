'use client'

/**
 * Activities CTA - Modern, minimal affiliate links for tours and activities
 * Placed after Day 3 in blog posts
 */

import { Compass, Ticket, ArrowRight } from 'lucide-react'
import {
  generateGetYourGuideLink,
  generateViatorLink,
  generateTravelpayoutsActivitiesLink,
  trackAffiliateClick,
} from '@/lib/utils/affiliateLinks'

interface ActivitiesCTAProps {
  destination: string
  postId?: string
  className?: string
}

export function ActivitiesCTA({
  destination,
  postId,
  className = ''
}: ActivitiesCTAProps) {
  const getYourGuideUrl = generateGetYourGuideLink(destination)
  const viatorUrl = generateViatorLink(destination)
  const travelpayoutsUrl = generateTravelpayoutsActivitiesLink(destination)

  const handleClick = async (provider: string, url: string) => {
    await trackAffiliateClick(provider, destination, 'blog_post_activities', postId)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className={`border-l-2 border-gray-200 pl-6 my-8 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <Compass className="h-5 w-5 text-gray-700" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Things to Do
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Book tours, activities, and skip-the-line tickets in {destination}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleClick('travelpayouts', travelpayoutsUrl)}
              className="group inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all"
            >
              Compare All Activities
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => handleClick('getyourguide', getYourGuideUrl)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <Ticket className="h-3.5 w-3.5" />
              Tours
            </button>
            <button
              onClick={() => handleClick('viator', viatorUrl)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <Compass className="h-3.5 w-3.5" />
              Experiences
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

