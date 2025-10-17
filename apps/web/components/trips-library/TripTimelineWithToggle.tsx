'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SmartImage as Image } from '@/components/ui/SmartImage'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  MapPin,
  Calendar,
  Star,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  LayoutGrid,
  List,
  Heart,
  Eye,
  Image as ImageIcon,
  TrendingUp,
  Info,
  Mountain,
  Sparkles,
  MessageCircle,
  Share2
} from 'lucide-react'
import { ElevationProfile } from '@/components/maps/ElevationProfile'
import { SidebarCTA } from '@/components/trips-library/SidebarCTA'
import { AccommodationRecommendations } from '@/components/trips-library/AccommodationRecommendations'
import { TransportOptions } from '@/components/trips-library/TransportOptions'
import { ActivitiesAndTours } from '@/components/trips-library/ActivitiesAndTours'

// Dynamically import TripOverviewMap to avoid SSR issues (same as itinerary planner)
const TripOverviewMap = dynamic(
  () => import('@/components/itinerary/TripOverviewMap').then(mod => ({ default: mod.TripOverviewMap })),
  { ssr: false, loading: () => <div className="h-[600px] bg-gray-100 animate-pulse rounded-lg" /> }
)

interface GuideDay {
  id: string
  day_number: number
  title: string
  description: string
  activities: string[]
  tips: string | null
}

interface TripTimelineWithToggleProps {
  guideDays: GuideDay[]
  guideTitle: string
  guideId: string
  destination: string
  tripType: string
  durationDays: number
  highlights: string[]
  viewMode: 'trip-guide' | 'map' | 'live-feed'
  setViewMode: (mode: 'trip-guide' | 'map' | 'live-feed') => void
}

