'use client'

/**
 * Results View Component
 * Displays the generated trip plan using the modal design from experiment file
 * Transforms V1 API data into the results layout format
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { Calendar, Car, MapPin, Clock, Hotel, Camera, Coffee, Edit, Utensils, Navigation, DollarSign, TrendingUp, Info, ExternalLink, Save, ChevronDown, ChevronUp, X, ArrowUp, StickyNote, CheckSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { InlineEdit } from '@/components/ui/InlineEdit'
import type { TripPlanData } from './types'
import { generateBookingLink, generateGetYourGuideLink, trackAffiliateClick, type AffiliateParams } from '@/lib/utils/affiliateLinks'
// Import V1 map component directly - DO NOT COPY, REUSE EXACT SAME COMPONENT
import { TripOverviewMap } from '@/components/itinerary/TripOverviewMap'
import { useAuth } from '@/hooks/useAuth'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { getBrowserSupabase } from '@/lib/supabase'
import { NotesModal } from './NotesModal'
import { ChecklistModal } from './ChecklistModal'

import { LocationAutocomplete } from '@/components/itinerary/LocationAutocomplete'

interface ResultsViewProps {
  plan: any // V1 API response
  tripData: TripPlanData
  locationImages?: Record<string, { featured: string; gallery: string[] }>
  structuredContext?: any
  groqHeadline?: string // Cached GROQ headline
  groqSubtitle?: string // Cached GROQ subtitle
  generationMode?: 'two-stage' | 'pro' | 'standard'
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

/**
 * Generate smart, contextual tags based on trip data
 * Returns array of tags with label, icon, and color
 */
