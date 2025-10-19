/**
 * Progressive POI Loading Hook
 * 
 * Loads POIs in 3 stages for optimal UX:
 * 1. Cached POIs (instant) - Show immediately
 * 2. Enhanced POIs (2-3s) - Fetch from external APIs
 * 3. Validated POIs (5-8s) - GROQ validation (optional)
 */

import { useState, useEffect } from 'react'
import { isFeatureEnabled } from '@/lib/featureFlags'

export interface POI {
  name: string
  category: string
  description?: string
  coordinates?: { lat: number; lng: number }
  relevanceScore?: number
}

export interface ProgressiveData<T> {
  immediate: T[]
  enhanced: T[]
  validated: T[]
  loading: boolean
  progress: number // 0-100
  stage: 'idle' | 'cached' | 'enhanced' | 'validated' | 'complete'
  error?: string
}

export interface UseProgressivePOIsOptions {
  locations: string[]
  travelType?: string
  budget?: string
  enableValidation?: boolean
  onProgress?: (progress: number, stage: string) => void
}

export function useProgressivePOIs(options: UseProgressivePOIsOptions) {
  const { locations, travelType = 'city-break', budget = 'moderate', enableValidation = false, onProgress } = options

  const [data, setData] = useState<ProgressiveData<POI>>({
    immediate: [],
    enhanced: [],
    validated: [],
    loading: true,
    progress: 0,
    stage: 'idle'
  })

  useEffect(() => {
    // Only run if progressive loading is enabled
    if (!isFeatureEnabled('PROGRESSIVE_LOADING')) {
      // Fallback: Load all at once
      loadAllAtOnce()
      return
    }

    // Progressive loading
    loadProgressively()
  }, [locations.join(','), travelType, budget])

  const loadAllAtOnce = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, progress: 0, stage: 'enhanced' }))

      const response = await fetch('/api/pois/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations, travelType, budget })
      })

      if (!response.ok) throw new Error('Failed to fetch POIs')

      const result = await response.json()

      setData({
        immediate: [],
        enhanced: result.pois || [],
        validated: [],
        loading: false,
        progress: 100,
        stage: 'complete'
      })

      onProgress?.(100, 'complete')
    } catch (error) {
      console.error('Error loading POIs:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  const loadProgressively = async () => {
    try {
      // STAGE 1: Load cached POIs (instant)
      setData(prev => ({ ...prev, loading: true, progress: 10, stage: 'cached' }))
      onProgress?.(10, 'cached')

      const cachedResponse = await fetch('/api/pois/cached', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations })
      })

      if (cachedResponse.ok) {
        const cachedResult = await cachedResponse.json()
        setData(prev => ({
          ...prev,
          immediate: cachedResult.pois || [],
          progress: 33,
          stage: 'cached'
        }))
        onProgress?.(33, 'cached')
      }

      // STAGE 2: Fetch enhanced POIs (2-3s)
      setData(prev => ({ ...prev, progress: 40, stage: 'enhanced' }))
      onProgress?.(40, 'enhanced')

      const enhancedResponse = await fetch('/api/pois/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations, travelType, budget })
      })

      if (enhancedResponse.ok) {
        const enhancedResult = await enhancedResponse.json()
        setData(prev => ({
          ...prev,
          enhanced: enhancedResult.pois || [],
          progress: 66,
          stage: 'enhanced'
        }))
        onProgress?.(66, 'enhanced')
      }

      // STAGE 3: GROQ validation (optional, 5-8s)
      if (enableValidation && isFeatureEnabled('GROQ_POI_VALIDATION')) {
        setData(prev => ({ ...prev, progress: 70, stage: 'validated' }))
        onProgress?.(70, 'validated')

        const allPOIs = [...data.immediate, ...data.enhanced]
        
        if (allPOIs.length > 0) {
          const validatedResponse = await fetch('/api/pois/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pois: allPOIs,
              tripContext: {
                from: locations[0],
                to: locations[locations.length - 1],
                travelType,
                budget
              }
            })
          })

          if (validatedResponse.ok) {
            const validatedResult = await validatedResponse.json()
            setData(prev => ({
              ...prev,
              validated: validatedResult.pois || [],
              progress: 100,
              stage: 'validated'
            }))
            onProgress?.(100, 'validated')
          }
        }
      }

      // Complete
      setData(prev => ({
        ...prev,
        loading: false,
        progress: 100,
        stage: 'complete'
      }))
      onProgress?.(100, 'complete')
    } catch (error) {
      console.error('Error in progressive loading:', error)
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  // Combine all POIs with deduplication
  const allPOIs = [
    ...data.immediate,
    ...data.enhanced.filter(e => !data.immediate.some(i => i.name === e.name)),
    ...data.validated.filter(v => 
      !data.immediate.some(i => i.name === v.name) &&
      !data.enhanced.some(e => e.name === v.name)
    )
  ]

  return {
    ...data,
    allPOIs,
    cachedCount: data.immediate.length,
    enhancedCount: data.enhanced.length,
    validatedCount: data.validated.length,
    totalCount: allPOIs.length
  }
}

