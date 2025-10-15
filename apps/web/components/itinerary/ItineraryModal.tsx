'use client'

/**
 * Modern Trip Planning Modal - Timeline Design
 * Based on the European Adventure design with location tabs and journey summary
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Calendar, DollarSign, Utensils, Compass, Plus, Share2, Download, Save, PlaneTakeoff } from 'lucide-react'
import { formatLocationDisplay } from '@/lib/utils/locationFormatter'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { SignUpPrompt } from '@/components/auth/SignUpPrompt'
import { useRouter } from 'next/navigation'
import { AddStopModal } from './AddStopModal'
import { LocationMiniMap } from './LocationMiniMap'
import { TripOverviewMap } from './TripOverviewMap'

interface planModalProps {
  plan: any
  locationImages?: Record<string, string>
  transportMode?: string
  proMode?: boolean
  totalDistance?: number
  locationCoordinates?: Record<string, { latitude: number; longitude: number }>
  onClose: () => void
}

export function planModal({
  plan,
  locationImages: propLocationImages,
  transportMode = 'car',
  proMode = false,
  totalDistance,
  locationCoordinates,
  onClose
}: planModalProps) {
  const [activeLocationIndex, setActiveLocationIndex] = useState(0)
  const [addedActivities, setAddedActivities] = useState<Set<string>>(new Set())
  const [loadingMore, setLoadingMore] = useState(false)
  const [moreExperiences, setMoreExperiences] = useState<any[]>([])
  const [showMoreExperiences, setShowMoreExperiences] = useState(false)
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false)
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [showAddStopModal, setShowAddStopModal] = useState(false)
  const [addStopBetween, setAddStopBetween] = useState<{ from: string; to: string; fromIndex: number } | null>(null)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  // Helper function to find location image with flexible matching
  const getLocationImage = (locationName: string): string => {
    if (!propLocationImages) return '/placeholder-location.jpg'

    // Try exact match first
    if (propLocationImages[locationName]) {
      return propLocationImages[locationName]
    }

    // Try matching by first part (e.g., "New Jersey" matches "New Jersey, USA")
    const mainLocation = locationName.split(',')[0].trim()
    for (const [key, value] of Object.entries(propLocationImages)) {
      if (key.startsWith(mainLocation) || mainLocation.startsWith(key.split(',')[0].trim())) {
        return value
      }
    }

    return '/placeholder-location.jpg'
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Handle adding a stop between locations
  const handleAddStop = async (stopLocation: string) => {
    if (!addStopBetween) return

    // TODO: Implement regenerating itinerary with new stop
    // This would call the AI service to regenerate the plan with the new stop inserted
    console.log('Adding stop:', stopLocation, 'between', addStopBetween.from, 'and', addStopBetween.to)

    // For now, just show an alert
    alert(`Feature coming soon! Will add ${stopLocation} between ${addStopBetween.from} and ${addStopBetween.to}`)
  }

  // Group days by location (skip travel days for grouping) and extract travel distances
  const locationGroups = plan.days.reduce((groups: any[], day: any) => {
    // Skip travel days - they don't represent a location stay
    if (day.type === 'travel') {
      return groups
    }

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

  // Extract distances between locations from travel days
  const travelDistances: Record<string, { km: number; miles: number }> = {}
  plan.days.forEach((day: any, index: number) => {
    if (day.type === 'travel') {
      const travelItem = day.items.find((item: any) => item.type === 'travel')
      if (travelItem && travelItem.distance) {
        // Parse distance (e.g., "450km" or "450")
        const distanceKm = typeof travelItem.distance === 'string'
          ? parseFloat(travelItem.distance.replace(/[^\d.]/g, ''))
          : travelItem.distance

        const distanceMiles = Math.round(distanceKm * 0.621371)

        // Find the previous and next location groups
        const prevDay = plan.days.slice(0, index).reverse().find((d: any) => d.type !== 'travel')
        const nextDay = plan.days.slice(index + 1).find((d: any) => d.type !== 'travel')

        if (prevDay && nextDay) {
          const key = `${prevDay.location}-${nextDay.location}`
          travelDistances[key] = { km: distanceKm, miles: distanceMiles }
        }
      }
    }
  })



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

  // Add activity to trip
  const handleAddToTrip = (activity: any) => {
    const activityId = `${activity.title}-${activity.time}`
    setAddedActivities(prev => new Set(prev).add(activityId))
    // TODO: Implement actual trip saving to database
    console.log('Added to trip:', activity)
  }

  // Check if activity is added
  const isActivityAdded = (activity: any) => {
    const activityId = `${activity.title}-${activity.time}`
    return addedActivities.has(activityId)
  }

  // Load more experiences from Groq AI
  const handleLoadMoreExperiences = async () => {
    if (loadingMore || !currentLocation) return

    setLoadingMore(true)
    try {
      const existingActivities = currentLocation.days.flatMap((day: any) =>
        day.items.filter((item: any) => item.type === 'activity').map((item: any) => item.title)
      )

      const response = await fetch('/api/itineraries/more-experiences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: currentLocation.location,
          interests: plan.interests || [],
          budget: plan.budget || 'moderate',
          existingActivities
        })
      })

      const data = await response.json()
      if (data.success && data.data) {
        setMoreExperiences(data.data)
        setShowMoreExperiences(true)
      } else {
        console.error('Failed to load more experiences:', data.error)
      }
    } catch (error) {
      console.error('Error loading more experiences:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Export as PDF
  const handleExportPDF = async () => {
    try {
      const response = await fetch('/api/itineraries/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${plan.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
    }
  }

  // Create trip - requires authentication
  const handleCreateTrip = async () => {
    if (!isAuthenticated) {
      setShowSignUpPrompt(true)
      return
    }

    // TODO: Implement trip creation in Supabase
    console.log('Creating trip:', plan)
    router.push('/dashboard/trips/new')
  }

  // Plan another trip
  const handlePlanAnother = () => {
    onClose()
    // Scroll to top of page where the planner is
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
          <div className="bg-gradient-to-br from-gray-50 to-white px-12 pt-6 pb-5 border-b border-gray-200">
            {/* Title and Meta Info */}
            <div className="mb-5 pr-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.title}
              </h1>

              {/* Distance and Transport Mode */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {totalDistance && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    <span>{Math.round(totalDistance)} km · {Math.round(totalDistance * 0.621371)} mi</span>
                  </div>
                )}

                {transportMode && (
                  <div className="flex items-center gap-1.5">
                    {transportMode === 'car' && '🚗'}
                    {transportMode === 'train' && '🚂'}
                    {transportMode === 'bike' && '🚴'}
                    {transportMode === 'flight' && '✈️'}
                    {transportMode === 'mixed' && '🔀'}
                    <span className="capitalize">{transportMode}</span>
                  </div>
                )}

                {proMode && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">
                    <span>✨ Pro Mode</span>
                  </div>
                )}
              </div>
            </div>

            {/* Minimal Dot Timeline */}
            <div className="relative flex items-center justify-between max-w-5xl mx-auto">
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

              {/* Distance labels and hover-sensitive segments between locations */}
              {locationGroups.map((group: any, segmentIndex: number) => {
                if (segmentIndex >= locationGroups.length - 1) return null

                const totalSegments = locationGroups.length - 1
                const segmentWidth = 100 / totalSegments
                const leftPosition = (segmentIndex * segmentWidth) + (segmentWidth / 2)

                // Get distance for this segment
                const fromLocation = locationGroups[segmentIndex].location
                const toLocation = locationGroups[segmentIndex + 1].location
                const distanceKey = `${fromLocation}-${toLocation}`
                const distance = travelDistances[distanceKey]

                return (
                  <div
                    key={`segment-${segmentIndex}`}
                    className="absolute"
                    style={{
                      left: `${leftPosition}%`,
                      top: '14px', // Align with the line (top-3.5 = 14px)
                      transform: 'translate(-50%, -50%)',
                      zIndex: 20
                    }}
                  >
                    {/* Distance Label - always visible */}
                    {distance && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <div className="text-[10px] font-medium text-gray-500 bg-white/90 px-1.5 py-0.5 rounded">
                          {distance.km}km · {distance.miles}mi
                        </div>
                      </div>
                    )}

                    {/* Hover area for Add Stop button */}
                    <div
                      className="w-8 h-8 flex items-center justify-center"
                      onMouseEnter={() => setHoveredSegment(segmentIndex)}
                      onMouseLeave={() => setHoveredSegment(null)}
                    >
                      {/* "+" Button - appears on hover - 24x24px */}
                      <AnimatePresence>
                        {hoveredSegment === segmentIndex && (
                          <motion.button
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.15, ease: 'easeOut' }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setAddStopBetween({
                                from: locationGroups[segmentIndex].location,
                                to: locationGroups[segmentIndex + 1].location,
                                fromIndex: segmentIndex
                              })
                              setShowAddStopModal(true)
                            }}
                            className="w-6 h-6 rounded-full bg-white border-2 border-teal-400 hover:border-teal-500 hover:bg-teal-50 flex items-center justify-center shadow-lg transition-colors duration-200 hover:shadow-xl"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.95 }}
                            title="Add stop between locations"
                          >
                            <Plus className="h-3 w-3 text-teal-500" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )
              })}

              {/* Location Steps */}
              {locationGroups.map((group: any, index: number) => {
                const formatted = formatLocationDisplay(group.location)
                const isActive = index === activeLocationIndex
                const isPast = index < activeLocationIndex

                return (
                  <button
                    key={index}
                    onClick={() => setActiveLocationIndex(index)}
                    className="relative flex flex-col items-center gap-1.5 group z-10 transition-all"
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
                    <div className="text-[10px] text-gray-400 font-medium">
                      {formatDateRange(group.startDate, group.endDate).replace(' - ', '-')}
                    </div>
                  </button>
                )
              })}

              {/* Final Review Step */}
              <button
                onClick={() => setActiveLocationIndex(locationGroups.length)}
                className="relative flex flex-col items-center gap-1.5 group z-10 transition-all"
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
          <div className="bg-white px-12 py-8 flex-1 overflow-y-auto">
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
                        src={getLocationImage(currentLocation.location)}
                        alt={currentLocation.location}
                        fill
                        className="object-cover"
                        unoptimized
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

                    {/* Location Mini Map */}
                    {locationCoordinates && locationCoordinates[currentLocation.location] && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal-500" />
                          Location Map
                        </h3>
                        <LocationMiniMap
                          locationName={currentLocation.location}
                          latitude={locationCoordinates[currentLocation.location].latitude}
                          longitude={locationCoordinates[currentLocation.location].longitude}
                          className="h-48 w-full"
                        />
                      </div>
                    )}

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
                          <button
                            onClick={() => handleAddToTrip(activity)}
                            disabled={isActivityAdded(activity)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                              isActivityAdded(activity)
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-teal-500 text-white hover:bg-teal-600'
                            }`}
                          >
                            {isActivityAdded(activity) ? '✓ Added' : '+ Add to Trip'}
                          </button>
                        </div>
                      ))}

                      {/* More Experiences */}
                      <button
                        onClick={handleLoadMoreExperiences}
                        disabled={loadingMore}
                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {loadingMore ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Loading...
                          </>
                        ) : (
                          <>
                            More {formatLocationDisplay(currentLocation.location).main} Experiences
                            <span className="text-lg">⋮</span>
                          </>
                        )}
                      </button>

                      {/* Show More Experiences */}
                      {showMoreExperiences && moreExperiences.length > 0 && (
                        <div className="mt-4 space-y-2 border-t pt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">✨ More Experiences</h4>
                          {moreExperiences.map((activity: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-gray-900 mb-0.5">{activity.title}</h3>
                                <p className="text-xs text-gray-600 mb-1">{activity.description}</p>
                                <p className="text-xs text-gray-600">
                                  Duration: {activity.duration}h, Price: ${activity.costEstimate || 0}
                                </p>
                              </div>
                              <button
                                onClick={() => handleAddToTrip(activity)}
                                disabled={isActivityAdded(activity)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                                  isActivityAdded(activity)
                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                    : 'bg-teal-500 text-white hover:bg-teal-600'
                                }`}
                              >
                                {isActivityAdded(activity) ? '✓ Added' : '+ Add'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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
                  className="py-8"
                >
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Journey Awaits!</h2>
                    <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                      You've planned an amazing {plan.stats?.totalDays || plan.days.length}-day adventure across {locationGroups.length} incredible destinations.
                    </p>
                  </div>

                  {/* Location Images Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    {locationGroups.map((group: any, index: number) => (
                      <div key={index} className="relative group cursor-pointer" onClick={() => setActiveLocationIndex(index)}>
                        <div className="relative h-40 rounded-xl overflow-hidden">
                          <Image
                            src={getLocationImage(group.location)}
                            alt={group.location}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-3">
                            <h3 className="text-white font-semibold text-sm mb-0.5">
                              {formatLocationDisplay(group.location).main}
                            </h3>
                            <p className="text-white/90 text-xs">
                              {formatDateRange(group.startDate, group.endDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stats Grid */}
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

                  {/* Trip Overview Map */}
                  {locationCoordinates && locationGroups.length > 1 && (
                    <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 mb-8 max-w-3xl mx-auto">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        Your Trip Route
                      </h3>
                      <TripOverviewMap
                        locations={locationGroups
                          .filter((group: any) => locationCoordinates[group.location])
                          .map((group: any) => ({
                            name: group.location,
                            latitude: locationCoordinates[group.location].latitude,
                            longitude: locationCoordinates[group.location].longitude
                          }))}
                        className="h-96 w-full"
                      />
                    </div>
                  )}

                  {/* Fallback: Simple route visualization if no coordinates */}
                  {(!locationCoordinates || Object.keys(locationCoordinates).length === 0) && locationGroups.length > 1 && (
                    <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl p-6 mb-8 max-w-3xl mx-auto">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-teal-600" />
                        Your Route
                      </h3>
                      <div className="relative">
                        {/* Simple route line with dots */}
                        <div className="flex items-center justify-between">
                          {locationGroups.map((group: any, index: number) => (
                            <div key={index} className="flex items-center" style={{ flex: 1 }}>
                              {/* Location dot */}
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-teal-500 border-2 border-white shadow-md" />
                                <div className="text-xs font-medium text-gray-700 mt-2 text-center max-w-[80px]">
                                  {formatLocationDisplay(group.location).main}
                                </div>
                              </div>
                              {/* Connecting line */}
                              {index < locationGroups.length - 1 && (
                                <div className="flex-1 h-0.5 bg-gradient-to-r from-teal-400 to-teal-500 mx-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <p className="text-sm text-gray-600 text-center">Ready to embark on your adventure?</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="bg-white border-t border-gray-200 px-12 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: plan.title,
                      text: plan.summary,
                      url: window.location.href
                    })
                  } else {
                    navigator.clipboard.writeText(window.location.href)
                    alert('Link copied to clipboard!')
                  }
                }}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-1"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                onClick={handleExportPDF}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export Plan
              </button>
              <button
                onClick={handlePlanAnother}
                className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors flex items-center gap-1"
              >
                <PlaneTakeoff className="h-4 w-4" />
                Plan Another Trip
              </button>
            </div>
            <button
              onClick={handleCreateTrip}
              className="px-5 py-2 bg-teal-500 text-white rounded-lg text-sm font-semibold hover:bg-teal-600 transition-colors shadow-lg flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isAuthenticated ? 'Create Trip' : 'Sign Up to Save'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Sign Up Prompt Modal */}
      <AnimatePresence>
        {showSignUpPrompt && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={() => setShowSignUpPrompt(false)}
            />

            {/* Sign Up Prompt */}
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowSignUpPrompt(false)}
                  className="absolute -top-2 -right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-600" />
                </button>
                <SignUpPrompt context="interaction" trigger="save trip" />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Add Stop Modal */}
      {addStopBetween && (
        <AddStopModal
          isOpen={showAddStopModal}
          onClose={() => {
            setShowAddStopModal(false)
            setAddStopBetween(null)
          }}
          fromLocation={addStopBetween.from}
          toLocation={addStopBetween.to}
          onAddStop={handleAddStop}
        />
      )}
    </>
  )
}