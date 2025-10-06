'use client'

/**
 * Journey Timeline Modal - Airbnb-style with location cards
 */

import React, { useState } from 'react'
import { X, ChevronDown, ChevronRight, MapPin, Calendar, DollarSign, Utensils, Compass, ArrowRight, Hotel, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import Image from 'next/image'

interface ItineraryModalProps {
  itinerary: any
  onClose: () => void
}

export function ItineraryModal({ itinerary, onClose }: ItineraryModalProps) {
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set())

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Group days by location
  const locationGroups = itinerary.days.reduce((groups: any[], day: any) => {
    const lastGroup = groups[groups.length - 1]
    if (lastGroup && lastGroup.location === day.location) {
      lastGroup.days.push(day)
      lastGroup.endDate = day.date
    } else {
      groups.push({
        location: day.location,
        startDate: day.date,
        endDate: day.date,
        days: [day]
      })
    }
    return groups
  }, [])

  const toggleLocation = (location: string) => {
    const newExpanded = new Set(expandedLocations)
    if (newExpanded.has(location)) {
      newExpanded.delete(location)
    } else {
      newExpanded.add(location)
    }
    setExpandedLocations(newExpanded)
  }

  // Calculate actual total cost from all items
  const actualTotalCost = itinerary.days.reduce((total: number, day: any) => {
    return total + day.items.reduce((dayTotal: number, item: any) => {
      return dayTotal + (item.costEstimate || 0)
    }, 0)
  }, 0)

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal - Fixed height with internal scroll */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
            {/* Close Button - Top Right Corner */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-full transition-colors group"
            >
              <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Close</span>
              <X className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
            </button>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              {/* Header - Title */}
              <div className="bg-white px-24 py-6 pt-8">
                <div className="pr-24 mb-6">
                  <h2 className="text-2xl font-semibold text-airbnb-black mb-3">
                    {itinerary.title}
                  </h2>
                  <p className="text-base text-airbnb-dark-gray leading-relaxed max-w-3xl">
                    {itinerary.summary}
                  </p>
                </div>

                {/* Journey Route */}
                <div className="flex items-center gap-2 flex-wrap">
                  {locationGroups.map((group: any, index: number) => (
                    <React.Fragment key={index}>
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 border border-teal-200 rounded-lg">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        <span className="font-semibold text-airbnb-black">{group.location}</span>
                        <span className="text-sm text-teal-700 font-medium">
                          {group.days.length}d
                        </span>
                      </div>
                      {index < locationGroups.length - 1 && (
                        <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Stats - Sticky within scroll container */}
              <div className="sticky top-0 bg-white border-y border-gray-200 px-24 py-4 z-10 shadow-sm">
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-airbnb-gray mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Duration</span>
                  </div>
                  <span className="text-lg font-semibold text-airbnb-black">
                    {itinerary.stats.totalDays} days
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-airbnb-gray mb-1">
                    <Compass className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Activities</span>
                  </div>
                  <span className="text-lg font-semibold text-airbnb-black">
                    {itinerary.stats.totalActivities}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-airbnb-gray mb-1">
                    <Utensils className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Meals</span>
                  </div>
                  <span className="text-lg font-semibold text-airbnb-black">
                    {itinerary.stats.totalMeals}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-airbnb-gray mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wide">Estimated Cost</span>
                  </div>
                  <span className="text-lg font-semibold text-airbnb-black">
                    ${actualTotalCost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-24 py-8">
              {/* Timeline with Location Cards */}
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-teal-200"></div>

                {/* Location Groups */}
                <div className="space-y-8">
                  {locationGroups.map((group: any, groupIndex: number) => {
                    const isExpanded = expandedLocations.has(group.location)
                    const groupCost = group.days.reduce((sum: number, day: any) =>
                      sum + day.items.reduce((daySum: number, item: any) => daySum + (item.costEstimate || 0), 0), 0
                    )
                    const activities = group.days.flatMap((d: any) => d.items.filter((i: any) => i.type === 'activity'))
                    const restaurants = group.days.flatMap((d: any) => d.items.filter((i: any) => i.type === 'meal'))

                    return (
                      <div key={groupIndex} className="relative pl-20">
                        {/* Timeline Dot */}
                        <div className="absolute left-6 top-6 w-6 h-6 bg-teal-400 rounded-full border-4 border-white shadow-sm z-10"></div>

                        {/* Horizontal Dotted Line from Timeline to Card */}
                        <div className="absolute left-9 top-9 w-11 border-t-2 border-dotted border-teal-300"></div>

                        {/* Location Card - Airbnb Style */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                          {/* Card Header - Clickable */}
                          <button
                            onClick={() => toggleLocation(group.location)}
                            className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <h3 className="text-2xl font-semibold text-airbnb-black">
                                      {group.location}
                                    </h3>
                                    <span className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm font-medium">
                                      {group.days.length} {group.days.length === 1 ? 'day' : 'days'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-airbnb-gray pr-8">
                                    <Calendar className="h-4 w-4" />
                                    <span>{group.startDate}</span>
                                    {group.startDate !== group.endDate && (
                                      <>
                                        <span>→</span>
                                        <span>{group.endDate}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-6 text-sm">
                                  <div className="flex items-center gap-2 text-airbnb-gray">
                                    <Compass className="h-4 w-4 text-blue-500" />
                                    <span>{activities.length} activities</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-airbnb-gray">
                                    <Utensils className="h-4 w-4 text-orange-500" />
                                    <span>{restaurants.length} meals</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-green-500" />
                                    <span className="font-medium text-airbnb-black">${groupCost}</span>
                                  </div>
                                </div>
                              </div>
                              <ChevronDown
                                className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </div>
                          </button>

                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="border-t border-gray-100 p-6 bg-gray-50">
                              {/* Inner Timeline Container */}
                              <div className="relative">
                                {/* Vertical Dotted Timeline Line for Days */}
                                <div className="absolute left-5 top-5 bottom-5 w-0.5 border-l-2 border-dotted border-gray-400"></div>

                                {group.days.map((day: any, dayIndex: number) => {
                                  // Separate activities and meals
                                  const dayActivities = day.items.filter((item: any) => item.type === 'activity' || item.type === 'travel')
                                  const dayMeals = day.items.filter((item: any) => item.type === 'meal')

                                  return (
                                    <div key={dayIndex} className={`relative ${dayIndex > 0 ? 'mt-6 pt-6' : ''}`}>
                                      {/* Day Timeline Dot */}
                                      <div className="absolute left-3 top-3 w-4 h-4 bg-white border-2 border-gray-400 rounded-full z-10"></div>

                                      {/* Horizontal Dotted Line from Day Timeline to Content */}
                                      <div className="absolute left-7 top-5 w-5 border-t-2 border-dotted border-gray-400"></div>

                                      <div className="pl-12">
                                        <div className="flex items-center justify-between mb-5">
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-airbnb-black text-white rounded-full flex items-center justify-center font-semibold text-sm shadow-sm">
                                              {day.day}
                                            </div>
                                            <div>
                                              <p className="font-semibold text-airbnb-black">Day {day.day}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2 text-sm text-airbnb-gray pr-4">
                                            <Calendar className="h-4 w-4" />
                                            <span>{day.date}</span>
                                          </div>
                                        </div>

                                    {/* Activities Section */}
                                    {dayActivities.length > 0 && (
                                      <div className="mb-5">
                                        <div className="flex items-center gap-2 mb-3">
                                          <Compass className="h-4 w-4 text-blue-600" />
                                          <h4 className="text-sm font-semibold text-airbnb-black uppercase tracking-wide">
                                            Activities & Sightseeing
                                          </h4>
                                        </div>
                                        <div className="space-y-3">
                                          {dayActivities.map((item: any, itemIndex: number) => (
                                            <div key={itemIndex} className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 hover:border-blue-200 transition-colors">
                                              <div className="flex gap-3">
                                                <div className="flex-shrink-0 text-sm font-semibold text-blue-600 w-14">
                                                  {item.time}
                                                </div>
                                                <div className="flex-1">
                                                  <h5 className="font-semibold text-airbnb-black mb-1.5">
                                                    {item.title}
                                                  </h5>
                                                  <p className="text-sm text-airbnb-dark-gray leading-relaxed mb-2">
                                                    {item.description}
                                                  </p>
                                                  <div className="flex items-center gap-3 text-xs text-airbnb-gray">
                                                    <span className="flex items-center gap-1">
                                                      <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                                      {item.duration}h
                                                    </span>
                                                    {item.costEstimate > 0 && (
                                                      <span className="flex items-center gap-1 font-medium text-airbnb-black">
                                                        <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                                                        ${item.costEstimate}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Meals Section */}
                                    {dayMeals.length > 0 && (
                                      <div>
                                        <div className="flex items-center gap-2 mb-3">
                                          <Utensils className="h-4 w-4 text-orange-600" />
                                          <h4 className="text-sm font-semibold text-airbnb-black uppercase tracking-wide">
                                            Dining & Restaurants
                                          </h4>
                                        </div>
                                        <div className="space-y-3">
                                          {dayMeals.map((item: any, itemIndex: number) => (
                                            <div key={itemIndex} className="bg-white rounded-xl p-4 shadow-sm border border-orange-100 hover:border-orange-200 transition-colors">
                                              <div className="flex gap-3">
                                                <div className="flex-shrink-0 text-sm font-semibold text-orange-600 w-14">
                                                  {item.time}
                                                </div>
                                                <div className="flex-1">
                                                  <h5 className="font-semibold text-airbnb-black mb-1.5">
                                                    {item.title}
                                                  </h5>
                                                  <p className="text-sm text-airbnb-dark-gray leading-relaxed mb-2">
                                                    {item.description}
                                                  </p>
                                                  <div className="flex items-center gap-3 text-xs text-airbnb-gray">
                                                    <span className="flex items-center gap-1">
                                                      <span className="w-1 h-1 bg-orange-400 rounded-full"></span>
                                                      {item.duration}h
                                                    </span>
                                                    {item.costEstimate > 0 && (
                                                      <span className="flex items-center gap-1 font-medium text-airbnb-black">
                                                        <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                                                        ${item.costEstimate}
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Tips */}
              {itinerary.tips && itinerary.tips.length > 0 && (
                <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50 p-6">
                  <h3 className="text-sm font-semibold text-airbnb-black mb-4 uppercase tracking-wide">
                    Travel Tips
                  </h3>
                  <ul className="space-y-3">
                    {itinerary.tips.map((tip: string, idx: number) => (
                      <li key={idx} className="text-sm text-amber-800 leading-relaxed flex gap-3">
                        <span className="text-amber-500 font-bold flex-shrink-0">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            </div>

            {/* Footer - Fixed at bottom */}
            <div className="flex-shrink-0 bg-white border-t border-gray-200 px-24 py-6 flex items-center justify-between shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.12)]">
              <div className="text-sm text-airbnb-gray font-medium">
                Generated {new Date(itinerary.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="px-8 py-3 text-base font-medium border-2 hover:bg-gray-50"
                >
                  Back to Planning
                </Button>
                <Button
                  onClick={() => window.print()}
                  className="bg-rausch-500 hover:bg-rausch-600 text-white px-8 py-3 text-base font-medium shadow-md hover:shadow-lg transition-shadow"
                >
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </div>
    </>
  )
}