// Trip Day Card Content Component
function TripDayCardContent({ day, dayImages, isMobile = false }: {
  day: GuideDay
  dayImages: Record<number, string>
  isMobile?: boolean
}) {
  return (
    <>
      <div className={`flex items-center justify-between ${isMobile ? 'mb-2' : 'mb-3'}`}>
        <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold text-airbnb-black`}>
          {day.title}
        </h3>
        <div className={`flex items-center gap-1 text-teal-500 ${isMobile ? 'text-[10px]' : 'text-xs'} font-medium`}>
          <Calendar className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
          Day {day.day_number}
        </div>
      </div>

      {dayImages[day.day_number] && (
        <div className={`relative w-full ${isMobile ? 'h-28' : 'h-40'} rounded-md overflow-hidden ${isMobile ? 'mb-2' : 'mb-3'}`}>
          <Image
            src={dayImages[day.day_number]}
            alt={day.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-airbnb-dark-gray ${isMobile ? 'mb-2' : 'mb-3'}`}>
        {day.description}
      </p>

      {/* Activities */}
      {day.activities && day.activities.length > 0 && (
        <div className={`${isMobile ? 'mb-2' : 'mb-3'}`}>
          <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium text-airbnb-black mb-1`}>Activities</p>
          <ul className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-airbnb-gray space-y-1`}>
            {day.activities.slice(0, 3).map((activity, index) => (
              <li key={index} className="flex items-start gap-1">
                <CheckCircle2 className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'} text-green-500 flex-shrink-0 mt-0.5`} />
                <span>{activity}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tips */}
      {day.tips && (
        <div className={`bg-yellow-50 border border-yellow-100 rounded-md ${isMobile ? 'p-1.5 mb-2' : 'p-2 mb-3'}`}>
          <div className="flex items-start gap-2">
            <div className={`text-orange-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>💡</div>
            <div>
              <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium text-orange-700 mb-1`}>Pro Tip</p>
              <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-orange-600`}>
                {day.tips}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CTA Button - Link to Location Detail Page */}
      <Link
        href={`/locations/${day.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
        className={`block w-full text-center ${isMobile ? 'py-2 text-xs' : 'py-2.5 text-sm'} bg-rausch-500 text-white rounded-lg hover:bg-rausch-600 transition-colors font-medium`}
      >
        View Location Details →
      </Link>
    </>
  )
}

export function TripTimelineWithToggle({
  guideDays,
  guideTitle,
  guideId,
  destination,
  tripType,
  durationDays,
  highlights,
  viewMode,
  setViewMode
}: TripTimelineWithToggleProps) {

  // Emotional images for each day (using Unsplash)
  const dayImages: Record<number, string> = {
    1: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=800&h=400&fit=crop', // Shibuya crossing
    2: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&h=400&fit=crop', // TeamLab
    3: 'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800&h=400&fit=crop', // Harajuku
    4: 'https://images.unsplash.com/photo-1624923686627-514dd5e57bae?w=800&h=400&fit=crop', // Disney
    5: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&h=400&fit=crop', // Temple
    6: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=400&fit=crop', // Food
    7: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&h=400&fit=crop', // Tokyo station
  }

  // Convert guideDays to TripOverviewMap format (same as itinerary planner)
  // For demo, using Tokyo coordinates - in production, fetch real coordinates from location database
  const mapLocations = useMemo(() => {
    const tokyoBaseCoords = { lat: 35.6762, lng: 139.6503 }

    return guideDays.map((day, index) => ({
      name: day.title,
      latitude: tokyoBaseCoords.lat + (Math.random() - 0.5) * 0.1, // Spread around Tokyo
      longitude: tokyoBaseCoords.lng + (Math.random() - 0.5) * 0.1
    }))
  }, [guideDays])

  return (
    <div>

      {/* Main Content with Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - 1/4 width - Only show in trip-guide view */}
        {viewMode === 'trip-guide' && (
          <div className="lg:col-span-1 space-y-4 order-2 lg:order-1">
            {/* At a Glance Card */}
            <Card className="p-5">
              <h3 className="font-bold text-gray-900 mb-4">At a Glance</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Duration</p>
                    <p className="text-sm text-gray-600">{durationDays} days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Best For</p>
                    <p className="text-sm text-gray-600 capitalize">{tripType}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Highlights */}
            {highlights && highlights.length > 0 && (
              <Card className="p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Highlights
                </h3>
                <ul className="space-y-2">
                  {highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Essential Info */}
            <Card className="p-5">
              <h3 className="font-bold text-gray-900 mb-3">Essential Info</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium text-gray-900">Best Time</p>
                  <p className="text-gray-600">March - May, Sept - Nov</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Language</p>
                  <p className="text-gray-600">Japanese</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Currency</p>
                  <p className="text-gray-600">Japanese Yen (¥)</p>
                </div>
              </div>
            </Card>

            {/* CTA */}
            <SidebarCTA guideId={guideId} guideTitle={guideTitle} />

            {/* Affiliate Links */}
            <AccommodationRecommendations destination={destination} />
            <TransportOptions destination={destination} />
            <ActivitiesAndTours destination={destination} />
          </div>
        )}

        {/* Main Column - 3/4 width for trip-guide, full width for map/live-feed */}
        <div className={`${viewMode === 'trip-guide' ? 'lg:col-span-3 order-1 lg:order-2' : 'lg:col-span-4'}`}>
          {/* Trip Guide View - Timeline like Landing Page */}
          {viewMode === 'trip-guide' && (
        <div className="relative">
          {/* Desktop Timeline Line - Center vertical line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-teal-300 top-3 bottom-0 hidden lg:block"></div>

          {/* Trip Cards - Alternating Left/Right */}
          <div className="space-y-0 lg:space-y-0">
            {guideDays.map((day, index) => {
              const isLeft = index % 2 === 0
              const isFirstCard = index === 0
              const isLastCard = index === guideDays.length - 1
              const daysStay = 1 // Can be customized per day

              return (
                <div key={day.id}>
                  {/* Mobile Layout: Vertical timeline on left, cards on right */}
                  <div className="flex lg:hidden items-start gap-3 relative">
                    {/* Mobile Timeline - Vertical on left */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      {/* Timeline Bubble */}
                      <div className="w-10 h-10 bg-teal-400 rounded-full border-[3px] border-white shadow-lg z-10 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{daysStay}d</span>
                      </div>

                      {/* Vertical line extending down (hidden for last card) */}
                      {!isLastCard && (
                        <div className="w-0.5 bg-teal-300 flex-1 min-h-[120px]"></div>
                      )}
                    </div>

                    {/* Mobile Card - On the right */}
                    <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 p-3 hover:shadow-md transition-shadow -mt-1">
                      {/* Horizontal dotted line connecting bubble to card */}
                      <div className="absolute left-[40px] top-[20px] w-[12px] h-[2px] border-t-2 border-dotted border-gray-300 z-0"></div>

                      <TripDayCardContent day={day} dayImages={dayImages} isMobile={true} />
                    </div>
                  </div>

                  {/* Desktop/Tablet Layout: Alternating layout */}
                  <div className="hidden lg:flex flex-row items-start gap-6">
                    <div className={`lg:w-1/2 ${isLeft ? `lg:pr-6 flex justify-end ${!isFirstCard ? 'lg:-mt-48' : ''}` : 'lg:pr-6'}`}>
                      {isLeft ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 lg:p-5 relative hover:shadow-md transition-shadow w-full max-w-[420px]">
                          {/* Horizontal dotted line connecting to timeline */}
                          <div className="absolute -right-[55px] top-[18px] w-[45px] h-[2px] border-t-2 border-dotted border-gray-300 z-0"></div>

                          {/* Timeline Bubble - positioned closer to card, on the green line */}
                          <div className="absolute w-12 h-12 bg-teal-400 rounded-full border-[3px] border-white shadow-lg -right-[61px] top-[6px] z-10">
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{daysStay}d</span>
                            </div>
                          </div>

                          <TripDayCardContent day={day} dayImages={dayImages} />
                        </div>
                      ) : (
                        <div className="lg:w-full">
                          {/* Empty space for alternating layout */}
                        </div>
                      )}
                    </div>

                    <div className={`lg:w-1/2 ${isLeft ? 'lg:pl-6' : `lg:pl-6 flex justify-start ${!isFirstCard ? 'lg:-mt-48' : ''}`}`}>
                      {!isLeft ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 lg:p-5 relative hover:shadow-md transition-shadow w-full max-w-[420px]">
                          {/* Horizontal dotted line connecting to timeline */}
                          <div className="absolute -left-[55px] top-[18px] w-[45px] h-[2px] border-t-2 border-dotted border-gray-300 z-0"></div>

                          {/* Timeline Bubble - positioned closer to card, on the green line */}
                          <div className="absolute w-12 h-12 bg-teal-400 rounded-full border-[3px] border-white shadow-lg -left-[61px] top-[6px] z-10">
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">{daysStay}d</span>
                            </div>
                          </div>

                          <TripDayCardContent day={day} dayImages={dayImages} />
                        </div>
                      ) : (
                        <div className="lg:w-full">
                          {/* Empty space for alternating layout */}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
          )}

          {/* Map View - Same as Itinerary Planner */}
          {viewMode === 'map' && (
            <div className="space-y-4">
              {/* Trip Overview Map - Exactly like itinerary planner */}
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-teal-600" />
                  Your Trip Route
                </h3>
                <TripOverviewMap
                  locations={mapLocations}
                  transportMode="car"
                  className="h-96 w-full rounded-lg overflow-hidden shadow-lg"
                />
              </div>

              {/* Route Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Total Locations</h4>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{guideDays.length}</p>
                  <p className="text-xs text-gray-600 mt-1">Stops on this journey</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Duration</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{durationDays} days</p>
                  <p className="text-xs text-gray-600 mt-1">Total trip length</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Trip Type</h4>
                  </div>
                  <p className="text-2xl font-bold text-purple-600 capitalize">{tripType}</p>
                  <p className="text-xs text-gray-600 mt-1">Travel style</p>
                </Card>
              </div>

              {/* Elevation Profile - Demo Data */}
              <ElevationProfile
                elevations={[100, 150, 200, 180, 220, 250, 230, 200, 180, 150]}
                distances={[0, 5000, 10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000]}
                ascent={150}
                descent={100}
                maxElevation={250}
                minElevation={100}
              />

              {/* Location List */}
              <Card className="p-5">
                <h3 className="font-bold text-gray-900 mb-4">All Locations</h3>
                <div className="space-y-3">
                  {guideDays.map((day, index) => (
                    <div key={day.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{day.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{day.description}</p>
                        {day.activities && day.activities.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {day.activities.slice(0, 3).map((activity, idx) => (
                              <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {activity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/locations/${day.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                        className="text-sm text-rausch-500 hover:text-rausch-600 font-medium whitespace-nowrap"
                      >
                        View Details →
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Live Feed View - Trip-Specific Feed (Matches Global Live Feed Template) */}
          {viewMode === 'live-feed' && (
            <div className="space-y-4">
              {/* Feed Items - Matches Global FeedItem Component Structure */}
              <div className="space-y-4">
                {guideDays.map((day, index) => {
                  const [liked, setLiked] = useState(false)
                  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 10)

                  return (
                    <Card key={day.id} className="hover:shadow-lg transition-all">
                      {/* Card Header - User Info */}
                      <div className="p-4 pb-3 border-b">
                        <div className="flex items-start gap-4">
                          {/* User Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rausch-500 to-rausch-600 flex items-center justify-center text-white font-bold shadow-md">
                              {guideTitle.charAt(0)}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Activity Header */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                <MapPin className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="font-semibold text-gray-900">
                                {guideTitle}
                              </span>
                              <span className="text-sm text-gray-600">
                                visited {day.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                Day {day.day_number} • {Math.floor(Math.random() * 24) + 1}h ago
                              </span>
                              {index < 2 && (
                                <div className="bg-rausch-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  New
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-0">
                        {/* Featured Image */}
                        {dayImages[day.day_number] && (
                          <div className="relative h-80 overflow-hidden">
                            <Image
                              src={dayImages[day.day_number]}
                              alt={day.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        {/* Post Content */}
                        <div className="p-4">
                          {/* Location Info */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <MapPin className="h-4 w-4" />
                            <span>{day.title}</span>
                            <span>•</span>
                            <span>{destination}</span>
                          </div>

                          {/* Description */}
                          <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                            {day.description}
                          </p>

                          {/* Activities Tags */}
                          {day.activities && day.activities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {day.activities.slice(0, 3).map((activity, idx) => (
                                <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {activity}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Action Buttons - Matches Global Template */}
                          <div className="flex items-center gap-4 pt-3 border-t">
                            <button
                              onClick={() => {
                                setLiked(!liked)
                                setLikeCount(prev => liked ? prev - 1 : prev + 1)
                              }}
                              className={`flex items-center gap-2 text-sm ${liked ? 'text-red-600' : 'text-gray-600'} hover:text-red-600 transition-colors`}
                            >
                              <Heart className={`h-4 w-4 ${liked ? 'fill-red-600' : ''}`} />
                              <span>{likeCount}</span>
                            </button>

                            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                              <MessageCircle className="h-4 w-4" />
                              <span>Comment</span>
                            </button>

                            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                              <Share2 className="h-4 w-4" />
                              <span>Share</span>
                            </button>

                            <Link
                              href={`/locations/${day.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`}
                              className="ml-auto text-rausch-500 hover:text-rausch-600 font-medium text-sm flex items-center gap-1"
                            >
                              View Location
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>

              {/* CTA Card - Matches Global Template Style */}
              <Card className="p-8 text-center bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Start Your Own Journey</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Copy this trip to your account and start documenting your journey with photos, videos, and real-time updates.
                </p>
                <button className="px-6 py-3 bg-rausch-500 text-white rounded-lg hover:bg-rausch-600 transition-colors font-medium">
                  Copy Trip & Start Sharing
                </button>
              </Card>
            </div>
          )}
        </div>


      </div>
    </div>
  )
}