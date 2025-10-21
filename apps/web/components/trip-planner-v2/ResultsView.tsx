'use client'

/**
 * Results View Component
 * Displays the generated trip plan using the modal design from experiment file
 * Transforms V1 API data into the results layout format
 */

import { useState, useMemo } from 'react'
import { Calendar, Car, MapPin, Clock, Hotel, Camera, Coffee, Edit, Utensils, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { TripPlanData } from './types'

interface ResultsViewProps {
  plan: any // V1 API response
  tripData: TripPlanData
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

export function ResultsView({ plan, tripData, onEdit }: ResultsViewProps) {
  const [selectedDay, setSelectedDay] = useState(1)

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

      return {
        day: day.day,
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        location: day.location,
        emoji: LOCATION_EMOJIS[index % LOCATION_EMOJIS.length],
        distance: day.travelInfo?.distance ? `${Math.round(day.travelInfo.distance)} km` : undefined,
        duration: day.travelInfo?.duration ? `${Math.round(day.travelInfo.duration)}h` : undefined,
        image: DAY_GRADIENTS[index % DAY_GRADIENTS.length],
        stops,
        accommodation,
        highlights,
        didYouKnow: day.didYouKnow
      }
    })
  }, [plan])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-12">
              <div className="text-2xl font-semibold text-emerald-600">TravelBlogr</div>
              <nav className="hidden md:flex items-center gap-8">
                <button onClick={onEdit} className="text-gray-700 hover:text-black font-medium">
                  Edit trip
                </button>
                <a href="#" className="text-gray-600 hover:text-black">Explore</a>
                <a href="#" className="text-gray-600 hover:text-black">Saved</a>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-full transition-colors">
                Save trip
              </button>
              <button className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full hover:shadow-lg transition-all font-medium">
                Share itinerary
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Trip Title */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold mb-3 text-gray-900">
            {tripData.destinations[0]?.name} to {tripData.destinations[tripData.destinations.length - 1]?.name}
          </h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {tripData.dateRange?.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
              {tripData.dateRange?.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="flex items-center gap-2 capitalize">
              <Car className="w-4 h-4" />
              {tripData.transportMode}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>
              {tripData.dateRange && Math.ceil((tripData.dateRange.endDate.getTime() - tripData.dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))} days
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left Sidebar - Day Navigation */}
          <div className="col-span-3">
            <div className="sticky top-28 space-y-2">
              <div className="text-sm font-semibold text-gray-500 mb-3 px-3">YOUR ITINERARY</div>
              {itinerary.map((day: any) => (
                <button
                  key={day.day}
                  onClick={() => setSelectedDay(day.day)}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedDay === day.day
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 shadow-sm'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className="text-2xl">{day.emoji}</div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${selectedDay === day.day ? 'text-emerald-700' : 'text-gray-900'}`}>
                        Day {day.day}
                      </div>
                      <div className="text-xs text-gray-500">{day.date}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600 ml-11">{day.location}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content - Day Details */}
          <div className="col-span-9">
            <div className="space-y-6">
              {itinerary.filter((day: any) => day.day === selectedDay).map((day: any) => (
                <div key={day.day}>
                  {/* Hero Image */}
                  <div
                    className="h-96 rounded-2xl mb-6 flex items-center justify-center text-white shadow-xl"
                    style={{ background: day.image }}
                  >
                    <div className="text-center">
                      <div className="text-6xl mb-4">{day.emoji}</div>
                      <div className="text-3xl font-semibold mb-2">{day.location}</div>
                      {day.distance && (
                        <div className="text-lg opacity-90">{day.distance} • {day.duration}</div>
                      )}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
                    <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      Today's Schedule
                    </h3>
                    <div className="space-y-4">
                      {day.stops.map((stop: any, idx: number) => {
                        const Icon = stop.icon
                        return (
                          <div key={idx} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                stop.type === 'departure' ? 'bg-gray-100 border-2 border-gray-300' :
                                stop.type === 'arrival' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' :
                                'bg-blue-50'
                              }`}>
                                <Icon className={`w-5 h-5 ${
                                  stop.type === 'arrival' ? 'text-white' : 'text-gray-600'
                                }`} />
                              </div>
                              {idx < day.stops.length - 1 && (
                                <div className="w-0.5 h-12 bg-gray-200 my-1"></div>
                              )}
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                                    {stop.title}
                                  </div>
                                  {stop.duration && (
                                    <div className="text-sm text-gray-500 mt-1">{stop.duration}</div>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-500">{stop.time}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Accommodation */}
                  {day.accommodation && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow mb-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4 flex-1">
                          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                            <Hotel className="w-12 h-12 text-orange-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded">
                                Tonight's Stay
                              </span>
                            </div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">{day.accommodation.name}</h4>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="flex items-center gap-1">
                                <span className="text-yellow-500">★</span>
                                <span className="font-semibold">{day.accommodation.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-semibold text-gray-900">{day.accommodation.price}</div>
                          <div className="text-xs text-gray-500">per night</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Highlights */}
                  {day.highlights && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-gray-400" />
                        Don't Miss
                      </h3>
                      <div className="space-y-3">
                        {day.highlights.map((highlight: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-gray-700">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