function generateSmartTags(tripData: TripPlanData, plan: any) {
  const tags: Array<{ label: string; icon: React.ReactNode; color: string }> = []

  if (!tripData || !plan) return tags

  // Duration-based tag
  if (tripData.dateRange) {
    const days = Math.ceil((tripData.dateRange.endDate.getTime() - tripData.dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (days <= 3) {
      tags.push({ label: 'Quick Getaway', icon: '⚡', color: 'bg-orange-50 text-orange-700 border-orange-200' })
    } else if (days <= 7) {
      tags.push({ label: 'Week-Long', icon: '📅', color: 'bg-blue-50 text-blue-700 border-blue-200' })
    } else if (days <= 14) {
      tags.push({ label: 'Extended Trip', icon: '🗓️', color: 'bg-purple-50 text-purple-700 border-purple-200' })
    } else {
      tags.push({ label: 'Epic Adventure', icon: '🌍', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' })
    }
  }

  // Travel style tags
  if (tripData.travelStyle && Array.isArray(tripData.travelStyle)) {
    const styles = tripData.travelStyle
    if (styles.includes('cultural')) {
      tags.push({ label: 'Cultural', icon: '🎭', color: 'bg-amber-50 text-amber-700 border-amber-200' })
    }
    if (styles.includes('adventure')) {
      tags.push({ label: 'Adventure', icon: '🏔️', color: 'bg-green-50 text-green-700 border-green-200' })
    }
    if (styles.includes('relaxation')) {
      tags.push({ label: 'Relaxation', icon: '🏖️', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' })
    }
    if (styles.includes('food')) {
      tags.push({ label: 'Foodie', icon: '🍽️', color: 'bg-red-50 text-red-700 border-red-200' })
    }
  }

  // Budget level tag - ALL GRAY
  if (tripData.budget) {
    const budgetMap: Record<string, { label: string; icon: string; color: string }> = {
      'budget': { label: 'Budget-Friendly', icon: '💰', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'mid-range': { label: 'Mid-Range', icon: '💵', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'comfortable': { label: 'Comfortable', icon: '💳', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'luxury': { label: 'Luxury', icon: '✨', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'no-constraint': { label: 'No Budget Limit', icon: '💎', color: 'bg-gray-100 text-gray-700 border-gray-300' }
    }
    if (budgetMap[tripData.budget]) {
      tags.push(budgetMap[tripData.budget])
    }
  }

  // Transport mode tag - ALL GRAY
  if (tripData.transportMode) {
    const transportMap: Record<string, { label: string; icon: string; color: string }> = {
      'car': { label: 'Road Trip', icon: '🚗', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'train': { label: 'Train Journey', icon: '🚂', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'flight': { label: 'Multi-City', icon: '✈️', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'bike': { label: 'Cycling', icon: '🚴', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'bus': { label: 'Bus Tour', icon: '🚌', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'mixed': { label: 'Multi-Transport', icon: '🛣️', color: 'bg-gray-100 text-gray-700 border-gray-300' }
    }
    if (transportMap[tripData.transportMode]) {
      tags.push(transportMap[tripData.transportMode])
    }
  }

  // Companion type tag - ALL GRAY
  if (tripData.companions) {
    const companionMap: Record<string, { label: string; icon: string; color: string }> = {
      'solo': { label: 'Solo Travel', icon: '🧑', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'couple': { label: 'Couple', icon: '👫', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'family': { label: 'Family Trip', icon: '👨‍👩‍👧‍👦', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'friends': { label: 'Group Trip', icon: '👥', color: 'bg-gray-100 text-gray-700 border-gray-300' },
      'business': { label: 'Business', icon: '💼', color: 'bg-gray-100 text-gray-700 border-gray-300' }
    }
    if (companionMap[tripData.companions]) {
      tags.push(companionMap[tripData.companions])
    }
  }

  return tags
}

// Activity Enrichment Component - Fetches Brave data for activities
function ActivityEnrichment({ activityName, location, tripType, tripVision }: { activityName: string; location: string; tripType?: string; tripVision?: string }) {
  const [braveData, setBraveData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Inspiration mode: pass only the user's free-text vision as context (tripType sent separately)
  const visionOnly = useMemo(() => (tripVision?.trim() || ''), [tripVision])

  // Utility: strip HTML tags and decode basic entities
  const cleanHtml = (html: string) => {
    if (!html) return ''
    const txt = document.createElement('div')
    txt.innerHTML = html
    const text = txt.textContent || txt.innerText || ''
    return text.replace(/\s+/g, ' ').trim()
  }

  useEffect(() => {
    const fetchBraveData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          name: activityName,
          location,
          type: 'activity',
          count: '1',
        });
        if (tripType) params.append('tripType', tripType)
        if (visionOnly) params.append('context', visionOnly)

        console.log('🔍 Fetching Brave data for:', activityName, 'in', location)
        const response = await fetch(`/api/brave/activity-image?${params.toString()}`)
        const json = await response.json()

        console.log('📊 Brave API response:', json)

        if (json?.success && json?.data?.links && json.data.links.length > 0) {
          setBraveData(json.data.links[0])
          console.log('✅ Brave data set:', json.data.links[0])
        } else {
          console.log('⚠️ No Brave data found, trying GROQ fallback...')
          // GROQ fallback for contextual descriptions
          try {
            const groqResponse = await fetch('/api/groq/activity-description', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                activityName,
                location,
                tripType,
                context: visionOnly
              })
            })
            const groqJson = await groqResponse.json()
            if (groqJson?.success && groqJson?.description) {
              setBraveData({
                description: groqJson.description,
                url: groqJson.url || null
              })
              console.log('✅ GROQ fallback description generated')
            }
          } catch (groqError) {
            console.error('❌ GROQ fallback failed:', groqError)
          }
        }
      } catch (error) {
        console.error('❌ Error fetching Brave data:', error)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch for activities, not departure/arrival
    if (activityName && !activityName.toLowerCase().includes('depart') && !activityName.toLowerCase().includes('arrive')) {
      fetchBraveData()
    }
  }, [activityName, location, tripType, visionOnly])

  if (!braveData) return null

  const description = braveData.description ? cleanHtml(braveData.description) : ''

  // Check if description is long enough to need "Show more" (roughly 2 lines = ~100 chars)
  const needsShowMore = description.length > 100

  return (
    <div className="mt-1.5 space-y-1">
      {description && (
        <div className="text-xs text-gray-500 leading-relaxed">
          <p className={expanded ? '' : 'line-clamp-2'}>{description}</p>
          {needsShowMore && (
            <button
              type="button"
              className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] text-gray-500 hover:text-gray-700"
              onClick={() => setExpanded((e) => !e)}
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              {expanded ? 'Show less' : 'Show more'} {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>
      )}
      {braveData.url && (
        <a
          href={braveData.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 hover:underline"
        >
          Learn more <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  )
}

// Helper: Generate search URL for activity
function generateActivitySearchUrl(activityName: string, location: string): string {
  const query = `${activityName} ${location} booking information`
  return `https://search.brave.com/search?q=${encodeURIComponent(query)}`
}

// Helper: Get activity type badge
function getActivityTypeBadge(type: string): { emoji: string; label: string; color: string } {
  switch (type) {
    case 'travel':
      return { emoji: '🚗', label: 'Travel', color: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'meal':
      return { emoji: '🍽️', label: 'Dining', color: 'bg-orange-50 text-orange-700 border-orange-200' }
    case 'activity':
      return { emoji: '🎯', label: 'Activity', color: 'bg-purple-50 text-purple-700 border-purple-200' }
    default:
      return { emoji: '📍', label: 'POI', color: 'bg-gray-50 text-gray-700 border-gray-200' }
  }
}

// POI Item with Image
function POIItem({ poi, location }: { poi: any; location: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          name: poi.name,
          location,
          type: 'poi',
          count: '1',
        })
        const response = await fetch(`/api/brave/activity-image?${params.toString()}`)
        const json = await response.json()
        if (json?.success && json?.data?.links?.[0]?.thumbnail) {
          setImageUrl(json.data.links[0].thumbnail)
        }
      } catch (error) {
        console.error('Error fetching POI image:', error)
      } finally {
        setLoading(false)
      }
    }

    if (poi.name) {
      fetchImage()
    }
  }, [poi.name, location])

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      {/* POI Thumbnail */}
      {imageUrl ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={imageUrl}
            alt={poi.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-6 h-6 text-purple-600" />
        </div>
      )}

      {/* POI Info */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-900 truncate">{poi.name}</div>
        {poi.category && (
          <div className="text-[10px] text-gray-500 mt-0.5">{poi.category}</div>
        )}
        {poi.detourMinutes && (
          <div className="text-[10px] text-purple-600 mt-0.5">+{poi.detourMinutes} min detour</div>
        )}
      </div>
    </div>
  )
}

export function ResultsView({ plan, tripData, locationImages = {}, structuredContext, groqHeadline, groqSubtitle, generationMode, onEdit }: ResultsViewProps) {
  // Local state for days (allows adding/deleting)
  const [days, setDays] = useState(plan.days)

  const [selectedDay, setSelectedDay] = useState(1)
  const [hoveredDayForDelete, setHoveredDayForDelete] = useState<number | null>(null)
  const [hoveredAddDayIndex, setHoveredAddDayIndex] = useState<number | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set())
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const dayContentRef = useRef<HTMLDivElement>(null)

  // Add Day Modal state
  const [showAddDayModal, setShowAddDayModal] = useState(false)
  const [addDayAfterIndex, setAddDayAfterIndex] = useState<number | null>(null)
  const [newDayLocation, setNewDayLocation] = useState('')
  const [isLoadingNewDay, setIsLoadingNewDay] = useState(false)
  const [animatingDayNumber, setAnimatingDayNumber] = useState<number | null>(null)
  const [suggestedLocations, setSuggestedLocations] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  // Delete Day Animation state
  const [deletingDayNumber, setDeletingDayNumber] = useState<number | null>(null)

  // Location descriptions state
  const [locationDescriptions, setLocationDescriptions] = useState<Record<string, string>>({})
  const [loadingDescriptions, setLoadingDescriptions] = useState<Set<string>>(new Set())
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showSavedModal, setShowSavedModal] = useState(false)
  const [lastSavedTripId, setLastSavedTripId] = useState<string | null>(null)
  const saveBtnRef = useRef<HTMLButtonElement | null>(null)

  // Notes & checklists state keyed by day-stop-title
  const [openNotesKey, setOpenNotesKey] = useState<string | null>(null)
  const [openChecklistKey, setOpenChecklistKey] = useState<string | null>(null)
  const [notesMap, setNotesMap] = useState<Record<string, { clientUid: string; noteText: string }>>({})
  const [checklistsMap, setChecklistsMap] = useState<Record<string, { clientUid: string; items: { text: string; checked?: boolean }[]; templateType?: string }>>({})
  const [openContext, setOpenContext] = useState<{
    dayIndex: number
    stopIndex: number
    locationName?: string
    activityTitle: string
    activityId?: string
    locationId?: string
    tripId?: string
  } | null>(null)

  const { user, isAuthenticated } = useAuth()
  const { showSignIn } = useAuthModal()
  const router = useRouter()

  // Trip title/subtitle editing - Initialize with cached GROQ headline
  const [tripTitle, setTripTitle] = useState(groqHeadline || plan.title || '')
  const [tripSubtitle, setTripSubtitle] = useState(groqSubtitle || plan.summary || '')
  const [savingMetadata, setSavingMetadata] = useState(false)
  const saveMetadataTimeoutRef = useRef<NodeJS.Timeout>()

  // Day location editing
  const [editingDayLocation, setEditingDayLocation] = useState<number | null>(null)
  const [savingDayData, setSavingDayData] = useState(false)
  const saveDayDataTimeoutRef = useRef<NodeJS.Timeout>()

  // Activity editing
  const [editingActivity, setEditingActivity] = useState<string | null>(null) // Format: "dayNumber-activityIndex-field"
  const [savingActivityData, setSavingActivityData] = useState(false)
  const saveActivityDataTimeoutRef = useRef<NodeJS.Timeout>()

  // Accommodation editing
  const [editingAccommodation, setEditingAccommodation] = useState<string | null>(null) // Format: "dayNumber-field"
  const [savingAccommodationData, setSavingAccommodationData] = useState(false)
  const saveAccommodationDataTimeoutRef = useRef<NodeJS.Timeout>()

  // Description and facts editing
  const [editingDescription, setEditingDescription] = useState<string | null>(null) // Format: "dayNumber-field"

  // Tips editing
  const [editingTip, setEditingTip] = useState<number | null>(null) // Tip index
  const [savingTips, setSavingTips] = useState(false)
  const saveTipsTimeoutRef = useRef<NodeJS.Timeout>()

  // Alternative route generation
  const [isGeneratingAlternative, setIsGeneratingAlternative] = useState(false)

  // Change Route modal state
  const [showRouteModal, setShowRouteModal] = useState(false)
  const [routeOptions, setRouteOptions] = useState<Array<{ id: string; label: string; order: string[] }>>([])
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(null)
  const [previewLocations, setPreviewLocations] = useState<Array<{ latitude: number; longitude: number }> | null>(null)

  // Change Location modal state
  const [showChangeLocationModal, setShowChangeLocationModal] = useState(false)
  const [changeLocationDay, setChangeLocationDay] = useState<number | null>(null)
  const [changeLocationValue, setChangeLocationValue] = useState('')
  const [changeLocationMeta, setChangeLocationMeta] = useState<any>(null)
  const [isChangingLocation, setIsChangingLocation] = useState(false)

  // Highlight descriptions cache
  const [highlightDescriptions, setHighlightDescriptions] = useState<Record<string, string>>({})

  // Handle broken images
  const handleImageError = (imageUrl: string) => {
    setBrokenImages(prev => new Set(prev).add(imageUrl))
  }
  const [generatingHeadline, setGeneratingHeadline] = useState(false)

  // Update title/subtitle when groqHeadline/groqSubtitle changes
  useEffect(() => {
    if (groqHeadline) setTripTitle(groqHeadline)
    if (groqSubtitle) setTripSubtitle(groqSubtitle)
  }, [groqHeadline, groqSubtitle])

  // Auto-save trip metadata (title/subtitle) with debouncing
  const handleSaveMetadata = async (field: 'title' | 'subtitle', value: string) => {
    // Clear existing timeout
    if (saveMetadataTimeoutRef.current) {
      clearTimeout(saveMetadataTimeoutRef.current)
    }

    // Debounce save (1 second delay)
    saveMetadataTimeoutRef.current = setTimeout(async () => {
      if (!lastSavedTripId) return // Only save if trip has been saved

      setSavingMetadata(true)
      try {
        const response = await fetch(`/api/trips/${lastSavedTripId}/update-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updateType: 'metadata',
            data: {
              [field]: value
            }
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save')
        }

        toast.success('Saved ✓', { duration: 1500 })
      } catch (error) {
        console.error('Error saving metadata:', error)
        toast.error('Failed to save changes')
      } finally {
        setSavingMetadata(false)
      }
    }, 1000)
  }

  // Auto-save day data with debouncing
  const handleSaveDayData = async (dayNumber: number, field: string, value: any) => {
    // Clear existing timeout
    if (saveDayDataTimeoutRef.current) {
      clearTimeout(saveDayDataTimeoutRef.current)
    }

    // Debounce save (1 second delay)
    saveDayDataTimeoutRef.current = setTimeout(async () => {
      if (!lastSavedTripId) return // Only save if trip has been saved

      setSavingDayData(true)
      try {
        const response = await fetch(`/api/trips/${lastSavedTripId}/update-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updateType: 'day',
            data: {
              dayNumber,
              [field]: value
            }
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save')
        }

        toast.success('Saved ✓', { duration: 1500 })
      } catch (error) {
        console.error('Error saving day data:', error)
        toast.error('Failed to save changes')
      } finally {
        setSavingDayData(false)
      }
    }, 1000)
  }

  // Auto-save activity data with debouncing
  const handleSaveActivityData = async (dayNumber: number, activityIndex: number, field: string, value: any) => {
    // Clear existing timeout
    if (saveActivityDataTimeoutRef.current) {
      clearTimeout(saveActivityDataTimeoutRef.current)
    }

    // Debounce save (1 second delay)
    saveActivityDataTimeoutRef.current = setTimeout(async () => {
      if (!lastSavedTripId) return // Only save if trip has been saved

      setSavingActivityData(true)
      try {
        const response = await fetch(`/api/trips/${lastSavedTripId}/update-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updateType: 'activity',
            data: {
              dayNumber,
              activityIndex,
              [field]: value
            }
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save')
        }

        toast.success('Saved ✓', { duration: 1500 })
      } catch (error) {
        console.error('Error saving activity data:', error)
        toast.error('Failed to save changes')
      } finally {
        setSavingActivityData(false)
      }
    }, 1000)
  }

  // Auto-save accommodation data with debouncing
  const handleSaveAccommodationData = async (dayNumber: number, field: string, value: any) => {
    // Clear existing timeout
    if (saveAccommodationDataTimeoutRef.current) {
      clearTimeout(saveAccommodationDataTimeoutRef.current)
    }

    // Debounce save (1 second delay)
    saveAccommodationDataTimeoutRef.current = setTimeout(async () => {
      if (!lastSavedTripId) return // Only save if trip has been saved

      setSavingAccommodationData(true)
      try {
        const response = await fetch(`/api/trips/${lastSavedTripId}/update-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updateType: 'accommodation',
            data: {
              dayNumber,
              [field]: value
            }
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save')
        }

        toast.success('Saved ✓', { duration: 1500 })
      } catch (error) {
        console.error('Error saving accommodation data:', error)
        toast.error('Failed to save changes')
      } finally {
        setSavingAccommodationData(false)
      }
    }, 1000)
  }

  // Auto-save tips with debouncing
  const handleSaveTips = async (tips: string[]) => {
    // Clear existing timeout
    if (saveTipsTimeoutRef.current) {
      clearTimeout(saveTipsTimeoutRef.current)
    }

    // Debounce save (1 second delay)
    saveTipsTimeoutRef.current = setTimeout(async () => {
      if (!lastSavedTripId) return // Only save if trip has been saved

      setSavingTips(true)
      try {
        const response = await fetch(`/api/trips/${lastSavedTripId}/update-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updateType: 'tips',
            data: { tips }
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save')
        }

        toast.success('Saved ✓', { duration: 1500 })
      } catch (error) {
        console.error('Error saving tips:', error)
        toast.error('Failed to save changes')
      } finally {
        setSavingTips(false)
      }
    }, 1000)
  }

  // Generate descriptions for highlights using GROQ
  const generateHighlightDescription = async (highlight: string, location: string): Promise<string> => {
    const cacheKey = `${highlight}|${location}`
    if (highlightDescriptions[cacheKey]) {
      return highlightDescriptions[cacheKey]
    }

    try {
      const response = await fetch('/api/trip-planner/highlight-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ highlight, location })
      })

      if (!response.ok) throw new Error('Failed to generate description')

      const { description } = await response.json()
      setHighlightDescriptions(prev => ({
        ...prev,
        [cacheKey]: description
      }))
      return description
    } catch (error) {
      console.error('Error generating highlight description:', error)
      return ''
    }
  }

  // Smooth scroll to day content when day is selected
  const handleDayClick = (dayNumber: number) => {
    setSelectedDay(dayNumber)
    if (dayContentRef.current) {
      dayContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Delete a day from the itinerary with animation
  const handleDeleteDay = (dayNumber: number) => {
    // Confirm deletion
    if (!confirm(`Delete Day ${dayNumber}? This will remove all locations and activities for this day.`)) {
      return
    }

    // Set deleting state for animation
    setDeletingDayNumber(dayNumber)

    // Wait for animation to complete before actually deleting
    setTimeout(() => {
      // Filter out the deleted day and renumber remaining days
      const updatedDays = days
        .filter((day: any) => day.day !== dayNumber)
        .map((day: any, index: number) => ({
          ...day,
          day: index + 1 // Renumber days
        }))

      // Update state with new days
      setDays(updatedDays)

      // If deleted day was selected, select the first day
      if (selectedDay === dayNumber) {
        setSelectedDay(1)
      } else if (selectedDay > dayNumber) {
        // Adjust selected day if it's after the deleted day
        setSelectedDay(selectedDay - 1)
      }

      // Clear deleting state
      setDeletingDayNumber(null)

      // Show toast notification
      toast.success(`Day ${dayNumber} deleted successfully`)
      console.log(`✅ Day ${dayNumber} deleted. Total days: ${updatedDays.length}`)
    }, 300) // Match animation duration
  }

  // Fetch smart location suggestions based on trip context
  const fetchLocationSuggestions = async (afterDayNumber: number) => {
    setIsLoadingSuggestions(true)
    try {
      const previousDay = days[afterDayNumber - 1]
      const nextDay = days[afterDayNumber]

      const response = await fetch('/api/trip-planner/suggest-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousLocation: previousDay?.location,
          previousCoords: previousDay?.locationMetadata,
          nextLocation: nextDay?.location,
          nextCoords: nextDay?.locationMetadata,
          transportMode: tripData.transportMode || 'car',
          tripType: tripData.tripType || 'leisure'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.suggestions) {
          setSuggestedLocations(data.suggestions)
        }
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  // Open modal to add a new day
  const handleAddDayClick = (afterDayNumber: number) => {
    setAddDayAfterIndex(afterDayNumber)
    setNewDayLocation('')
    setSuggestedLocations([])
    setShowAddDayModal(true)

    // Fetch suggestions in background
    fetchLocationSuggestions(afterDayNumber)
  }

  // Fetch location description using GROQ
  const fetchLocationDescription = async (locationName: string) => {
    // Check if already loaded or loading
    if (locationDescriptions[locationName] || loadingDescriptions.has(locationName)) {
      return
    }

    // Mark as loading
    setLoadingDescriptions(prev => new Set(prev).add(locationName))

    try {
      const response = await fetch('/api/trip-planner/location-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: locationName })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch description')
      }

      const data = await response.json()

      if (data.success && data.description) {
        setLocationDescriptions(prev => ({
          ...prev,
          [locationName]: data.description
        }))
      }
    } catch (error) {
      console.error('Error fetching location description:', error)
    } finally {
      setLoadingDescriptions(prev => {
        const newSet = new Set(prev)
        newSet.delete(locationName)
        return newSet
      })
    }
  }

  // Add a new day after the specified day with location - FETCH REAL DATA
  const handleAddDaySubmit = async () => {
    if (!newDayLocation.trim()) {
      toast.error('Please enter a location')
      return
    }

    if (addDayAfterIndex === null) return

    setIsLoadingNewDay(true)

    try {
      console.log(`🔄 Fetching location data for: ${newDayLocation}`)

      // Fetch location data using GROQ (same as trip planner)
      const response = await fetch('/api/trip-planner/add-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: newDayLocation,
          tripType: tripData.tripType || 'leisure',
          transportMode: tripData.transportMode || 'car',
          previousLocation: days[addDayAfterIndex - 1]?.location,
          nextLocation: days[addDayAfterIndex]?.location
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch location data')
      }

      const data = await response.json()

      if (!data.success || !data.day) {
        throw new Error(data.error || 'Failed to generate day data')
      }

      console.log('✅ Location data fetched:', data.day)

      // Create new day with fetched data
      const newDay = {
        ...data.day,
        day: addDayAfterIndex + 1,
        date: new Date(new Date(days[addDayAfterIndex - 1].date).getTime() + 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }

      // Set animating day number for smooth animation
      setAnimatingDayNumber(addDayAfterIndex + 1)

      // Insert the new day and renumber subsequent days
      const updatedDays = [
        ...days.slice(0, addDayAfterIndex),
        newDay,
        ...days.slice(addDayAfterIndex).map((day: any) => ({
          ...day,
          day: day.day + 1
        }))
      ]

      // Update state with new days
      setDays(updatedDays)

      // Close modal
      setShowAddDayModal(false)
      setNewDayLocation('')

      // Select the new day after animation
      setTimeout(() => {
        setSelectedDay(addDayAfterIndex + 1)
        setAnimatingDayNumber(null)
      }, 600)

      toast.success(`Day added: ${newDayLocation}`)
    } catch (error) {
      console.error('❌ Error adding day:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add day')
    } finally {
      setIsLoadingNewDay(false)
    }
  }

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Show/hide scroll-to-top button based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Save trip to database
  const handleSaveTrip = async () => {
    if (!isAuthenticated || !user) {
      showSignIn('/plan-v2')
      return
    }

    if (isSaving) return
    setIsSaving(true)

    try {
      const supabase = getBrowserSupabase()

      // Generate slug from title
      const title = tripTitle || `${tripData.destinations[0]?.name} to ${tripData.destinations[tripData.destinations.length - 1]?.name}`
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50)

      // CRITICAL FIX: Get cover image from first day's location
      const coverImage = days?.[0] ? (() => {
        const day = days[0]
        const locationKey = day.location?.toLowerCase().replace(/\s+/g, '-')
        const imgs = (
          locationImages[day.location] ||
          (locationImages as any)[locationKey] ||
          fallbackImages[day.location] ||
          (fallbackImages as any)[locationKey] ||
          day.locationMetadata?.images
        ) as { featured?: string; gallery?: string[] } | undefined
        return imgs?.featured || imgs?.gallery?.[0] || null
      })() : null

      // Create trip in database
      const { data: trip, error } = await supabase
        .from('trips')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: tripSubtitle?.trim() || null,
          slug,
          status: 'draft',
          cover_image: coverImage,
          start_date: tripData.dateRange?.startDate.toISOString().split('T')[0],
          end_date: tripData.dateRange?.endDate.toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating trip:', error)
        throw new Error(error.message || 'Failed to create trip')
      }

      // Initialize trip stats
      await supabase
        .from('trip_stats')
        .insert({
          trip_id: trip.id,
          total_views: 0,
          unique_views: 0,
          updated_at: new Date().toISOString()
        })

      // CRITICAL FIX: Save full plan data to trip_plan table (like V1)
      // This ensures the trip can be viewed/edited properly in My Trips
      try {
        const fullPlan = {
          ...plan,
          tripData,
          locationImages,
          tripTitle,
          tripSubtitle
        }

        await supabase
          .from('trip_plan')
          .insert({
            trip_id: trip.id,
            user_id: user.id,
            day: 1, // Required field - use day 1 for AI plan storage
            time: '00:00:00', // Required field - use midnight
            title: 'AI Generated Plan V2', // Mark as V2 plan
            type: 'ai_plan_v2',
            plan_data: fullPlan, // Full plan with all metadata
          })

        console.log('✅ Saved V2 plan data to trip_plan table')
      } catch (planError) {
        console.error('⚠️ Failed to save plan data:', planError)
        // Don't fail the whole save if plan data fails
      }

      // Best-effort sync of notes & checklists captured during planning
      try {
        const notesEntries = Object.entries(notesMap)
        const checklistEntries = Object.entries(checklistsMap)

        await Promise.all([
          ...notesEntries.map(([key, v]) =>
            fetch('/api/trip-notes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientUid: v.clientUid,
                noteText: v.noteText,
                tripId: trip.id,
              })
            }).catch(() => {})
          ),
          ...checklistEntries.map(([key, v]) =>
            fetch('/api/trip-checklists', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientUid: v.clientUid,
                items: v.items,
                templateType: v.templateType || null,
                tripId: trip.id,
              })
            }).catch(() => {})
          )
        ])
      } catch (e) {
        console.warn('Failed to sync notes/checklists to trip', e)
      }

      // Show success toast and open summary modal
      toast.success('Trip saved successfully! ✅')
      setLastSavedTripId(trip.id)
      setShowSavedModal(true)
    } catch (error: any) {
      console.error('Error saving trip:', error)
      toast.error(error.message || 'Failed to save trip')
    } finally {
      setIsSaving(false)
    }
  }

  // Animate a small chip from Save button to avatar (or top-right fallback)
  const animateFlyToAvatar = (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const fromEl = saveBtnRef.current
        const fromRect = fromEl?.getBoundingClientRect()
        const avatarEl = document.querySelector('[data-avatar-anchor]') as HTMLElement | null
        const toRect = avatarEl?.getBoundingClientRect()

        const startX = fromRect ? fromRect.left + fromRect.width / 2 : window.innerWidth / 2
        const startY = fromRect ? fromRect.top + fromRect.height / 2 : window.innerHeight - 40
        const endX = toRect ? toRect.left + toRect.width / 2 : window.innerWidth - 24
        const endY = toRect ? toRect.top + toRect.height / 2 : 24

        const chip = document.createElement('div')
        chip.style.position = 'fixed'
        chip.style.left = `${startX}px`
        chip.style.top = `${startY}px`
        chip.style.width = '14px'
        chip.style.height = '14px'
        chip.style.borderRadius = '9999px'
        chip.style.background = 'linear-gradient(90deg, #059669, #0d9488)'
        chip.style.boxShadow = '0 6px 18px rgba(16,185,129,0.35)'
        chip.style.transform = 'translate(-50%, -50%)'
        chip.style.transition = 'all 800ms cubic-bezier(0.22, 1, 0.36, 1)'
        chip.style.zIndex = '9999'
        chip.style.pointerEvents = 'none' // CRITICAL FIX: Prevent interaction

        // CRITICAL FIX: Use a container that won't be removed by React
        const container = document.getElementById('__next') || document.body
        container.appendChild(chip)

        // Force layout then move
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            chip.style.left = `${endX}px`
            chip.style.top = `${endY}px`
            chip.style.width = '8px'
            chip.style.height = '8px'
            chip.style.opacity = '0.2'
            chip.style.boxShadow = '0 4px 12px rgba(16,185,129,0.25)'
          })
        })

        const cleanup = () => {
          // CRITICAL FIX: Check if chip still exists before removing
          if (chip && chip.parentNode) {
            chip.remove()
          }
          resolve()
        }
        setTimeout(cleanup, 850)
      } catch (err) {
        console.warn('Animation error:', err)
        resolve()
      }
    })
  }

  // Client-side fallback image discovery if API didn't return images
  const [fallbackImages, setFallbackImages] = useState<Record<string, { featured: string; gallery: string[] }>>({});

  useEffect(() => {
    const run = async () => {
      if (!plan?.days) return;

      // Collect all location names (day locations + activity destinations + POI names)
      const allLocationNames = new Set<string>();

      // Add day locations
      (days as any[]).forEach((d: any) => {
        if (d.location) allLocationNames.add(d.location);
      });

      // CRITICAL FIX: Add activity destination names AND specific POI names
      // Track which names are POIs vs destinations for context-specific image fetching
      const poiNames = new Set<string>();

      (days as any[]).forEach((d: any) => {
        d.items?.forEach((item: any) => {
          if (item.title) {
            // Extract POI names (e.g., "Braaker Mühle" from "Visit Braaker Mühle")
            const poiMatch = /(?:Visit|Explore|See|Tour)\s+(.+)/i.exec(item.title)
            if (poiMatch) {
              const poiName = poiMatch[1]?.trim()
              if (poiName && d.location) {
                // Add POI with location context for better images
                const fullPOIName = `${poiName} ${d.location}`
                allLocationNames.add(fullPOIName)
                poiNames.add(fullPOIName) // Mark as POI for activity context
                console.log(`🔍 Will fetch POI images for: "${fullPOIName}"`)
              }
            }

            // Also extract destination names (e.g., "Grand Junction" from "Drive to Grand Junction")
            const destMatch = /(?:to|in|at)\s+(.+)/i.exec(item.title)
            if (destMatch) {
              const destName = destMatch[1]?.split(',')[0]?.trim()
              if (destName) allLocationNames.add(destName)
            }
          }
        })
      });

      const uniqueNames = Array.from(allLocationNames).filter(Boolean) as string[];
      const missing = uniqueNames.filter((name) => {
        const key = name.toLowerCase().replace(/\s+/g, '-')
        return !(locationImages as any)[name] && !(locationImages as any)[key] && !fallbackImages[name] && !fallbackImages[key]
      });

      if (missing.length === 0) return

      console.log(`🖼️ Fetching images for ${missing.length} locations:`, missing)

      await Promise.all(
        missing.map(async (name) => {
          try {
            // CRITICAL FIX: Use 'activity' context for POIs, 'trip' for destinations
            const isPOI = poiNames.has(name)
            const context = isPOI ? 'activity' : 'trip'

            console.log(`🔍 Fetching ${isPOI ? 'POI' : 'destination'} images for "${name}" using Brave API + Reddit ULTRA (context: ${context})...`)
            const res = await fetch(`/api/images/discover?query=${encodeURIComponent(name)}&limit=10&context=${context}`)

            if (!res.ok) {
              console.error(`❌ Image API failed for "${name}": ${res.status} ${res.statusText}`)
              return
            }

            const json = await res.json()

            if (!json.success) {
              console.error(`❌ Image API returned error for "${name}":`, json.error)
              return
            }

            const urls: string[] = json?.images?.map((i: any) => i.url).filter(Boolean) || []

            if (urls.length > 0) {
              setFallbackImages((prev) => {
                const updated = { ...prev, [name]: { featured: urls[0], gallery: urls } }
                console.log(`✅ Stored ${urls.length} images for key "${name}"`, {
                  featured: urls[0],
                  sources: json.images.map((i: any) => i.source).join(', ')
                })
                return updated
              })
            } else {
              console.warn(`⚠️ No images found for "${name}" - API returned empty array`)
            }
          } catch (e) {
            console.error(`❌ Fallback image fetch failed for "${name}":`, e)
          }
        })
      )
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, locationImages])


  // Generate headline with GROQ
  const generateHeadline = async () => {
    setGeneratingHeadline(true)
    try {

      const response = await fetch('/api/groq/generate-headline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinations: tripData.destinations.map(d => d.name),
          duration: tripData.dateRange
            ? Math.ceil((tripData.dateRange.endDate.getTime() - tripData.dateRange.startDate.getTime()) / (1000 * 60 * 60 * 24))
            : (plan?.stats?.totalDays || 1),
          tripType: tripData.tripType
        })
      })
      const { headline, subtitle } = await response.json()
      setTripTitle(headline)
      setTripSubtitle(subtitle)
    } catch (error) {
      console.error('Error generating headline:', error)
    } finally {
      setGeneratingHeadline(false)
    }
  }

  // Generate alternative route (opens selection modal)
  const generateAlternativeRoute = async () => {
    await openRouteSelectionModal()
  }

  // Open Change Route modal and prepare options
  const openRouteSelectionModal = async () => {
    setIsGeneratingAlternative(true)
    try {
      // Base orders
      const currentOrder = days.map((d: any) => d.location)
      const reversedOrder = [...currentOrder].reverse()

      const opts: Array<{ id: string; label: string; order: string[] }> = [
        { id: 'current', label: 'Current order', order: currentOrder },
        { id: 'reverse', label: 'Reverse order', order: reversedOrder }
      ]

      // Try to fetch AI-suggested order using existing endpoint
      try {
        const response = await fetch('/api/trip-planner/alternative-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ locations: currentOrder, tripData, currentPlan: plan })
        })
        const data = await response.json()
        if (response.ok && data?.plan?.days?.length) {
          const aiOrder = data.plan.days.map((d: any) => d.location)
          // Deduplicate by string join key
          const seen = new Set(opts.map(o => o.order.join('>')))
          const key = aiOrder.join('>')
          if (!seen.has(key)) {
            opts.push({ id: 'ai', label: 'AI suggested', order: aiOrder })
          }
        }
      } catch (e) {
        console.warn('AI alternative route fetch failed, continuing with basic options:', e)
      }

      setRouteOptions(opts)
      setSelectedRouteIndex(0)
      setShowRouteModal(true)

      // Prime preview for first option
      const coords = orderToCoords(opts[0].order)
      if (coords.length >= 2) setPreviewLocations(coords)
    } finally {
      setIsGeneratingAlternative(false)
    }
  }

  // Convert a location order to coordinates using day metadata or structuredContext
  const orderToCoords = (order: string[]) => {
    const nameToCoord = new Map<string, { latitude: number; longitude: number }>()
    days.forEach((d: any) => {
      if (d.locationMetadata?.latitude && d.locationMetadata?.longitude) {
        nameToCoord.set(d.location.toLowerCase(), {
          latitude: d.locationMetadata.latitude,
          longitude: d.locationMetadata.longitude
        })
      }
    })
    if (structuredContext?.locations) {
      Object.entries(structuredContext.locations).forEach(([name, val]: any) => {
        if (val?.latitude && val?.longitude && !nameToCoord.has(name.toLowerCase())) {
          nameToCoord.set(name.toLowerCase(), { latitude: val.latitude, longitude: val.longitude })
        }
      })
    }
    return order
      .map(name => nameToCoord.get(String(name).toLowerCase()))
      .filter(Boolean) as Array<{ latitude: number; longitude: number }>
  }

  // Apply the selected route option to reorder days
  const applySelectedRoute = () => {
    if (selectedRouteIndex === null) return
    const option = routeOptions[selectedRouteIndex]
    if (!option) return

    const locationToDay = new Map<string, any>()
    days.forEach((d: any) => locationToDay.set(d.location.toLowerCase(), d))

    const newDays: any[] = []
    option.order.forEach((name, idx) => {
      const d = locationToDay.get(String(name).toLowerCase())
      if (d) newDays.push({ ...d, day: idx + 1 })
    })

    if (newDays.length < 2) {
      toast.error('Could not build route from selection')
      return
    }

    setDays(newDays)
    // Keep plan.days in sync if other parts rely on it
    plan.days = newDays

    // Clear preview and close
    setPreviewLocations(null)
    setShowRouteModal(false)
    toast.success('Route updated')
  }

  // Open Change Location modal for a given day
  const openChangeLocation = (dayNumber: number) => {
    const day = days.find((d: any) => d.day === dayNumber)
    if (!day) return
    setChangeLocationDay(dayNumber)
    setChangeLocationValue(day.location)
    setChangeLocationMeta(day.locationMetadata || null)
    setShowChangeLocationModal(true)
  }

  // Confirm change location: fetch full day data and replace
  const handleConfirmChangeLocation = async () => {
    if (!changeLocationDay || !changeLocationValue) return
    setIsChangingLocation(true)
    try {
      const idx = changeLocationDay - 1
      const prev = days[idx - 1]
      const next = days[idx + 1]

      const resp = await fetch('/api/trip-planner/add-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: changeLocationValue,
          tripType: tripData.tripType || 'leisure',
          transportMode: tripData.transportMode || 'car',
          previousLocation: prev?.location,
          previousCoords: prev?.locationMetadata,
          nextLocation: next?.location,
          nextCoords: next?.locationMetadata
        })
      })
      const data = await resp.json()
      if (!resp.ok || !data?.success || !data?.day) {
        throw new Error(data?.error || 'Failed to load location details')
      }

      const newDay = {
        ...data.day,
        day: changeLocationDay
      }

      setDays((dArr: any[]) =>
        dArr.map(d => (d.day === changeLocationDay ? newDay : d))
      )

      // Keep plan.days in sync
      plan.days = plan.days.map((d: any) => (d.day === changeLocationDay ? newDay : d))

      setShowChangeLocationModal(false)
      toast.success('Location updated')
    } catch (e) {
      console.error('Change location failed', e)
      toast.error('Could not update location')
    } finally {
      setIsChangingLocation(false)
    }
  }

  const itinerary = useMemo(() => {
    if (!plan?.days) return []


    // Track per-location image index to avoid duplicate hero images across repeated days

    const usedImageIndexMap = new Map<string, number>()

    return days.map((day: any, index: number) => {
      // Determine if this is a travel day
      const isTravelDay = day.type === 'travel' || day.travelInfo

      // Build stops from items with deduplication and validation
      const rawStops = day.items?.map((item: any) => ({
        time: item.time || '09:00',
        title: item.title,
        type: item.type === 'travel' ? 'travel' : item.type === 'meal' ? 'meal' : 'activity',
        icon: item.type === 'travel' ? Navigation : item.type === 'meal' ? Utensils : Camera,
        duration: item.duration ? `${item.duration}h` : undefined
      })) || []

      // CRITICAL FIX: Deduplicate stops and validate daily schedule
      const stops = rawStops.filter((stop: any, idx: number, arr: any[]) => {
        // Remove exact duplicates (same title and time)
        const isDuplicate = arr.findIndex((s: any) =>
          s.title === stop.title && s.time === stop.time
        ) !== idx

        if (isDuplicate) {
          console.warn(`⚠️ Removed duplicate stop: ${stop.title} at ${stop.time}`)
          return false
        }

        // Remove recurring travel activities (same title appearing multiple times)
        if (stop.type === 'travel') {
          const travelCount = arr.filter((s: any) => s.title === stop.title).length
          const isFirstOccurrence = arr.findIndex((s: any) => s.title === stop.title) === idx

          if (travelCount > 1 && !isFirstOccurrence) {
            console.warn(`⚠️ Removed recurring travel activity: ${stop.title} (appeared ${travelCount} times)`)
            return false
          }
        }

        return true
      })

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

      // Get location images (featured + gallery) with fallback and per-location rotation to avoid duplicates
      const locationKey = day.location.toLowerCase().replace(/\s+/g, '-')
      const imgs = (locationImages[day.location] || locationImages[locationKey] || fallbackImages[day.location] || fallbackImages[locationKey]) as { featured?: string; gallery?: string[] } | undefined

      // CRITICAL FIX: Also try locationMetadata.images from the plan data
      const metadataImages = day.locationMetadata?.images as { featured?: string; gallery?: string[] } | undefined

      // Merge images from all sources
      const allImages = {
        featured: imgs?.featured || metadataImages?.featured,
        gallery: [
          ...(imgs?.gallery || []),
          ...(metadataImages?.gallery || [])
        ].filter((url, idx, arr) => url && arr.indexOf(url) === idx) // Deduplicate
      }

      // Debug logging for missing images
      if (!allImages.featured && !allImages.gallery.length && index === 0) {
        console.log(`⚠️ No images found for "${day.location}"`, {
          locationImages: Object.keys(locationImages),
          fallbackImages: Object.keys(fallbackImages),
          hasMetadata: !!metadataImages,
          locationKey
        })
      }

      // IMPROVED: Build gallery with featured + gallery images
      const gal = allImages.gallery.length > 0 ? allImages.gallery : (allImages.featured ? [allImages.featured] : [])

      // IMPROVED: Hero image selection with fallback logic
      // 1. Try to use gallery images (rotate through them)
      // 2. If no gallery, use featured
      // 3. If hero fails to load, fallback to next gallery image
      const rotationKey = day.location.toLowerCase()
      const prevIdx = (usedImageIndexMap.get(rotationKey) ?? 0) % Math.max(gal.length, 1)
      let hero = gal.length > 0 ? (gal[prevIdx] || gal[0]) : (allImages.featured || '')

      // IMPROVED: If hero is broken, try next gallery image
      if (hero && brokenImages.has(hero) && gal.length > 1) {
        const nextIdx = (prevIdx + 1) % gal.length
        hero = gal[nextIdx] || gal[0]
        console.log(`🔄 Hero image broken, using next gallery image for ${day.location}`)
      }

      usedImageIndexMap.set(rotationKey, (prevIdx + 1) % Math.max(gal.length, 1))

      // Debug logging for hero image selection
      if (index === 0 || !hero) {
        console.log(`📸 Hero image for "${day.location}" (Day ${day.day}):`, {
          hero: hero ? `${hero.substring(0, 80)}...` : 'NONE',
          galleryCount: gal.length,
          featuredAvailable: !!allImages.featured,
          totalGalleryImages: allImages.gallery.length,
          brokenImagesCount: brokenImages.size
        })
      }

      // Ensure we have at least 5 images in gallery (excluding hero and broken images)
      let gallery = gal.filter((u) => u !== hero && !brokenImages.has(u))
      // If we have less than 5 gallery images, pad with remaining images from gal
      if (gallery.length < 5 && gal.length > 1) {
        const remaining = gal.filter((u) => !gallery.includes(u) && u !== hero && !brokenImages.has(u))
        gallery = [...gallery, ...remaining].slice(0, 5)
      }

      return {
        day: day.day,
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        location: day.location,
        emoji: LOCATION_EMOJIS[index % LOCATION_EMOJIS.length],
        distance: day.travelInfo?.distance ? `${Math.round(day.travelInfo.distance)} km` : undefined,
        duration: day.travelInfo?.duration ? `${Math.round(day.travelInfo.duration)}h` : undefined,
        image: hero || DAY_GRADIENTS[index % DAY_GRADIENTS.length],
        gallery,
        stops,
        accommodation,
        highlights,
        didYouKnow: day.didYouKnow,
        locationMetadata: day.locationMetadata // Pass through coordinates for day maps
      }
    })
  }, [plan, locationImages, fallbackImages])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - 20% more compact */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <nav className="flex items-center gap-6">
              <button onClick={onEdit} className="text-sm text-gray-700 hover:text-black font-medium">
                Change trip parameters
              </button>
              <button
                onClick={() => router.push('/locations')}
                className="text-sm text-gray-600 hover:text-black"
              >
                Explore
              </button>
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    showSignIn('/plan-v2')
                  } else {
                    router.push('/dashboard/trips')
                  }
                }}
                className="text-sm text-gray-600 hover:text-black"
              >
                Saved
              </button>
            </nav>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-xs text-gray-500 mr-2">
                To start editing the trip, save it to your trip library.
              </span>
              <button
                ref={saveBtnRef}
                onClick={handleSaveTrip}
                disabled={isSaving}
                className="px-4 py-1.5 text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full hover:shadow-lg transition-all font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Trip
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Trip Title - Editable with GROQ */}
      <div className="max-w-6xl mx-auto px-4 py-5">
        <div className="mb-5">
          {/* Editable Title */}
          <InlineEdit
            value={tripTitle || `${tripData.destinations[0]?.name} to ${tripData.destinations[tripData.destinations.length - 1]?.name}`}
            onChange={(value) => {
              setTripTitle(value)
              handleSaveMetadata('title', value)
            }}
            placeholder="Enter trip title..."
            variant="title"
            className="mb-2"
          />

          {/* Editable Subtitle */}
          <InlineEdit
            value={tripSubtitle}
            onChange={(value) => {
              setTripSubtitle(value)
              handleSaveMetadata('subtitle', value)
            }}
            placeholder="Click to add subtitle..."
            variant="subtitle"
            showEmptyState={true}
          />

          {/* Saving indicator */}
          {savingMetadata && (
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
              Saving...
            </div>
          )}

          {/* Auto-Generate Button */}
          <button
            onClick={generateHeadline}
            disabled={generatingHeadline}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1.5 mb-3 disabled:opacity-50"
          >
            ✨ {generatingHeadline ? 'Generating...' : 'Auto-Generate'}
          </button>

          {/* Trip Metadata - Smart Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Date Range */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
              <Calendar className="w-3.5 h-3.5" />
              {tripData.dateRange?.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
              {tripData.dateRange?.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>

            {/* Smart Tags */}
            {generateSmartTags(tripData, plan).map((tag, idx) => (
              <span key={idx} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${tag.color}`}>
                <span>{tag.icon}</span>
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Main Content - Adjusted for wider map */}
        <div className="grid grid-cols-12 gap-5">
          {/* Left Sidebar - Day Navigation - Compact with connection lines */}
          <div className="col-span-12 xl:col-span-2">
            <div className="sticky top-20">
              {/* ITINERARY Title - Match Complete Route style - SLIGHTLY BIGGER */}
              <div className="mb-3 px-1">
                <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-[18px] h-[18px] text-emerald-600" />
                  Itinerary
                </h3>
              </div>
              <div className="relative space-y-1">
                {itinerary.map((day: any, index: number) => (
                  <div
                    key={day.day}
                    className={`transition-all duration-300 ease-out ${
                      animatingDayNumber === day.day
                        ? 'animate-in slide-in-from-top-4 fade-in duration-500'
                        : deletingDayNumber === day.day
                        ? 'animate-out slide-out-to-right-4 fade-out duration-300'
                        : ''
                    }`}
                    style={{
                      transitionProperty: 'transform, opacity',
                    }}
                  >
                    {/* Day Box */}
                    <div
                      className="relative group"
                      onMouseEnter={() => setHoveredDayForDelete(day.day)}
                      onMouseLeave={() => setHoveredDayForDelete(null)}
                    >
                      {/* Connection line to selected day - BLACK */}
                      {selectedDay === day.day && (
                        <div className="absolute left-full top-1/2 -translate-y-1/2 w-5 h-0.5 bg-black z-10"></div>
                      )}

                      <button
                        onClick={() => handleDayClick(day.day)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all border-2 ${
                          selectedDay === day.day
                            ? 'bg-white border-black shadow-md scale-105' // BOLDER black border (border-2) for selected
                            : 'bg-white/50 border-gray-300 hover:bg-white hover:border-gray-400 hover:shadow-sm' // LIGHTER background, DARKER border (gray-300)
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                            selectedDay === day.day
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-300 text-gray-600'
                          }`}>
                            {day.day}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-xs font-semibold text-gray-900 truncate leading-tight cursor-pointer hover:text-emerald-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                openChangeLocation(day.day)
                              }}
                              title="Click to change location"
                            >
                              {day.location}
                            </div>
                            <div className="text-[10px] text-gray-500 leading-tight">{day.date}</div>
                          </div>
                        </div>
                      </button>

                      {/* Delete Button - Appears on Hover - LIGHTER & SMALLER */}
                      {hoveredDayForDelete === day.day && itinerary.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteDay(day.day)
                          }}
                          className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-600 flex items-center justify-center shadow-sm transition-all hover:scale-110 z-20"
                          title="Delete this day"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    {/* Add Day Button - INVISIBLE by default, VISIBLE on hover */}
                    <div
                      className="relative h-4 flex items-center justify-center group/add"
                      onMouseEnter={() => setHoveredAddDayIndex(index)}
                      onMouseLeave={() => setHoveredAddDayIndex(null)}
                    >
                      {/* Animated line - INVISIBLE by default, VISIBLE on hover */}
                      <div className={`absolute inset-x-0 h-px transition-all duration-300 ${
                        hoveredAddDayIndex === index
                          ? 'bg-gray-300 opacity-100'
                          : 'bg-transparent opacity-0'
                      }`} />

                      {/* Plus bubble - INVISIBLE by default, VISIBLE on hover with animation */}
                      <button
                        onClick={() => handleAddDayClick(day.day)}
                        className={`relative w-4 h-4 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-600 flex items-center justify-center shadow-sm transition-all duration-300 ${
                          hoveredAddDayIndex === index
                            ? 'opacity-100 scale-100'
                            : 'opacity-0 scale-75 pointer-events-none'
                        }`}
                        title="Add day after this"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Day Details - Narrower to make room for wider map */}
          <div className="col-span-12 xl:col-span-6" ref={dayContentRef}>
            <div className="space-y-4">
              {itinerary.filter((day: any) => day.day === selectedDay).map((day: any) => (
                <div key={day.day}>
                  {/* Hero Image - Real image or gradient fallback */}
                  <div className="relative h-64 rounded-xl mb-4 overflow-hidden shadow-lg">
                    {day.image && day.image.startsWith('http') && !brokenImages.has(day.image) ? (
                      // Real image from database
                      <>
                        <img
                          src={day.image}
                          alt={day.location}
                          className="w-full h-full object-cover"
                          onError={() => {
                            console.warn(`❌ Hero image failed to load for ${day.location}: ${day.image}`)
                            handleImageError(day.image)
                          }}
                          onLoad={() => {
                            console.log(`✅ Hero image loaded for ${day.location}`)
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      </>
                    ) : (
                      // Gradient fallback
                      <div
                        className="w-full h-full"
                        style={{
                          background: DAY_GRADIENTS[day.day % DAY_GRADIENTS.length]
                        }}
                        title={day.image && day.image.startsWith('http') ? `Image failed to load: ${day.image}` : 'No image available'}
                      />
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

                  {/* Image Gallery - Show at least 5 images if available */}
                  {(() => {
                    // Filter out broken images
                    const validGallery = day.gallery?.filter((img: string) => !brokenImages.has(img)) || []
                    if (validGallery.length === 0) return null

                    return (
                      <div className="mb-4">
                        <div className="grid grid-cols-5 gap-2">
                          {validGallery.slice(0, 5).map((img: string, idx: number) => (
                            <div
                              key={idx}
                              className="relative h-24 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 hover:scale-105 transition-all"
                              onClick={() => {
                                setSelectedImageUrl(img)
                                setIsImageModalOpen(true)
                              }}
                            >
                              <img
                                src={img}
                                alt={`${day.location} ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={() => handleImageError(img)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}

                  {/* Location Description - 3 lines with expand/collapse */}
                  {(() => {
                    const locationName = day.location
                    const isLoading = loadingDescriptions.has(locationName)
                    const description = locationDescriptions[locationName]
                    const isExpanded = expandedDescriptions.has(locationName)

                    // Fetch description when day is selected
                    if (!description && !isLoading && selectedDay === day.day) {
                      fetchLocationDescription(locationName)
                    }

                    const toggleExpand = () => {
                      setExpandedDescriptions(prev => {
                        const newSet = new Set(prev)
                        if (newSet.has(locationName)) {
                          newSet.delete(locationName)
                        } else {
                          newSet.add(locationName)
                        }
                        return newSet
                      })
                    }

                    return (
                      <div className="mb-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4 shadow-sm group">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Info className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-gray-900">About {locationName}</h4>
                                {day.locationMetadata?.country && (
                                  <span className="text-xs text-gray-400">
                                    {day.locationMetadata.region ? `${day.locationMetadata.region}, ` : ''}{day.locationMetadata.country}
                                  </span>
                                )}
                              </div>
                              {description && !isLoading && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingDescription(`${day.day}-description`)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-emerald-600"
                                  title="Edit description"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {isLoading ? (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                <span>Loading description...</span>
                              </div>
                            ) : editingDescription === `${day.day}-description` ? (
                              <div>
                                <textarea
                                  value={description || ''}
                                  onChange={(e) => {
                                    const newDescription = e.target.value
                                    setLocationDescriptions(prev => ({
                                      ...prev,
                                      [locationName]: newDescription
                                    }))
                                    handleSaveDayData(day.day, 'description', newDescription)
                                  }}
                                  onBlur={() => setEditingDescription(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') setEditingDescription(null)
                                  }}
                                  className="text-sm text-gray-700 leading-relaxed w-full px-3 py-2 rounded-lg border-2 border-emerald-400 focus:border-emerald-500 focus:outline-none bg-white resize-none"
                                  rows={4}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="mt-2 text-xs text-gray-500">
                                  Press Escape to cancel
                                </div>
                              </div>
                            ) : description ? (
                              <div>
                                <p
                                  className={`text-sm text-gray-700 leading-relaxed cursor-pointer hover:text-gray-900 transition-colors ${
                                    !isExpanded ? 'line-clamp-3' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingDescription(`${day.day}-description`)
                                  }}
                                  title="Click to edit description"
                                >
                                  {description}
                                </p>
                                {/* Show Read More button if text is longer than 3 lines */}
                                {description.length > 150 && (
                                  <button
                                    onClick={toggleExpand}
                                    className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                                  >
                                    {isExpanded ? (
                                      <>
                                        Show less
                                        <ChevronUp className="w-3 h-3" />
                                      </>
                                    ) : (
                                      <>
                                        Read more
                                        <ChevronDown className="w-3 h-3" />
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 italic">Description will load shortly...</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Day Map - Shows single location pin - STABLE, NO RELOAD ON HOVER */}
                  {(() => {
                    // Try locationMetadata first, fallback to structuredContext
                    const lat = day.locationMetadata?.latitude || structuredContext?.locations?.[day.location]?.latitude
                    const lng = day.locationMetadata?.longitude || structuredContext?.locations?.[day.location]?.longitude

                    if (!lat || !lng) return null

                    return (
                      <div key={`map-${day.location}-${lat}-${lng}`} className="mb-4 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="p-3 bg-gray-50 border-b border-gray-200">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-teal-600" />
                            {day.location}
                          </h3>
                        </div>
                        <TripOverviewMap
                          key={`trip-map-${day.location}-${lat}-${lng}`}
                          locations={[{
                            name: day.location,
                            latitude: lat,
                            longitude: lng
                          }]}
                          transportMode={tripData.transportMode || 'car'}
                          className="w-full h-48"
                        />
                      </div>
                    )
                  })()}

                  {/* Schedule - 20% more compact */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Today's Schedule
                    </h3>
                    <div className="space-y-3">
                      {day.stops.map((stop: any, idx: number) => {
                        const Icon = stop.icon
                        const badge = getActivityTypeBadge(stop.type)
                        const searchUrl = generateActivitySearchUrl(stop.title, day.location)
                        const stopKey = `${day.day}-${idx}-${stop.title}`

                        // CRITICAL FIX: Extract FULL activity name for specific POI images
                        // For "Visit Braaker Mühle" → use "Braaker Mühle Braak" (full POI name)
                        // For "Drive to Grand Junction" → use "Grand Junction"
                        const fullTitle = stop.title || ''

                        // Try to extract specific POI name (everything after "Visit", "Explore", etc.)
                        const poiMatch = /(?:Visit|Explore|See|Tour)\s+(.+)/i.exec(fullTitle)
                        const destMatch = /(?:to|in|at)\s+(.+)/i.exec(fullTitle)

                        // Use POI name if available, otherwise destination name
                        const specificName = poiMatch?.[1]?.trim() || destMatch?.[1]?.split(',')[0]?.trim() || null

                        // For POIs, include location context for better image search
                        const searchQuery = poiMatch && day.location
                          ? `${specificName} ${day.location}` // "Braaker Mühle Braak"
                          : specificName // "Grand Junction"

                        // Find image for this destination (try specific query first, then day location)
                        let destImageUrl: string | undefined

                        // Try specific POI/destination name first
                        if (searchQuery) {
                          const key = searchQuery.toLowerCase().replace(/\s+/g, '-')
                          const imgs = (
                            locationImages[searchQuery] ||
                            (locationImages as any)[key] ||
                            fallbackImages[searchQuery] ||
                            (fallbackImages as any)[key]
                          ) as { featured?: string; gallery?: string[] } | undefined

                          destImageUrl = imgs?.featured || imgs?.gallery?.[0]

                          // CRITICAL DEBUG: Log what we're looking for and what we found
                          console.log(`🔍 Looking for image:`, {
                            searchQuery,
                            key,
                            foundInLocationImages: !!(locationImages[searchQuery] || (locationImages as any)[key]),
                            foundInFallbackImages: !!(fallbackImages[searchQuery] || (fallbackImages as any)[key]),
                            destImageUrl,
                            availableFallbackKeys: Object.keys(fallbackImages).slice(0, 5)
                          })

                          // Debug log for POI images
                          if (!destImageUrl && poiMatch) {
                            console.log(`⚠️ No image found for POI "${searchQuery}"`)
                          }
                        }

                        // Fallback to day location if no destination-specific image
                        if (!destImageUrl && day.location) {
                          const dayKey = day.location.toLowerCase().replace(/\s+/g, '-')
                          const dayImgs = (
                            locationImages[day.location] ||
                            (locationImages as any)[dayKey] ||
                            fallbackImages[day.location] ||
                            (fallbackImages as any)[dayKey]
                          ) as { featured?: string; gallery?: string[] } | undefined

                          destImageUrl = dayImgs?.featured || dayImgs?.gallery?.[0]
                        }

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
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  {/* Activity type badge */}
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.color}`}>
                                      <span>{badge.emoji}</span>
                                      <span>{badge.label}</span>
                                    </span>
                                  </div>

                                  {/* Editable title */}
                                  {editingActivity === `${day.day}-${idx}-title` ? (
                                    <input
                                      value={stop.title}
                                      onChange={(e) => {
                                        const newTitle = e.target.value
                                        setDays(days.map((d: any) =>
                                          d.day === day.day
                                            ? {
                                                ...d,
                                                items: d.items.map((item: any, i: number) =>
                                                  i === idx ? { ...item, title: newTitle } : item
                                                )
                                              }
                                            : d
                                        ))
                                        handleSaveActivityData(day.day, idx, 'title', newTitle)
                                      }}
                                      onBlur={() => setEditingActivity(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') setEditingActivity(null)
                                        if (e.key === 'Escape') setEditingActivity(null)
                                      }}
                                      className="text-sm font-semibold text-gray-900 w-full px-2 py-1 rounded border-2 border-emerald-400 focus:border-emerald-500 focus:outline-none bg-white"
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <a
                                        href={searchUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-semibold text-gray-900 hover:text-emerald-600 hover:underline transition-colors cursor-pointer inline-block"
                                      >
                                        {stop.title}
                                      </a>
                                      <span className="text-xs text-gray-400">
                                        {day.location}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEditingActivity(`${day.day}-${idx}-title`)
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-emerald-600"
                                        title="Edit activity"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}

                                  {/* Editable duration */}
                                  {editingActivity === `${day.day}-${idx}-duration` ? (
                                    <input
                                      value={stop.duration || ''}
                                      onChange={(e) => {
                                        const newDuration = e.target.value
                                        setDays(days.map((d: any) =>
                                          d.day === day.day
                                            ? {
                                                ...d,
                                                items: d.items.map((item: any, i: number) =>
                                                  i === idx ? { ...item, duration: newDuration } : item
                                                )
                                              }
                                            : d
                                        ))
                                        // Extract numeric duration for backend
                                        const numericDuration = parseFloat(newDuration.replace(/[^\d.]/g, ''))
                                        if (!isNaN(numericDuration)) {
                                          handleSaveActivityData(day.day, idx, 'duration', numericDuration)
                                        }
                                      }}
                                      onBlur={() => setEditingActivity(null)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') setEditingActivity(null)
                                        if (e.key === 'Escape') setEditingActivity(null)
                                      }}
                                      className="text-xs text-gray-500 w-20 px-2 py-0.5 rounded border-2 border-emerald-400 focus:border-emerald-500 focus:outline-none bg-white mt-0.5"
                                      placeholder="2h"
                                      autoFocus
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : stop.duration ? (
                                    <div
                                      className="text-xs text-gray-500 mt-0.5 cursor-pointer hover:text-emerald-600 transition-colors inline-block"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingActivity(`${day.day}-${idx}-duration`)
                                      }}
                                      title="Click to edit duration"
                                    >
                                      {stop.duration}
                                    </div>
                                  ) : (
                                    <div
                                      className="text-xs text-gray-400 mt-0.5 cursor-pointer hover:text-gray-600 transition-colors italic inline-block"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingActivity(`${day.day}-${idx}-duration`)
                                      }}
                                      title="Click to add duration"
                                    >
                                      Add duration...
                                    </div>
                                  )}
                                  {/* Brave API Enrichment */}
                                  <ActivityEnrichment activityName={stop.title} location={day.location} tripType={tripData.tripType || undefined} tripVision={(tripData as any).tripVision} />

                                  {/* Saved notes/checklist preview */}
                                  {notesMap[stopKey]?.noteText && (
                                    <div
                                      className="mt-2 border border-gray-300 rounded-xl p-2 bg-white/80 hover:shadow-sm transition-shadow cursor-pointer"
                                      onClick={() => {
                                        setOpenNotesKey(stopKey)
                                        setOpenContext({
                                          dayIndex: day.day,
                                          stopIndex: idx,
                                          locationName: day.location,
                                          activityTitle: stop.title,
                                          locationId: day.locationMetadata?.id,
                                        })
                                      }}
                                    >
                                      <div className="text-[11px] text-gray-800 whitespace-pre-line line-clamp-4">
                                        {notesMap[stopKey].noteText}
                                      </div>
                                    </div>
                                  )}

                                  {checklistsMap[stopKey]?.items?.length ? (
                                    <div
                                      className="mt-2 border border-gray-300 rounded-xl p-2 bg-white/80 hover:shadow-sm transition-shadow cursor-pointer"
                                      onClick={() => {
                                        setOpenChecklistKey(stopKey)
                                        setOpenContext({
                                          dayIndex: day.day,
                                          stopIndex: idx,
                                          locationName: day.location,
                                          activityTitle: stop.title,
                                          locationId: day.locationMetadata?.id,
                                        })
                                      }}
                                    >
                                      <div className="space-y-1">
                                        {checklistsMap[stopKey].items.slice(0, 4).map((it, i) => (
                                          <label key={i} className="flex items-center gap-2 text-[11px] text-gray-700">
                                            <input
                                              type="checkbox"
                                              checked={!!it.checked}
                                              onClick={(e) => e.stopPropagation()}
                                              onChange={(e) => {
                                                e.stopPropagation()
                                                setChecklistsMap((m) => {
                                                  const current = m[stopKey] || { clientUid: (typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `${Date.now()}-${Math.random()}`), items: [] }
                                                  const arr = [...(current.items || [])]
                                                  if (arr[i]) arr[i] = { ...arr[i], checked: (e.target as HTMLInputElement).checked }
                                                  return { ...m, [stopKey]: { ...current, items: arr } }
                                                })
                                              }}
                                              className="h-3.5 w-3.5 rounded-full border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span>{it.text}</span>
                                          </label>
                                        ))}
                                        {checklistsMap[stopKey].items.length > 4 && (
                                          <div className="text-[10px] text-gray-500">+{checklistsMap[stopKey].items.length - 4} more</div>
                                        )}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>

                                {/* Action Bubbles - icon-only default, hover bubble + tooltip */}
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                  <div className="flex items-center gap-1.5">
                                  {/* Notes */}
                                  <div className="relative group/note">
                                    <button
                                      onClick={() => {
                                        setOpenNotesKey(stopKey)
                                        setOpenContext({
                                          dayIndex: day.day,
                                          stopIndex: idx,
                                          locationName: day.location,
                                          activityTitle: stop.title,
                                          locationId: day.locationMetadata?.id,
                                        })
                                      }}
                                      className="w-7 h-7 rounded-full flex items-center justify-center transition-colors group/note hover:bg-gray-100"
                                      title="Add notes"
                                      aria-label="Add notes"
                                    >
                                      <StickyNote className="w-3.5 h-3.5 text-gray-600 group-hover/note:text-gray-900" />
                                    </button>
                                    {/* Tooltip */}
                                    <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[10px] rounded-md bg-gray-900 text-white opacity-0 group-hover/note:opacity-100 transition-opacity">
                                      Add notes
                                    </div>
                                  </div>
                                  {/* Checklist */}
                                  <div className="relative group/checklist">
                                    <button
                                      onClick={() => {
                                        setOpenChecklistKey(stopKey)
                                        setOpenContext({
                                          dayIndex: day.day,
                                          stopIndex: idx,
                                          locationName: day.location,
                                          activityTitle: stop.title,
                                          locationId: day.locationMetadata?.id,
                                        })
                                      }}
                                      className="w-7 h-7 rounded-full flex items-center justify-center transition-colors group/checklist hover:bg-gray-100"
                                      title="Add checklist"
                                      aria-label="Add checklist"
                                    >
                                      <CheckSquare className="w-3.5 h-3.5 text-gray-600 group-hover/checklist:text-gray-900" />
                                    </button>
                                    {/* Tooltip */}
                                    <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[10px] rounded-md bg-gray-900 text-white opacity-0 group-hover/checklist:opacity-100 transition-opacity">
                                      Add checklist
                                    </div>
                                  </div>
                                  </div>
                                  {destImageUrl && (
                                    <img
                                      src={destImageUrl}
                                      alt={specificName || day.location}
                                      loading="lazy"
                                      className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                                      onError={(e) => {
                                        // Hide broken images
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                        console.warn(`❌ Failed to load image for "${specificName}":`, destImageUrl)
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Accommodation - 20% more compact */}
                  {day.accommodation && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow mb-4 group">
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
                            {/* Editable accommodation name */}
                            {editingAccommodation === `${day.day}-name` ? (
                              <input
                                value={day.accommodation.name}
                                onChange={(e) => {
                                  const newName = e.target.value
                                  setDays(days.map((d: any) =>
                                    d.day === day.day
                                      ? { ...d, accommodation: { ...d.accommodation, name: newName } }
                                      : d
                                  ))
                                  handleSaveAccommodationData(day.day, 'name', newName)
                                }}
                                onBlur={() => setEditingAccommodation(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') setEditingAccommodation(null)
                                  if (e.key === 'Escape') setEditingAccommodation(null)
                                }}
                                className="text-sm font-semibold text-gray-900 w-full px-2 py-1 rounded border-2 border-emerald-400 focus:border-emerald-500 focus:outline-none bg-white mb-0.5"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <div className="flex items-center gap-2 mb-0.5">
                                <h4
                                  className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingAccommodation(`${day.day}-name`)
                                  }}
                                  title="Click to edit accommodation name"
                                >
                                  {day.accommodation.name}
                                </h4>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingAccommodation(`${day.day}-name`)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-emerald-600"
                                  title="Edit accommodation"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                              <div className="flex items-center gap-0.5">
                                <span className="text-yellow-500">★</span>
                                <span className="font-semibold">{day.accommodation.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {/* Editable accommodation price */}
                          {editingAccommodation === `${day.day}-price` ? (
                            <input
                              value={day.accommodation.price}
                              onChange={(e) => {
                                const newPrice = e.target.value
                                setDays(days.map((d: any) =>
                                  d.day === day.day
                                    ? { ...d, accommodation: { ...d.accommodation, price: newPrice } }
                                    : d
                                ))
                                handleSaveAccommodationData(day.day, 'price', newPrice)
                              }}
                              onBlur={() => setEditingAccommodation(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditingAccommodation(null)
                                if (e.key === 'Escape') setEditingAccommodation(null)
                              }}
                              className="text-lg font-semibold text-gray-900 w-24 px-2 py-1 rounded border-2 border-emerald-400 focus:border-emerald-500 focus:outline-none bg-white text-right"
                              placeholder="$120"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <div
                              className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-emerald-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingAccommodation(`${day.day}-price`)
                              }}
                              title="Click to edit price"
                            >
                              {day.accommodation.price}
                            </div>
                          )}
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
                          href={`https://www.sleek.com/s/${encodeURIComponent(day.location)}/homes`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackAffiliateClick('sleek', day.location, 'v2_results_accommodation')}
                          className="flex-1 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Book on sleek
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
                        {day.highlights.map((highlight: string, idx: number) => {
                          const q = encodeURIComponent(`${highlight} ${day.location}`)
                          const href = `https://search.brave.com/search?q=${q}`
                          const cacheKey = `${highlight}|${day.location}`
                          const description = highlightDescriptions[cacheKey]

                          return (
                            <div key={idx} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-gray-700 font-medium hover:text-emerald-600 transition-colors block"
                                  onClick={() => trackAffiliateClick('brave-search', day.location, 'v2_results_dont_miss')}
                                >
                                  {highlight}
                                </a>
                                {description && (
                                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{description}</p>
                                )}
                              </div>
                            </div>
                          )
                        })}
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

                  {/* POIs - Points of Interest from planning */}
                  {structuredContext?.worthwhilePOIs && structuredContext.worthwhilePOIs.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-purple-600" />
                        Points of Interest
                      </h3>
                      <div className="space-y-2">
                        {structuredContext.worthwhilePOIs.slice(0, 5).map((poi: any, idx: number) => (
                          <POIItem key={idx} poi={poi} location={day.location} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Did You Know? - Interesting Facts */}
                  {day.didYouKnow && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 shadow-sm group">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold flex items-center gap-1.5 text-blue-900">
                          <Info className="w-4 h-4 text-blue-600" />
                          Did You Know?
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingDescription(`${day.day}-didYouKnow`)
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-blue-600"
                          title="Edit fact"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                      {editingDescription === `${day.day}-didYouKnow` ? (
                        <div>
                          <textarea
                            value={day.didYouKnow}
                            onChange={(e) => {
                              const newFact = e.target.value
                              setDays(days.map((d: any) =>
                                d.day === day.day ? { ...d, didYouKnow: newFact } : d
                              ))
                              handleSaveDayData(day.day, 'didYouKnow', newFact)
                            }}
                            onBlur={() => setEditingDescription(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setEditingDescription(null)
                            }}
                            className="text-xs text-blue-800 leading-relaxed w-full px-3 py-2 rounded-lg border-2 border-blue-400 focus:border-blue-500 focus:outline-none bg-white resize-none"
                            rows={3}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="mt-2 text-xs text-blue-600">
                            Press Escape to cancel
                          </div>
                        </div>
                      ) : (
                        <p
                          className="text-xs text-blue-800 leading-relaxed cursor-pointer hover:text-blue-900 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingDescription(`${day.day}-didYouKnow`)
                          }}
                          title="Click to edit fact"
                        >
                          {day.didYouKnow}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Map & Trip Stats - WIDER AND TALLER */}
          <div className="col-span-12 xl:col-span-4">
            <div className="xl:block hidden">
              <div className="sticky top-20 space-y-4">
                {/* Overall Trip Map - Shows entire route with numbered markers - DOUBLE HEIGHT */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                      <MapPin className="w-[18px] h-[18px] text-teal-600" />
                      Complete Route
                    </h3>
                    <button
                      onClick={() => openRouteSelectionModal()}
                      disabled={isGeneratingAlternative}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      title="Generate alternative route with same locations in different order"
                    >
                      {isGeneratingAlternative ? (
                        <>
                          <div className="w-3 h-3 border-2 border-gray-700 border-t-transparent rounded-full animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <span>🔄</span>
                          <span>Change Route</span>
                        </>
                      )}
                    </button>
                  </div>
                  {(() => {
                    const routeLocations = (plan?.days
                      ?.filter((day: any) => {
                        // Check multiple sources for coordinates
                        const hasMetadata = day.locationMetadata?.latitude && day.locationMetadata?.longitude
                        const hasStructured = structuredContext?.locations?.[day.location]?.latitude && structuredContext?.locations?.[day.location]?.longitude
                        return hasMetadata || hasStructured
                      })
                      ?.map((day: any) => {
                        // Use locationMetadata first, fallback to structuredContext
                        const lat = day.locationMetadata?.latitude || structuredContext?.locations?.[day.location]?.latitude
                        const lng = day.locationMetadata?.longitude || structuredContext?.locations?.[day.location]?.longitude

                        return {
                          name: day.location,
                          latitude: lat,
                          longitude: lng,
                          dayNumber: day.day
                        }
                      }) || []) as any[]

                    // REMOVED highlightedIndex to prevent flickering/animation on hover
                    // Map stays static and shows complete route without constant resets
                    // STABLE KEY: Prevents map from reloading on hover/state changes

                    const mapKey = routeLocations.map((loc: any) => `${loc.name}-${loc.latitude}-${loc.longitude}`).join('|')

                    return (
                      <TripOverviewMap
                        key={`complete-route-${mapKey}`}
                        locations={routeLocations.map(({ dayNumber, ...rest }: any) => rest)}
                        transportMode={tripData.transportMode || 'car'}
                        previewLocations={previewLocations || undefined}
                        className="w-full h-[640px]"
                      />
                    )
                  })()}
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
                        <span className="text-xs text-gray-600">Approx. Total Trip Cost Estimation</span>
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
                  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm group">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5">
                        <Info className="w-4 h-4 text-gray-400" />
                        Travel Tips
                      </h3>
                      <button
                        onClick={() => {
                          const newTips = [...(plan.tips || []), '']
                          Object.assign(plan, { tips: newTips })
                          setEditingTip(newTips.length - 1)
                          handleSaveTips(newTips)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 hover:text-emerald-700 text-xs font-medium flex items-center gap-1"
                        title="Add tip"
                      >
                        <Plus className="w-3 h-3" />
                        Add Tip
                      </button>
                    </div>
                    <div className="space-y-2">
                      {plan.tips.map((tip: string, idx: number) => (
                        <div key={idx} className="flex items-start gap-2 group/tip">
                          <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0"></div>
                          {editingTip === idx ? (
                            <div className="flex-1">
                              <textarea
                                value={tip}
                                onChange={(e) => {
                                  const newTips = [...plan.tips]
                                  newTips[idx] = e.target.value
                                  Object.assign(plan, { tips: newTips })
                                  handleSaveTips(newTips)
                                }}
                                onBlur={() => {
                                  // Remove empty tips on blur
                                  if (!tip.trim()) {
                                    const newTips = plan.tips.filter((_: any, i: number) => i !== idx)
                                    Object.assign(plan, { tips: newTips })
                                    handleSaveTips(newTips)
                                  }
                                  setEditingTip(null)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    // Remove empty tips on escape
                                    if (!tip.trim()) {
                                      const newTips = plan.tips.filter((_: any, i: number) => i !== idx)
                                      Object.assign(plan, { tips: newTips })
                                      handleSaveTips(newTips)
                                    }
                                    setEditingTip(null)
                                  }
                                }}
                                className="text-xs text-gray-700 leading-relaxed w-full px-2 py-1 rounded border-2 border-emerald-400 focus:border-emerald-500 focus:outline-none bg-white resize-none"
                                rows={2}
                                autoFocus
                                placeholder="Enter travel tip..."
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="mt-1 text-[10px] text-gray-500">
                                Press Escape to cancel
                              </div>
                            </div>
                          ) : (
                            <>
                              <span
                                className="text-xs text-gray-700 leading-relaxed flex-1 cursor-pointer hover:text-gray-900 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingTip(idx)
                                }}
                                title="Click to edit tip"
                              >
                                {tip}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const newTips = plan.tips.filter((_: any, i: number) => i !== idx)
                                  Object.assign(plan, { tips: newTips })
                                  handleSaveTips(newTips)
                                  toast.success('Tip deleted')
                                }}
                                className="opacity-0 group-hover/tip:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                                title="Delete tip"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          )}
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

      {/* Image Modal - Full screen image viewer */}
      <Modal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title="Location Image"
        size="xl"
      >
        {selectedImageUrl && (
          <div className="relative">
            <img
              src={selectedImageUrl}
              alt="Location"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        )}
      </Modal>

      {/* Saved Trip Summary Modal - Redesigned */}
      <Modal
        isOpen={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        title=""
        size="lg"
      >
        <div className="space-y-6">
          {/* Success Icon & Title */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Saved Successfully! 🎉</h2>
            <p className="text-sm text-gray-600">
              Your {plan?.days?.length || 0}-day adventure is ready to explore
            </p>
          </div>

          {/* Trip Title & Subtitle Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2">{tripTitle || 'Your Trip'}</h3>
            {tripSubtitle && (
              <p className="text-sm text-gray-600 line-clamp-2">{tripSubtitle}</p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {tripData.dateRange?.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' - '}
                {tripData.dateRange?.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Trip Summary */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div>
                <div className="text-2xl font-bold text-emerald-600">{plan?.days?.length || 0}</div>
                <div className="text-xs text-gray-600">Days</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-teal-600">
                  {plan?.days?.reduce((sum: number, d: any) => sum + (d.items?.length || 0), 0) || 0}
                </div>
                <div className="text-xs text-gray-600">Activities</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(plan?.days?.map((d: any) => d.location)).size || 0}
                </div>
                <div className="text-xs text-gray-600">Locations</div>
              </div>
            </div>

            {/* Location Images Preview */}
            <div className="grid grid-cols-3 gap-2">
              {(plan?.days || []).slice(0, 6).map((d: any, idx: number) => {
                const key = d.location?.toLowerCase().replace(/\s+/g, '-')

                // Try multiple sources for images
                const imgs = (
                  locationImages[d.location] ||
                  (locationImages as any)[key] ||
                  fallbackImages[d.location] ||
                  (fallbackImages as any)[key]
                ) as { featured?: string; gallery?: string[] } | undefined

                // Also try locationMetadata images from the plan
                const metadataImage = d.locationMetadata?.images?.featured || d.locationMetadata?.images?.gallery?.[0]

                const url = imgs?.featured || imgs?.gallery?.[0] || metadataImage

                // Debug log for missing images
                if (!url && idx === 0) {
                  console.log(`⚠️ No image for saved trip modal: "${d.location}"`, {
                    hasLocationImages: !!locationImages[d.location],
                    hasFallbackImages: !!fallbackImages[d.location],
                    hasMetadata: !!metadataImage,
                    locationImagesKeys: Object.keys(locationImages).slice(0, 5),
                    fallbackImagesKeys: Object.keys(fallbackImages).slice(0, 5)
                  })
                }

                return url ? (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={d.location}
                      className="w-full h-20 object-cover rounded-lg border-2 border-white shadow-sm group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        // Hide broken images
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        console.warn(`❌ Failed to load saved trip image for "${d.location}":`, url)
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-white text-xs font-medium truncate">{d.location}</span>
                    </div>
                  </div>
                ) : (
                  <div key={idx} className="w-full h-20 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex flex-col items-center justify-center">
                    <MapPin className="w-5 h-5 text-gray-500 mb-1" />
                    <span className="text-[9px] text-gray-600 font-medium truncate px-1 max-w-full">{d.location}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setShowSavedModal(false)}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Continue Planning
            </button>
            <button
              onClick={async () => {
                setShowSavedModal(false)
                await animateFlyToAvatar()
                setTimeout(() => router.push('/dashboard/trips'), 600)
              }}
              className="flex-1 px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all"
            >
              View My Trips →
            </button>
          </div>
        </div>
      </Modal>

      {/* Notes / Checklist Modals */}
      {openNotesKey && openContext && (
        <NotesModal
          isOpen={true}
          onClose={() => setOpenNotesKey(null)}
          context={openContext}
          initialText={notesMap[openNotesKey]?.noteText}
          onSaved={({ clientUid, noteText }: { clientUid: string; noteText: string }) => {
            setNotesMap((m) => ({ ...m, [openNotesKey as string]: { clientUid, noteText } }))
          }}
        />
      )}
      {openChecklistKey && openContext && (
        <ChecklistModal
          isOpen={true}
          onClose={() => setOpenChecklistKey(null)}
          context={openContext}
          initialItems={checklistsMap[openChecklistKey]?.items || []}
          onSaved={({ clientUid, items, templateType }: { clientUid: string; items: { text: string; checked?: boolean }[]; templateType?: string }) => {
            setChecklistsMap((m) => ({ ...m, [openChecklistKey as string]: { clientUid, items, templateType } }))
          }}
        />
      )}

      {/* Add Day Modal */}
      {showAddDayModal && (
        <Modal
          isOpen={showAddDayModal}
          onClose={() => {
            if (!isLoadingNewDay) {
              setShowAddDayModal(false)
              setNewDayLocation('')
            }
          }}
          title="Add New Day"
        >
          <div className="space-y-4">
            {/* Context Info */}
            {(() => {
              const previousDay = days[addDayAfterIndex! - 1]
              const nextDay = days[addDayAfterIndex!]
              const transportMode = tripData.transportMode || 'car'

              // Calculate distance if both locations have coordinates
              let distance = null
              if (previousDay?.locationMetadata && nextDay?.locationMetadata) {
                const R = 6371 // Earth's radius in km
                const dLat = (nextDay.locationMetadata.latitude - previousDay.locationMetadata.latitude) * Math.PI / 180
                const dLon = (nextDay.locationMetadata.longitude - previousDay.locationMetadata.longitude) * Math.PI / 180
                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(previousDay.locationMetadata.latitude * Math.PI / 180) *
                  Math.cos(nextDay.locationMetadata.latitude * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2)
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
                distance = Math.round(R * c)
              }

              return (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-semibold text-gray-900 mb-1">Trip Context</p>
                      <div className="space-y-1 text-gray-700">
                        <p>• From: <span className="font-medium">{previousDay?.location || 'Start'}</span></p>
                        {nextDay && <p>• To: <span className="font-medium">{nextDay.location}</span></p>}
                        <p>• Transport: <span className="font-medium capitalize">{transportMode}</span></p>
                        {distance && (
                          <p>• Distance between: <span className="font-medium">{distance} km</span></p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Smart Suggestions */}
            {isLoadingSuggestions ? (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span>Finding locations along your route...</span>
                </div>
              </div>
            ) : suggestedLocations.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suggested Locations
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {suggestedLocations.map((location, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNewDayLocation(location)}
                      className={`px-3 py-2 text-sm rounded-lg border-2 transition-all text-left ${
                        newDayLocation === location
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                          : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 text-gray-700'
                      }`}
                      disabled={isLoadingNewDay}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Location Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {suggestedLocations.length > 0 ? 'Or enter custom location' : 'Enter location'}
              </label>
              <input
                type="text"
                value={newDayLocation}
                onChange={(e) => setNewDayLocation(e.target.value)}
                placeholder="Enter location (e.g., Paris, Tokyo, New York)"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                disabled={isLoadingNewDay}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoadingNewDay) {
                    handleAddDaySubmit()
                  }
                }}
              />
            </div>

            {/* Loading State */}
            {isLoadingNewDay && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-600">Loading location data...</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleAddDaySubmit}
                disabled={isLoadingNewDay || !newDayLocation.trim()}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingNewDay ? 'Adding...' : 'Add Day'}
              </Button>
              <Button
                onClick={() => {
                  setShowAddDayModal(false)
                  setNewDayLocation('')
                }}
                variant="outline"
                disabled={isLoadingNewDay}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
          </Modal>
        )}

      {/* Change Route Modal */}
      {showRouteModal && (
        <Modal isOpen={showRouteModal} onClose={() => { setShowRouteModal(false); setPreviewLocations(null) }} title="Change Route" size="md" blur={false}>
          <div className="p-2">
            <p className="text-sm text-gray-600 mb-4">Select an alternative route order. Hover to preview on the map.</p>

            <div className="space-y-2">
              {routeOptions.map((opt, idx) => (
                <button
                  key={opt.id + idx}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    selectedRouteIndex === idx ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => {
                    const coords = orderToCoords(opt.order)
                    if (coords.length >= 2) setPreviewLocations(coords)
                  }}
                  onMouseLeave={() => setPreviewLocations(null)}
                  onClick={() => setSelectedRouteIndex(idx)}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[60%]">{opt.order.join(' → ')}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-5">
              <Button className="flex-1" onClick={applySelectedRoute} disabled={selectedRouteIndex === null}>Apply</Button>
              <Button className="flex-1" variant="outline" onClick={() => { setShowRouteModal(false); setPreviewLocations(null) }}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Change Location Modal */}
      {showChangeLocationModal && (
        <Modal isOpen={showChangeLocationModal} onClose={() => setShowChangeLocationModal(false)} title="Change Location" size="md">
          <div className="p-2">
            <p className="text-sm text-gray-600 mb-4">Search for a new location. We will fetch coordinates, images, and POIs.</p>

            <div className="mb-4">
              <LocationAutocomplete
                value={changeLocationValue}
                onChange={(val, meta) => {
                  setChangeLocationValue(val)
                  setChangeLocationMeta(meta)
                }}
                placeholder="Enter a city or place"
              />
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleConfirmChangeLocation} disabled={isChangingLocation || !changeLocationValue.trim()}>
                {isChangingLocation ? 'Updating…' : 'Update Location'}
              </Button>
              <Button className="flex-1" variant="outline" onClick={() => setShowChangeLocationModal(false)} disabled={isChangingLocation}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}


      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}

