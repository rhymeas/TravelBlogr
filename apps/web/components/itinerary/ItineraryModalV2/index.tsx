'use client'

/**
 * Modern Trip Planning Modal - Timeline Design
 * Based on the European Adventure design with location tabs and journey summary
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Calendar, DollarSign, Utensils, Compass, Plus, Share2, Download, Save } from 'lucide-react'
import { formatLocationDisplay } from '@/lib/utils/locationFormatter'
import Image from 'next/image'

interface planModalV2Props {
  plan: any
  onClose: () => void
}

export function planModalV2({ plan, onClose }: planModalV2Props) {
  const [activeLocationIndex, setActiveLocationIndex] = useState(0)

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Group days by location
  const locationGroups = plan.days.reduce((groups: any[], day: any) => {
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

  // Calculate totals
  const totalCost = plan.days.reduce((total: number, day: any) => {
    return total + day.items.reduce((dayTotal: number, item: any) => {
      return dayTotal + (item.costEstimate || 0)
    }, 0)
  }, 0)

  const totalActivities = plan.stats?.totalActivities ||
    plan.days.reduce((total: number, day: any) =>
      total + day.items.filter((item: any) => item.type === 'activity').length, 0)

  const totalMeals = plan.stats?.totalMeals ||
    plan.days.reduce((total: number, day: any) =>
      total + day.items.filter((item: any) => item.type === 'meal').length, 0)

  // Get highlights per location
  const getLocationHighlights = (group: any) => {
    const activities = group.days.flatMap((day: any) =>
      day.items.filter((item: any) => item.type === 'activity')
    )
    return activities.slice(0, 3) // Top 3 activities
  }

  const currentLocation = locationGroups[activeLocationIndex]
  const highlights = currentLocation ? getLocationHighlights(currentLocation) : []

  // Format dates
  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }

    if (start === end) {
      return startDate.toLocaleDateString('en-US', options)
    }
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`
  }

  // Get icon for location type
  const getLocationIcon = (location: string) => {
    const lower = location.toLowerCase()
    if (lower.includes('paris')) return '🗼'
    if (lower.includes('venice')) return '🚤'
    if (lower.includes('rome')) return '🏛️'
    if (lower.includes('london')) return '🎡'
    if (lower.includes('tokyo')) return '🗾'
    if (lower.includes('new york')) return '🗽'
    return '📍'
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl max-h-[calc(100vh-48px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>

          {/* Header with Title and Timeline */}
          <div className="bg-gradient-to-br from-gray-50 to-white px-12 pt-4 pb-1 border-b border-gray-200">
            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2 pr-12">
              {plan.title}
            </h1>

            {/* Minimal Dot Timeline */}
            <div className="relative flex items-center justify-between max-w-5xl mx-auto pb-1">
              {/* Connecting Line */}
              <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" style={{ zIndex: 0 }} />

              {/* Progress Line */}
              <div
                className="absolute top-3.5 left-0 h-0.5 bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-700 ease-out"
                style={{
                  width: `${(activeLocationIndex / locationGroups.length) * 100}%`,
                  zIndex: 1
                }}
              />

              {/* Location Steps */}
              {locationGroups.map((group: any, index: number) => {
                const formatted = formatLocationDisplay(group.location)
                const isActive = index === activeLocationIndex
                const isPast = index < activeLocationIndex

                return (
                  <button
                    key={index}
                    onClick={() => setActiveLocationIndex(index)}
                    className="relative flex flex-col items-center gap-0.5 group z-10 transition-all"
                    style={{ flex: 1 }}
                  >
                    {/* Outer Dot */}
                    <div className={`
                      w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300
                      ${isActive
                        ? 'bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/30 scale-110'
                        : isPast
                        ? 'bg-gradient-to-br from-teal-300 to-teal-500 shadow-sm'
                        : 'bg-white border-2 border-gray-300 group-hover:border-gray-400'
                      }
                    `}>
                      {/* Inner Dot with Day Count */}
                      <div className={`
                        w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all
                        ${isActive || isPast
                          ? 'bg-white text-teal-600'
                          : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
                        }
                      `}>
                        {group.days.length}
                      </div>
                    </div>

                    {/* Location Name */}
                    <div className={`
                      text-xs font-bold transition-all duration-200
                      ${isActive ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-800'}
                    `}>
                      {formatted.main}
                    </div>

                    {/* Date Range */}
                    <div className="text-[10px] text-gray-400 font-medium mb-0">
                      {formatDateRange(group.startDate, group.endDate).replace(' - ', '-')}
                    </div>
                  </button>
                )
              })}

              {/* Final Review Step */}
              <button
                onClick={() => setActiveLocationIndex(locationGroups.length)}
                className="relative flex flex-col items-center gap-0.5 group z-10 transition-all"
                style={{ flex: 1 }}
              >
                {/* Outer Dot */}
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300
                  ${activeLocationIndex === locationGroups.length
                    ? 'bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/30 scale-110'
                    : activeLocationIndex > locationGroups.length
                    ? 'bg-gradient-to-br from-teal-300 to-teal-500 shadow-sm'
                    : 'bg-white border-2 border-gray-300 group-hover:border-gray-400'
                  }
                `}>
                  {/* Inner Dot with Checkmark */}
                  <div className={`
                    w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all
                    ${activeLocationIndex >= locationGroups.length
                      ? 'bg-white text-teal-600'
                      : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
                    }
                  `}>
                    ✓
                  </div>
                </div>

                {/* Label */}
                <div className={`
                  text-xs font-bold transition-all duration-200
                  ${activeLocationIndex === locationGroups.length ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-800'}
                `}>
                  Review
                </div>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white px-12 py-3 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeLocationIndex < locationGroups.length ? (
                <motion.div
                  key={activeLocationIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-5"
                >
                  {/* Left: Location Card */}
                  <div className="space-y-4">
                    {/* Hero Image */}
                    <div className="relative h-52 rounded-xl overflow-hidden">
                      <Image
                        src={currentLocation.days[0]?.items[0]?.image || '/placeholder-location.jpg'}
                        alt={currentLocation.location}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Location Info */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        Welcome to {formatLocationDisplay(currentLocation.location).main}
                      </h2>
                      <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                        Your adventure begins in the City of Lights! Spend {currentLocation.days.length} magical day{currentLocation.days.length > 1 ? 's' : ''} exploring its history and romance.
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateRange(currentLocation.startDate, currentLocation.endDate)}
                      </p>
                    </div>

                    {/* Activities */}
                    <div className="space-y-2">
                      {highlights.map((activity: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          {activity.image && (
                            <div className="relative w-14 h-14 rounded-md overflow-hidden flex-shrink-0">
                              <Image
                                src={activity.image}
                                alt={activity.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-gray-900 mb-0.5">{activity.title}</h3>
                            <p className="text-xs text-gray-600">
                              Duration: {activity.duration}h, Price: {activity.costEstimate ? `$${activity.costEstimate}` : 'Included'}
                            </p>
                          </div>
                          <button className="px-3 py-1.5 bg-teal-500 text-white rounded-md text-xs font-medium hover:bg-teal-600 transition-colors whitespace-nowrap">
                            + Add to Trip
                          </button>
                        </div>
                      ))}

                      {/* More Experiences */}
                      <button className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center gap-2">
                        More {formatLocationDisplay(currentLocation.location).main} Experiences
                        <span className="text-lg">⋮</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Journey Summary */}
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">My Journey So Far</h3>

                      <div className="space-y-2.5">
                        <div className="text-sm text-gray-700">
                          {plan.stats?.totalDays || plan.days.length} Days ({formatDateRange(plan.days[0]?.date, plan.days[plan.days.length - 1]?.date)})
                        </div>

                        <div className="text-sm text-gray-700">
                          {locationGroups.length} Locations
                        </div>

                        <div className="text-sm text-gray-700">
                          {totalActivities} Activities
                        </div>

                        <div className="text-sm text-gray-700">
                          {totalMeals} Meals
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200">
                          <span className="text-sm font-semibold text-gray-900">Total Estimated Cost:</span>
                          <span className="text-xl font-bold text-teal-600">${totalCost}</span>
                        </div>
                      </div>

                      {/* Location Highlights */}
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                        {locationGroups.map((group: any, idx: number) => {
                          const formatted = formatLocationDisplay(group.location)
                          const locationActivities = group.days.flatMap((day: any) =>
                            day.items.filter((item: any) => item.type === 'activity')
                          )
                          const topActivity = locationActivities[0]

                          return (
                            <div key={idx} className="text-xs leading-relaxed">
                              <span className="font-medium text-gray-900">{formatted.main}:</span>
                              <span className="text-gray-600 ml-1">
                                {topActivity?.title || 'Exploring'}
                                {locationActivities.length > 1 && `, +${locationActivities.length - 1} more`}
                              </span>
                            </div>
                          )
                        })}
                      </div>

                      {/* Next Location Button */}
                      {activeLocationIndex < locationGroups.length - 1 && (
                        <button
                          onClick={() => setActiveLocationIndex(activeLocationIndex + 1)}
                          className="w-full mt-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors"
                        >
                          Proceed to {formatLocationDisplay(locationGroups[activeLocationIndex + 1].location).main}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Final Review Screen */
                <motion.div
                  key="final-review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-8"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Journey Awaits!</h2>
                  <p className="text-sm text-gray-600 mb-6 max-w-2xl mx-auto">
                    You've planned an amazing {plan.stats?.totalDays || plan.days.length}-day adventure across {locationGroups.length} incredible destinations.
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <Calendar className="h-6 w-6 text-teal-500 mx-auto mb-1.5" />
                      <div className="text-xl font-bold text-gray-900">{plan.stats?.totalDays || plan.days.length}</div>
                      <div className="text-xs text-gray-600">Days</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <MapPin className="h-6 w-6 text-teal-500 mx-auto mb-1.5" />
                      <div className="text-xl font-bold text-gray-900">{locationGroups.length}</div>
                      <div className="text-xs text-gray-600">Locations</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <Compass className="h-6 w-6 text-teal-500 mx-auto mb-1.5" />
                      <div className="text-xl font-bold text-gray-900">{totalActivities}</div>
                      <div className="text-xs text-gray-600">Activities</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <DollarSign className="h-6 w-6 text-teal-500 mx-auto mb-1.5" />
                      <div className="text-xl font-bold text-gray-900">${totalCost}</div>
                      <div className="text-xs text-gray-600">Total Cost</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-6">Ready to embark on your adventure?</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="bg-white border-t border-gray-200 px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                Share
              </button>
              <button className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                Export plan
              </button>
            </div>
            <button className="px-5 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors shadow-lg">
              Save Trip
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}