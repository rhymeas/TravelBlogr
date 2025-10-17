'use client'

import { useState, useRef, useEffect } from 'react'
import { List, MapPin, Heart } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { TripTimelineWithToggle } from './TripTimelineWithToggle'

interface GuideDay {
  id: string
  day_number: number
  title: string
  description: string
  activities: string[]
  tips: string | null
}

interface TripPageClientProps {
  guideDays: GuideDay[]
  guideTitle: string
  guideId: string
  destination: string
  tripType: string
  durationDays: number
  highlights: string[]
  description: string
}

export function TripPageClient({
  guideDays,
  guideTitle,
  guideId,
  destination,
  tripType,
  durationDays,
  highlights,
  description
}: TripPageClientProps) {
  const [viewMode, setViewMode] = useState<'trip-guide' | 'map' | 'live-feed'>('trip-guide')
  const tabsRef = useRef<HTMLDivElement>(null)

  const handleMapClick = () => {
    setViewMode('map')

    // Smooth scroll to position the tabs at the top of the viewport
    setTimeout(() => {
      if (tabsRef.current) {
        const tabsTop = tabsRef.current.getBoundingClientRect().top + window.scrollY
        const offset = 80 // Offset to account for any fixed header (adjust as needed)

        window.scrollTo({
          top: tabsTop - offset,
          behavior: 'smooth'
        })
      }
    }, 100) // Small delay to ensure state update
  }

  return (
    <>
      {/* Floating Tabs - Sticky at top with minimal padding */}
      <div ref={tabsRef} className="sticky top-20 z-40 mb-6 py-2">
        <div className="mx-auto max-w-md">
          <div className="bg-white rounded-full border border-gray-300 shadow-md overflow-hidden">
            <div className="flex items-center">
              <button
                onClick={() => setViewMode('trip-guide')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-all ${
                  viewMode === 'trip-guide'
                    ? 'bg-gradient-to-br from-rausch-500 to-rausch-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Trip Guide</span>
              </button>
              <button
                onClick={handleMapClick}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-all border-x border-gray-300 ${
                  viewMode === 'map'
                    ? 'bg-gradient-to-br from-rausch-500 to-rausch-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                onClick={() => setViewMode('live-feed')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium transition-all ${
                  viewMode === 'live-feed'
                    ? 'bg-gradient-to-br from-rausch-500 to-rausch-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Live Feed</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card - Only show in trip-guide view */}
      {viewMode === 'trip-guide' && (
        <Card className="p-5 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">About This Trip</h2>
          <p className="text-gray-700 leading-relaxed">
            {description}
          </p>
        </Card>
      )}

      {/* Trip Timeline Component */}
      <TripTimelineWithToggle
        guideDays={guideDays}
        guideTitle={guideTitle}
        guideId={guideId}
        destination={destination}
        tripType={tripType}
        durationDays={durationDays}
        highlights={highlights}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    </>
  )
}

