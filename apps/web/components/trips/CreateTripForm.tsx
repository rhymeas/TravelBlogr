'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { DateRangePicker } from '@/components/itinerary/DateRangePicker'
import { MapPin, Loader2, Sparkles, Wand2, ArrowRight, Users, Globe, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { getBrowserSupabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { nanoid } from 'nanoid'

interface CreateTripFormProps {
  onSuccess?: (trip: any) => void
  onCancel?: () => void
}

export function CreateTripForm({ onSuccess, onCancel }: CreateTripFormProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState<'title' | 'description' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date } | null>(null)
  const [isPublic, setIsPublic] = useState(true) // Default to public

  const generateAITitle = async () => {
    if (!dateRange) {
      toast.error('Please select dates first')
      return
    }

    setAiLoading('title')
    try {
      const response = await fetch('/api/ai/generate-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
          description
        })
      })

      const data = await response.json()
      if (data.title) {
        setTitle(data.title)
        toast.success('AI generated title!')
      }
    } catch (error) {
      toast.error('Failed to generate title')
    } finally {
      setAiLoading(null)
    }
  }

  const generateAIDescription = async () => {
    if (!title) {
      toast.error('Please enter a title first')
      return
    }

    setAiLoading('description')
    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          startDate: dateRange?.startDate.toISOString(),
          endDate: dateRange?.endDate.toISOString()
        })
      })

      const data = await response.json()
      if (data.description) {
        setDescription(data.description)
        toast.success('AI generated description!')
      }
    } catch (error) {
      toast.error('Failed to generate description')
    } finally {
      setAiLoading(null)
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      setError('Please enter a trip title')
      return
    }

    if (!user) {
      setError('You must be logged in to create a trip')
      toast.error('Please sign in to create a trip')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = getBrowserSupabase()

      // Generate slug from title
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + nanoid(8)

      // Create trip directly in Supabase (client-side)
      const { data: trip, error: createError } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          slug,
          status: isPublic ? 'published' : 'draft',
          start_date: dateRange?.startDate.toISOString().split('T')[0] || null,
          end_date: dateRange?.endDate.toISOString().split('T')[0] || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating trip:', createError)
        throw new Error(createError.message || 'Failed to create trip')
      }

      // Initialize trip stats for view tracking (fire and forget)
      const statsResult = await supabase
        .from('trip_stats')
        .insert({
          trip_id: trip.id,
          total_views: 0,
          unique_views: 0,
          updated_at: new Date().toISOString()
        })

      // Handle stats initialization result
      if (statsResult.error) {
        console.warn('⚠️ Failed to initialize trip stats (non-critical):', statsResult.error)
      } else {
        console.log('✅ Trip stats initialized')
      }

      toast.success('Trip created successfully!')

      if (onSuccess) {
        onSuccess(trip)
      } else {
        // Redirect to manual trip editor (V2 Results template)
        router.push(`/dashboard/trips/${trip.id}/edit`)
      }

    } catch (error) {
      console.error('Error creating trip:', error)
      setError(error instanceof Error ? error.message : 'Failed to create trip')
      toast.error(error instanceof Error ? error.message : 'Failed to create trip')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Create your trip</h1>
      </div>

      {/* AI Itinerary Banner - Slim */}
      <div className="bg-gradient-to-r from-rausch-500 to-kazan-500 rounded-2xl p-4 text-white mb-3 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Sparkles className="h-5 w-5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold">Want AI to plan your entire trip?</h3>
              <p className="text-white/90 text-xs">
                Get a complete day-by-day itinerary with activities, restaurants, and travel times.
              </p>
            </div>
          </div>
          <Link href="/plan">
            <Button
              variant="outline"
              className="bg-white text-rausch-500 hover:bg-white/90 border-0 font-medium text-sm px-4 py-2 h-auto flex-shrink-0"
            >
              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
              Use AI Planner
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Form - Separated Sections (matching /plan layout) */}
      <div className="space-y-3 mb-6 pb-24">
        {/* Section 1: Dates */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="text-base font-semibold mb-3">When are you traveling?</h3>
          <DateRangePicker
            startDate={dateRange?.startDate}
            endDate={dateRange?.endDate}
            onSelect={setDateRange}
          />
        </div>

        {/* Section 2: Trip Details */}
        <div className="bg-white rounded-2xl shadow-sm border p-5">
          <h3 className="text-base font-semibold mb-4">Trip details</h3>

          <div className="space-y-4">
            {/* Title with AI Help */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">Trip title *</Label>
                <button
                  type="button"
                  onClick={generateAITitle}
                  disabled={aiLoading === 'title' || !dateRange}
                  className="text-xs font-medium text-rausch-500 hover:text-rausch-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {aiLoading === 'title' ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      AI suggest
                    </>
                  )}
                </button>
              </div>
              <Input
                placeholder="e.g., Summer Adventure in Japan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-gray-300 focus:border-black focus:ring-black"
              />
            </div>

            {/* Description with AI Help */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">Description (optional)</Label>
                <button
                  type="button"
                  onClick={generateAIDescription}
                  disabled={aiLoading === 'description' || !title}
                  className="text-xs font-medium text-rausch-500 hover:text-rausch-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {aiLoading === 'description' ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3" />
                      AI suggest
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="Tell us about your trip... or let AI write it for you!"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
              />
            </div>

            {/* Privacy Setting */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Privacy</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    isPublic
                      ? 'border-rausch-500 bg-rausch-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Globe className={`h-5 w-5 ${isPublic ? 'text-rausch-500' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className={`text-sm font-medium ${isPublic ? 'text-rausch-700' : 'text-gray-900'}`}>
                      Public
                    </div>
                    <div className="text-xs text-gray-500">
                      Anyone can view
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    !isPublic
                      ? 'border-rausch-500 bg-rausch-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Lock className={`h-5 w-5 ${!isPublic ? 'text-rausch-500' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className={`text-sm font-medium ${!isPublic ? 'text-rausch-700' : 'text-gray-900'}`}>
                      Private
                    </div>
                    <div className="text-xs text-gray-500">
                      Only you, family & friends can view
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Info Box */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 rounded-lg p-2 flex-shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                Audience-Specific Sharing
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                After creating your trip, you'll get unique share links for <strong>family</strong>, <strong>friends</strong>,
                and <strong>professional</strong> networks - each showing different content and privacy levels.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating CTA (matching /plan style exactly) */}
      <div className="fixed left-0 right-0 z-40 px-6 pointer-events-none" style={{ bottom: '24px' }}>
        <div className="max-w-[800px] mx-auto">
          <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-200 py-4 pl-6 pr-6 pointer-events-auto flex items-center justify-between gap-4">
            {/* Secondary Gray CTA */}
            {onCancel ? (
              <Button
                onClick={onCancel}
                variant="outline"
                disabled={isLoading}
                className="px-6 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 rounded-xl font-medium"
              >
                Cancel
              </Button>
            ) : (
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                variant="outline"
                className="px-6 py-3 text-gray-700 border-gray-300 hover:bg-gray-50 rounded-xl font-medium"
              >
                Back to Top
              </Button>
            )}

            {/* Primary Red CTA */}
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !title.trim()}
              className="bg-rausch-500 hover:bg-rausch-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-6 rounded-xl text-base font-semibold shadow-lg hover:shadow-xl disabled:shadow-none transition-all"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating trip...
                </span>
              ) : (
                'Start planning trip'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
