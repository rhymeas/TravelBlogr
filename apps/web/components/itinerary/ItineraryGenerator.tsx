'use client'

/**
 * Minimalist Airbnb-style plan Generator
 */

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { LocationInput } from './LocationInput'
import { DateRangePicker } from './DateRangePicker'
import { TravelTimeSlider } from './TravelTimeSlider'
import { planModal as PlanModal } from './ItineraryModal'
import { RoutePreview } from './RoutePreview'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function ItineraryGenerator() {
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [ctaBottomOffset, setCtaBottomOffset] = useState(24) // 24px = bottom-6
  const [resolvedLocations, setResolvedLocations] = useState<any[]>([])
  const [locationImages, setLocationImages] = useState<Record<string, string>>({})

  // Multi-location state with resolved names
  const [locations, setLocations] = useState([
    { id: '1', value: '', resolvedName: '' },
    { id: '2', value: '', resolvedName: '' }
  ])

  // Date range state
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null)

  // Travel time preference (optional)
  const [showTravelPace, setShowTravelPace] = useState(false)
  const [travelHoursPerDay, setTravelHoursPerDay] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    interests: 'art, food, history',
    budget: 'moderate'
  })

  // Check if form is valid
  const isFormValid = () => {
    const filledLocations = locations.filter(loc => loc.value.trim())
    return filledLocations.length >= 2 && dateRange !== null
  }

  // Adjust CTA position to stay above footer
  useEffect(() => {
    const handleScroll = () => {
      // Find the footer element in the DOM (from root layout)
      const footer = document.querySelector('footer')
      if (footer) {
        const footerRect = footer.getBoundingClientRect()
        const windowHeight = window.innerHeight

        // Calculate how much the footer overlaps with the viewport
        const footerOverlap = windowHeight - footerRect.top

        if (footerOverlap > 0) {
          // Footer is visible, push CTA up by the overlap amount plus padding
          setCtaBottomOffset(footerOverlap + 24)
        } else {
          // Footer not visible, use default position
          setCtaBottomOffset(24)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)
    handleScroll() // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  const handleGenerate = async () => {
    // Validation
    const filledLocations = locations.filter(loc => loc.value.trim())
    if (filledLocations.length < 2) {
      setError('Please enter at least a starting location and destination')
      return
    }

    if (!dateRange) {
      setError('Please select travel dates')
      return
    }

    setLoading(true)
    setError(null)
    setPlan(null)

    try {
      // Send all locations including stops
      const from = filledLocations[0].value
      const to = filledLocations[filledLocations.length - 1].value
      const stops = filledLocations.slice(1, -1).map(loc => loc.value) // Middle locations

      const requestBody: any = {
        from,
        to,
        stops, // Include all middle stops
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0],
        interests: formData.interests.split(',').map(i => i.trim()),
        budget: formData.budget
      }

      // Only include travel pace if user specified it
      if (travelHoursPerDay !== null) {
        requestBody.maxTravelHoursPerDay = travelHoursPerDay
      }

      const response = await fetch('/api/itineraries/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (data.success) {
        setPlan(data.data)
        setResolvedLocations(data.resolvedLocations || [])
        setLocationImages(data.locationImages || {})
      } else {
        // Show helpful error message
        let errorMsg = data.error || 'Failed to generate plan'
        if (errorMsg.includes('not found')) {
          errorMsg += '. Please use the autocomplete dropdown to select a valid location.'
        }
        setError(errorMsg)
      }
    } catch (err) {
      console.error('Error generating plan:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header - Compact */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Plan your trip</h1>
      </div>

      {/* Error Message - Above form */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form - Separated Sections */}
      <div className="space-y-3 mb-6 pb-24">
        {/* Where to? */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="text-base font-semibold mb-3">Where to?</h3>
          <LocationInput
            locations={locations}
            onChange={setLocations}
          />

          {/* Show route preview if we have resolved locations */}
          {resolvedLocations.length > 0 && (
            <div className="mt-4">
              <RoutePreview locations={resolvedLocations} />
            </div>
          )}
        </div>

        {/* Compact 2-Row Layout: Dates, Interests, Budget, Travel Pace */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          {/* Row 1: Dates + Interests */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="mb-2 block text-sm font-medium text-gray-700">Dates</Label>
              <DateRangePicker
                startDate={dateRange?.startDate}
                endDate={dateRange?.endDate}
                onSelect={setDateRange}
              />
            </div>
            <div>
              <Label htmlFor="interests" className="mb-2 block text-sm font-medium text-gray-700">Interests</Label>
              <Input
                id="interests"
                placeholder="art, food, history"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                className="border-gray-300 focus:border-black focus:ring-black"
              />
            </div>
          </div>

          {/* Row 2: Budget + Travel Pace */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="budget" className="mb-2 block text-sm font-medium text-gray-700">Budget</Label>
              <select
                id="budget"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              >
                <option value="budget">Budget-friendly</option>
                <option value="moderate">Moderate</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">Travel pace</Label>
                <button
                  type="button"
                  onClick={() => setShowTravelPace(!showTravelPace)}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {showTravelPace ? 'Hide' : 'Optional'}
                  {showTravelPace ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                </button>
              </div>
              {showTravelPace ? (
                <TravelTimeSlider
                  value={travelHoursPerDay || 5}
                  onChange={setTravelHoursPerDay}
                />
              ) : (
                <div className="px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500">
                  Click "Optional" to set
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Sticky CTA Button */}
      <div
        className="fixed left-0 right-0 z-40 px-6 pointer-events-none transition-all duration-300 ease-out"
        style={{ bottom: `${ctaBottomOffset}px` }}
      >
        <div className="max-w-[800px] mx-auto">
          <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-200 py-4 pl-6 pr-6 pointer-events-auto flex items-center justify-between gap-4">
            {/* Secondary Gray CTA */}
            <Button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              variant="outline"
              className="px-6 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 rounded-xl font-medium"
            >
              Back to Top
            </Button>

            {/* Primary Red CTA */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !isFormValid()}
              className="bg-rausch-500 hover:bg-rausch-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating your plan...
                </span>
              ) : (
                'Generate plan'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Modal - Modern Timeline Design */}
      {plan && (
        <PlanModal
          plan={plan}
          locationImages={locationImages}
          onClose={() => setPlan(null)}
        />
      )}
    </div>
  )
}

