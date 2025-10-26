'use client'

/**
 * Manual Trip Editor
 * 
 * Reuses the V2 Results template for manual trip creation/editing.
 * Provides the same auto-fetch capabilities and MapLibre mapping.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ResultsView } from '@/components/trip-planner-v2/ResultsView'
import { getBrowserSupabase } from '@/lib/supabase'
import { Loader2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface ManualTripEditorProps {
  trip: any
}

export function ManualTripEditor({ trip }: ManualTripEditorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [plan, setPlan] = useState<any>(null)
  const [tripData, setTripData] = useState<any>(null)
  const [locationImages, setLocationImages] = useState<Record<string, { featured: string; gallery: string[] }>>({})

  useEffect(() => {
    initializeEmptyPlan()
  }, [trip])

  const initializeEmptyPlan = async () => {
    try {
      // Create empty plan structure matching V2 Results format
      const emptyPlan = {
        title: trip.title || 'Untitled Trip',
        summary: trip.description || '',
        days: trip.location_data?.days || [
          {
            day: 1,
            location: 'Add your first destination',
            locationMetadata: null,
            schedule: [],
            stops: [],
            duration: null,
            distance: null
          }
        ],
        stats: {
          totalDays: trip.location_data?.days?.length || 1,
          totalDistance: 0,
          totalActivities: 0
        }
      }

      // Create trip data structure
      const emptyTripData = {
        destinations: [],
        dateRange: trip.start_date && trip.end_date ? {
          startDate: new Date(trip.start_date),
          endDate: new Date(trip.end_date)
        } : null,
        tripType: 'road-trip',
        travelStyle: 'balanced',
        budget: 'moderate',
        pace: 'moderate',
        interests: []
      }

      setPlan(emptyPlan)
      setTripData(emptyTripData)
      setIsLoading(false)
    } catch (error) {
      console.error('Error initializing plan:', error)
      toast.error('Failed to initialize trip editor')
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    // This is already the edit view, so we don't need to do anything
    toast('You are already in edit mode', { icon: 'ℹ️' })
  }

  const handleSave = async (updatedPlan: any) => {
    try {
      const supabase = getBrowserSupabase()

      // Save updated plan to database
      const { error } = await supabase
        .from('trips')
        .update({
          title: updatedPlan.title,
          description: updatedPlan.summary,
          location_data: {
            days: updatedPlan.days,
            stats: updatedPlan.stats
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', trip.id)

      if (error) throw error

      toast.success('Trip saved successfully!')
    } catch (error) {
      console.error('Error saving trip:', error)
      toast.error('Failed to save trip')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-rausch-500 mx-auto mb-4" />
          <p className="text-gray-600">Initializing trip editor...</p>
        </div>
      </div>
    )
  }

  if (!plan || !tripData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load trip editor</p>
          <Link
            href="/dashboard/trips"
            className="text-rausch-500 hover:text-rausch-600 font-medium"
          >
            ← Back to trips
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/trips"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Edit Trip</h1>
                <p className="text-sm text-gray-500">Manual trip editor</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results View (V2 Template) */}
      <ResultsView
        plan={plan}
        tripData={tripData}
        locationImages={locationImages}
        structuredContext={null}
        groqHeadline={trip.title}
        groqSubtitle={trip.description}
        generationMode="standard"
        onEdit={handleEdit}
      />
    </div>
  )
}

