'use client'

export const dynamic = 'force-dynamic'


/**
 * Trip Results Experiment Page
 * Demonstrates the itinerary results layout from Iternarary-Modal-V2-experiment.js
 * This is the EXACT same layout used in our ResultsView component
 */

import { useState } from 'react'
import { Calendar, Car, Train, Bike, Plane, Bus, MapPin, Clock, Hotel, Camera, Coffee, Sparkles, DollarSign, type LucideIcon } from 'lucide-react'

interface Stop {
  time: string
  title: string
  type: 'departure' | 'arrival' | 'stop' | 'activity'
  icon: LucideIcon
  duration?: string
}

interface DayItinerary {
  day: number
  date: string
  location: string
  emoji: string
  distance?: string
  duration?: string
  image: string
  stops: Stop[]
  accommodation?: {
    name: string
    rating: number
    price: string
  }
  highlights?: string[]
}

export default function TripResultsExperiment() {
  const [selectedDay, setSelectedDay] = useState(1)

  // Mock trip data matching different transport modes
  const tripData = {
    title: 'Paris to Rome Road Trip',
    transportMode: 'roadtrip',
    transportIcon: Car,
    startDate: 'Oct 25, 2025',
    endDate: 'Oct 30, 2025',
    duration: '5 days',
    travelers: '2 travelers',
    rating: 4.9
  }

  // Mock itinerary with different trip types
  const itinerary: DayItinerary[] = [
    {
      day: 1,
      date: 'Oct 25',
      location: 'Paris → Lyon',
      emoji: '🗼',
      distance: '465 km',
      duration: '4h 30min',
      image: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stops: [
        { time: '09:00', title: 'Depart Paris', type: 'departure', icon: MapPin },
        { time: '11:30', title: 'Beaune Wine Tasting', type: 'stop', duration: '1h 30min', icon: Coffee },
        { time: '14:00', title: 'Arrive Lyon', type: 'arrival', icon: MapPin }
      ],
      accommodation: { name: 'Hôtel Le Royal Lyon', rating: 4.8, price: '€120' },
      highlights: ['Explore Vieux Lyon', 'Dinner at Paul Bocuse', 'Evening riverside walk']
    },
    {
      day: 2,
      date: 'Oct 26',
      location: 'Lyon',
      emoji: '🍷',
      image: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      stops: [
        { time: '09:00', title: 'Basilique Notre-Dame', type: 'activity', icon: Camera },
        { time: '12:00', title: 'Lunch at Les Halles', type: 'activity', icon: Coffee },
        { time: '15:00', title: 'Parc de la Tête d\'Or', type: 'activity', icon: Camera }
      ],
      accommodation: { name: 'Hôtel Le Royal Lyon', rating: 4.8, price: '€120' },
      highlights: ['Local market tour', 'Lyon Museum of Fine Arts', 'Traboules exploration']
    },
    {
      day: 3,
      date: 'Oct 27',
      location: 'Lyon → Florence',
      emoji: '🏛️',
      distance: '645 km',
      duration: '6h 15min',
      image: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      stops: [
        { time: '08:00', title: 'Depart Lyon', type: 'departure', icon: MapPin },
        { time: '12:00', title: 'Turin lunch break', type: 'stop', duration: '1h 30min', icon: Coffee },
        { time: '16:00', title: 'Arrive Florence', type: 'arrival', icon: MapPin }
      ],
      accommodation: { name: 'Hotel Brunelleschi', rating: 4.9, price: '€180' },
      highlights: ['Evening walk to Ponte Vecchio', 'Gelato at Vivoli', 'Sunset at Piazzale Michelangelo']
    },
    {
      day: 4,
      date: 'Oct 28',
      location: 'Florence',
      emoji: '🎨',
      image: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      stops: [
        { time: '09:00', title: 'Uffizi Gallery', type: 'activity', icon: Camera },
        { time: '13:00', title: 'Lunch at Mercato Centrale', type: 'activity', icon: Coffee },
        { time: '16:00', title: 'Duomo & Baptistery', type: 'activity', icon: Camera }
      ],
      accommodation: { name: 'Hotel Brunelleschi', rating: 4.9, price: '€180' },
      highlights: ['David at Accademia', 'Leather market shopping', 'Tuscan wine tasting']
    },
    {
      day: 5,
      date: 'Oct 29',
      location: 'Florence → Rome',
      emoji: '🏟️',
      distance: '275 km',
      duration: '3h 30min',
      image: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      stops: [
        { time: '10:00', title: 'Depart Florence', type: 'departure', icon: MapPin },
        { time: '12:00', title: 'Orvieto Cathedral stop', type: 'stop', duration: '1h', icon: Camera },
        { time: '14:30', title: 'Arrive Rome', type: 'arrival', icon: MapPin }
      ],
      accommodation: { name: 'Hotel Artemide', rating: 4.7, price: '€150' },
      highlights: ['Evening at Trevi Fountain', 'Dinner in Trastevere', 'Spanish Steps walk']
    }
  ]

  const TransportIcon = tripData.transportIcon

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-12">
              <div className="text-2xl font-semibold text-emerald-600">TravelBlogr</div>
              <nav className="hidden md:flex items-center gap-8">
                <a href="/plan-v2" className="text-gray-700 hover:text-black font-medium">
                  Edit trip
                </a>
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
          <h1 className="text-4xl font-semibold mb-3 text-gray-900">{tripData.title}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {tripData.startDate} - {tripData.endDate}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="flex items-center gap-2 capitalize">
              <TransportIcon className="w-4 h-4" />
              {tripData.transportMode}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span>{tripData.duration} • {tripData.travelers}</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="flex items-center gap-1">
              <span className="text-yellow-500">★</span>
              <span className="font-medium">{tripData.rating}</span>
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left Sidebar - Day Navigation */}
          <div className="col-span-3">
            <div className="sticky top-28 space-y-2">
              <div className="text-sm font-semibold text-gray-500 mb-3 px-3">YOUR ITINERARY</div>
              {itinerary.map((day) => (
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

              {/* Partner Offer Card */}
              <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="text-xs font-semibold text-blue-600 mb-2">PARTNER OFFER</div>
                <div className="text-sm font-medium text-gray-800 mb-2">Save 15% on car rentals</div>
                <button className="w-full py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  View deals
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Day Details */}
          <div className="col-span-9">
            <div className="space-y-6">
              {itinerary.filter(day => day.day === selectedDay).map((day) => (
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
                      {day.stops.map((stop, idx) => {
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
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span className="text-gray-600">Excellent location</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-semibold text-gray-900">{day.accommodation.price}</div>
                          <div className="text-xs text-gray-500">per night</div>
                          <button className="mt-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors font-medium">
                            View details
                          </button>
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
                        {day.highlights.map((highlight, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-gray-700">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ad Placeholder (only on day 2) */}
                  {selectedDay === 2 && (
                    <div className="mt-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
                      <div className="text-xs text-gray-400 mb-2">ADVERTISEMENT</div>
                      <div className="text-sm text-gray-500">Google Ads 728x90</div>
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

