'use client'

/**
 * Results View Component
 * Displays the generated trip plan using the modal design from experiment file
 * Transforms V1 API data into the results layout format
 */

import { useState, useMemo, useRef } from 'react'
import { Calendar, Car, MapPin, Clock, Hotel, Camera, Coffee, Edit, Utensils, Navigation, DollarSign, TrendingUp, Info, ExternalLink, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { TripPlanData } from './types'
import { generateBookingLink, generateGetYourGuideLink, trackAffiliateClick, type AffiliateParams } from '@/lib/utils/affiliateLinks'
// Import V1 map component directly - DO NOT COPY, REUSE EXACT SAME COMPONENT
import { TripOverviewMap } from '@/components/itinerary/TripOverviewMap'

interface ResultsViewProps {
  plan: any // V1 API response
  tripData: TripPlanData
  locationImages?: Record<string, { featured: string; gallery: string[] }>
  structuredContext?: any
  onEdit: () => void
}

// Gradient colors for each day
const DAY_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
]

// Emojis for different location types
const LOCATION_EMOJIS = ['🗼', '🍷', '🏛️', '🎨', '🏟️', '🌊', '🏔️', '🌆', '🎭', '🍕']

export function ResultsView({ plan, tripData, locationImages = {}, structuredContext, onEdit }: ResultsViewProps) {
  const [selectedDay, setSelectedDay] = useState(1)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const dayContentRef = useRef<HTMLDivElement>(null)

  // Smooth scroll to day content when day is selected
  const handleDayClick = (dayNumber: number) => {
    setSelectedDay(dayNumber)
    if (dayContentRef.current) {
      dayContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Transform V1 API data to results layout format
  const itinerary = useMemo(() => {
    if (!plan?.days) return []

    return plan.days.map((day: any, index: number) => {
      // Determine if this is a travel day
      const isTravelDay = day.type === 'travel' || day.travelInfo

      // Build stops from items
      const stops = day.items?.map((item: any) => ({
        time: item.time || '09:00',
        title: item.title,
        type: item.type === 'travel' ? 'travel' : item.type === 'meal' ? 'meal' : 'activity',
        icon: item.type === 'travel' ? Navigation : item.type === 'meal' ? Utensils : Camera,
        duration: item.duration ? `${item.duration}h` : undefined
      })) || []

      // Extract accommodation from items or use default
      const accommodationItem = day.items?.find((item: any) =>
        item.type === 'accommodation' || item.title?.toLowerCase().includes('hotel')
      )

      const accommodation = accommodationItem ? {
        name: accommodationItem.title || 'Accommodation',
        rating: 4.5,
        price: accommodationItem.costEstimate ? `€${accommodationItem.costEstimate}` : '€120'
      } : undefined

      // Extract highlights (activities that aren't meals or travel)
      const highlights = day.items
        ?.filter((item: any) => item.type === 'activity')
        ?.slice(0, 3)
        ?.map((item: any) => item.title) || []

      // Get location images (featured + gallery)
      const locationKey = day.location.toLowerCase().replace(/\s+/g, '-')
      const images = locationImages[day.location] || locationImages[locationKey]
      const featuredImage = images?.featured
      const gallery = images?.gallery || []

      return {
        day: day.day,
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        location: day.location,
        emoji: LOCATION_EMOJIS[index % LOCATION_EMOJIS.length],
        distance: day.travelInfo?.distance ? `${Math.round(day.travelInfo.distance)} km` : undefined,
        duration: day.travelInfo?.duration ? `${Math.round(day.travelInfo.duration)}h` : undefined,
        image: featuredImage || DAY_GRADIENTS[index % DAY_GRADIENTS.length], // Use real image or fallback to gradient
        gallery, // Image gallery
        stops,
        accommodation,
        highlights,
        didYouKnow: day.didYouKnow
      }
    })
  }, [plan, locationImages])

  return (
    <div className="min-h-screen bg-white">
      {/* Header - 20% more compact */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-8">
              <div className="text-lg font-semibold text-emerald-600">TravelBlogr</div>
              <nav className="hidden md:flex items-center gap-6">
                <button onClick={onEdit} className="text-sm text-gray-700 hover:text-black font-medium">
                  Edit trip
                </button>
                <a href="#" className="text-sm text-gray-600 hover:text-black">Explore</a>
                <a href="#" className="text-sm text-gray-600 hover:text-black">Saved</a>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 rounded-full transition-colors flex items-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
              <button className="px-4 py-1.5 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full hover:shadow-lg transition-all font-medium flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5" />
                Save Trip
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Trip Title - 20% more compact */}
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="mb-5">
          <h1 className="text-3xl font-semibold mb-2 text-gray-900">
            {tripData.destinations[0]?.name} to {tripData.destinations[tripData.destinations.length - 1]?.name}
          </h1>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {tripData.dateRange?.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
              {tripData.dateRange?.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="flex items-center gap-1.5 capitalize">
              <Car className="w-3.5 h-3.5" />
              {tripData.transportMode}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>
              {tripData.dateRange && Math.ceil((tripData.dateRange.endDate.getTime() - tripData.dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
            </span>
          </div>
        </div>

        {/* Main Content - 20% more compact */}
        <div className="grid grid-cols-12 gap-5">
          {/* Left Sidebar - Day Navigation - Compact with connection lines */}
          <div className="col-span-12 lg:col-span-2">
            <div className="sticky top-20">
              <div className="text-[10px] font-bold text-gray-400 mb-3 px-1 tracking-wider">ITINERARY</div>
              <div className="relative space-y-2">
                {itinerary.map((day: any, index: number) => (
                  <div key={day.day} className="relative">
                    {/* Connection line to selected day */}
                    {selectedDay === day.day && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 w-5 h-0.5 bg-gray-300 z-10"></div>
                    )}

                    <button
                      onClick={() => handleDayClick(day.day)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl transition-all border ${
                        selectedDay === day.day
                          ? 'bg-white border-gray-300 shadow-md scale-105'
                          : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          selectedDay === day.day
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {day.day}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-semibold text-gray-900 truncate leading-tight">{day.location}</div>
                          <div className="text-[9px] text-gray-500 leading-tight">{day.date}</div>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Day Details - 20% more compact */}
          <div className="col-span-12 lg:col-span-6" ref={dayContentRef}>
            <div className="space-y-4">
              {itinerary.filter((day: any) => day.day === selectedDay).map((day: any) => (
                <div key={day.day}>
                  {/* Hero Image - Real image or gradient fallback */}
                  <div className="relative h-64 rounded-xl mb-4 overflow-hidden shadow-lg">
                    {day.image.startsWith('http') ? (
                      // Real image from database
                      <>
                        <img
                          src={day.image}
                          alt={day.location}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      </>
                    ) : (
                      // Gradient fallback
                      <div className="w-full h-full" style={{ background: day.image }} />
                    )}

                    {/* Overlay content */}
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <div className="text-center">
                        <div className="text-5xl mb-3 drop-shadow-lg">{day.emoji}</div>
                        <div className="text-2xl font-semibold mb-1.5 drop-shadow-lg">{day.location}</div>
                        {day.distance && (
                          <div className="text-base opacity-90 drop-shadow-lg">{day.distance} • {day.duration}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Image Gallery - Show if available */}
                  {day.gallery && day.gallery.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-4 gap-2">
                        {day.gallery.slice(0, 4).map((img: string, idx: number) => (
                          <div
                            key={idx}
                            className="relative h-24 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setSelectedImageIndex(idx)}
                          >
                            <img
                              src={img}
                              alt={`${day.location} ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Day Map - Shows cumulative route up to current day */}
                  {plan?.days && structuredContext?.locations && (
                    <div className="mb-4 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="p-3 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-teal-600" />
                          Route to {day.location}
                        </h3>
                      </div>
                      <TripOverviewMap
                        locations={plan.days
                          .slice(0, day.day) // Show all locations up to current day
                          .filter((d: any) => d.location && structuredContext.locations?.[d.location])
                          .map((d: any) => ({
                            name: d.location,
                            latitude: structuredContext.locations[d.location].latitude,
                            longitude: structuredContext.locations[d.location].longitude
                          }))}
                        transportMode={tripData.transportMode || 'car'}
                        className="w-full h-48"
                      />
                    </div>
                  )}

                  {/* Schedule - 20% more compact */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Today's Schedule
                    </h3>
                    <div className="space-y-3">
                      {day.stops.map((stop: any, idx: number) => {
                        const Icon = stop.icon
                        return (
                          <div key={idx} className="flex gap-3 group">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                stop.type === 'departure' ? 'bg-gray-100 border-2 border-gray-300' :
                                stop.type === 'arrival' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' :
                                'bg-blue-50'
                              }`}>
                                <Icon className={`w-4 h-4 ${
                                  stop.type === 'arrival' ? 'text-white' : 'text-gray-600'
                                }`} />
                              </div>
                              {idx < day.stops.length - 1 && (
                                <div className="w-0.5 h-8 bg-gray-200 my-0.5"></div>
                              )}
                            </div>
                            <div className="flex-1 pb-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                    {stop.title}
                                  </div>
                                  {stop.duration && (
                                    <div className="text-xs text-gray-500 mt-0.5">{stop.duration}</div>
                                  )}
                                </div>
                                <span className="text-xs font-medium text-gray-500">{stop.time}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Accommodation - 20% more compact */}
                  {day.accommodation && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-3 flex-1">
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
                            <Hotel className="w-8 h-8 text-orange-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded">
                                Tonight's Stay
                              </span>
                            </div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{day.accommodation.name}</h4>
                            <div className="flex items-center gap-2 text-xs">
                              <div className="flex items-center gap-0.5">
                                <span className="text-yellow-500">★</span>
                                <span className="font-semibold">{day.accommodation.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-gray-900">{day.accommodation.price}</div>
                          <div className="text-[10px] text-gray-500">per night</div>
                        </div>
                      </div>

                      {/* Affiliate Booking Buttons */}
                      <div className="flex gap-2">
                        <a
                          href={generateBookingLink({ locationName: day.location, checkIn: tripData.dateRange?.startDate.toISOString().split('T')[0], checkOut: tripData.dateRange?.endDate.toISOString().split('T')[0] })}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackAffiliateClick('booking.com', day.location, 'v2_results_accommodation')}
                          className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Book on Booking.com
                        </a>
                        <a
                          href={`https://www.airbnb.com/s/${encodeURIComponent(day.location)}/homes`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackAffiliateClick('airbnb', day.location, 'v2_results_accommodation')}
                          className="flex-1 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Book on Airbnb
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Highlights - 20% more compact */}
                  {day.highlights && day.highlights.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-gray-400" />
                        Don't Miss
                      </h3>
                      <div className="space-y-2 mb-3">
                        {day.highlights.map((highlight: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                            <span className="text-xs text-gray-700">{highlight}</span>
                          </div>
                        ))}
                      </div>

                      {/* Activity Booking Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <a
                          href={generateGetYourGuideLink(day.location)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackAffiliateClick('getyourguide', day.location, 'v2_results_activities')}
                          className="flex-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Book Activities
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Did You Know? - Interesting Facts */}
                  {day.didYouKnow && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 shadow-sm">
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-blue-900">
                        <Info className="w-4 h-4 text-blue-600" />
                        Did You Know?
                      </h3>
                      <p className="text-xs text-blue-800 leading-relaxed">{day.didYouKnow}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Right Sidebar - Map & Trip Stats */}
            <div className="col-span-4 lg:block hidden">
              <div className="sticky top-20 space-y-4">
                {/* Overall Trip Map - Shows entire route with numbered markers */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      Complete Route
                    </h3>
                  </div>
                  <TripOverviewMap
                    locations={plan?.days
                      ?.filter((day: any) => day.location && structuredContext?.locations?.[day.location])
                      ?.map((day: any) => ({
                        name: day.location,
                        latitude: structuredContext.locations[day.location].latitude,
                        longitude: structuredContext.locations[day.location].longitude
                      })) || []}
                    transportMode={tripData.transportMode || 'car'}
                    className="w-full h-80"
                  />
                  <div className="p-3 bg-white border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Viewing Day {selectedDay}</span>
                      <span className="font-semibold text-gray-900">{itinerary.find((d: any) => d.day === selectedDay)?.location}</span>
                    </div>
                  </div>
                </div>
                {/* Trip Stats */}
                {plan.stats && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      Trip Overview
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Total Days</span>
                        <span className="font-semibold text-gray-900">{plan.stats.totalDays}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Activities</span>
                        <span className="font-semibold text-gray-900">{plan.stats.totalActivities}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Meals</span>
                        <span className="font-semibold text-gray-900">{plan.stats.totalMeals}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Locations</span>
                        <span className="font-semibold text-gray-900">{plan.stats.locations?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cost Breakdown */}
                {plan.totalCostEstimate && plan.totalCostEstimate > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      Budget Estimate
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-gray-600">Total Trip Cost</span>
                        <span className="text-lg font-bold text-gray-900">€{plan.totalCostEstimate}</span>
                      </div>
                      {plan.stats?.averageCostPerDay && (
                        <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-100">
                          <span className="text-gray-600">Per Day</span>
                          <span className="font-semibold text-gray-900">€{plan.stats.averageCostPerDay}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Travel Tips */}
                {plan.tips && plan.tips.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-gray-400" />
                      Travel Tips
                    </h3>
                    <div className="space-y-2">
                      {plan.tips.slice(0, 5).map((tip: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          <span className="text-xs text-gray-700 leading-relaxed">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

