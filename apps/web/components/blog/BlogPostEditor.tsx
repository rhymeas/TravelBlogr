'use client'

/**
 * Blog Post Editor Component
 * 
 * Smart inline editor for travel blog posts with:
 * - Click-to-edit all fields
 * - Location-based POI suggestions
 * - AI content assistance
 * - Rich text editing
 * - Image management
 * - Day-by-day itinerary builder
 */

import { useState } from 'react'
import { Plus, MapPin, Image as ImageIcon, Sparkles, ChevronDown, ChevronUp, Search, Lightbulb } from 'lucide-react'
import { POISuggestionsPanel } from '@/components/blog/POISuggestionsPanel'
import { POISuggestion, TripActivity } from '@/lib/services/locationIntelligenceService'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: {
    destination?: string
    introduction?: string
    highlights?: string[]
    days?: Array<{
      day_number: number
      title: string
      description: string
      activities: string[]
      tips?: string
      location?: {
        name: string
        coordinates?: { lat: number; lng: number }
      }
    }>
    practicalInfo?: {
      bestTime?: string
      budget?: string
      packing?: string[]
    }
  }
  featured_image?: string
  category?: string
  tags?: string[]
}

interface BlogPostEditorProps {
  post: BlogPost
  onChange: (post: Partial<BlogPost>) => void
  onSave: () => void
}

export function BlogPostEditor({ post, onChange, onSave }: BlogPostEditorProps) {
  const [showPOIPanel, setShowPOIPanel] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [expandedDay, setExpandedDay] = useState<number | null>(null)

  const content = post.content || {}
  const days = content.days || []

  const handleTitleChange = (title: string) => {
    onChange({ title })
  }

  const handleExcerptChange = (excerpt: string) => {
    onChange({ excerpt })
  }

  const handleDestinationChange = (destination: string) => {
    onChange({
      content: {
        ...content,
        destination
      }
    })
    setSelectedLocation(destination)
    // Auto-open suggestions panel when destination is set
    if (destination && destination.length > 2) {
      setShowPOIPanel(true)
    }
  }

  const handleSelectPOI = (poi: POISuggestion) => {
    console.log('Selected POI:', poi)
    // Add POI as a new activity to the current day or create a new day
    const newActivity = `${poi.name}${poi.description ? ` - ${poi.description}` : ''}`

    if (days.length === 0) {
      // Create first day with this POI
      handleAddDay()
    }

    // Add to the last day
    const lastDayIndex = days.length - 1
    const lastDay = days[lastDayIndex]
    const updatedDays = [...days]
    updatedDays[lastDayIndex] = {
      ...lastDay,
      activities: [...(lastDay.activities || []), newActivity]
    }

    onChange({
      content: {
        ...content,
        days: updatedDays
      }
    })
  }

  const handleSelectActivity = (activity: TripActivity) => {
    console.log('Selected activity:', activity)
    // Add activity to the current day or create a new day
    if (days.length === 0) {
      handleAddDay()
    }

    const lastDayIndex = days.length - 1
    const lastDay = days[lastDayIndex]
    const updatedDays = [...days]
    updatedDays[lastDayIndex] = {
      ...lastDay,
      activities: [...(lastDay.activities || []), activity.name],
      tips: activity.tips || lastDay.tips
    }

    onChange({
      content: {
        ...content,
        days: updatedDays
      }
    })
  }

  const handleIntroductionChange = (introduction: string) => {
    onChange({
      content: {
        ...content,
        introduction
      }
    })
  }

  const handleAddDay = () => {
    const newDay = {
      day_number: days.length + 1,
      title: `Day ${days.length + 1}`,
      description: '',
      activities: [],
      location: { name: content.destination || '' }
    }

    onChange({
      content: {
        ...content,
        days: [...days, newDay]
      }
    })
  }

  const handleDayChange = (dayIndex: number, updates: Partial<typeof days[0]>) => {
    const updatedDays = [...days]
    updatedDays[dayIndex] = { ...updatedDays[dayIndex], ...updates }

    onChange({
      content: {
        ...content,
        days: updatedDays
      }
    })
  }

  const handleAddActivity = (dayIndex: number, activity: string) => {
    const day = days[dayIndex]
    const updatedActivities = [...(day.activities || []), activity]

    handleDayChange(dayIndex, { activities: updatedActivities })
  }

  return (
    <div className="space-y-8">
      {/* Cover Image */}
      <div className="relative group">
        {post.featured_image ? (
          <div className="relative h-96 rounded-2xl overflow-hidden">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <button className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-white" />
              <span className="ml-2 text-white">Change Cover Image</span>
            </button>
          </div>
        ) : (
          <button className="w-full h-96 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center hover:border-rausch-500 transition-colors">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-2" />
            <span className="text-gray-600">Add Cover Image</span>
          </button>
        )}
      </div>

      {/* Title */}
      <div>
        <input
          type="text"
          value={post.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Enter your blog post title..."
          className="w-full text-4xl font-bold text-gray-900 border-none focus:outline-none focus:ring-0 placeholder-gray-400"
        />
      </div>

      {/* Excerpt */}
      <div>
        <textarea
          value={post.excerpt || ''}
          onChange={(e) => handleExcerptChange(e.target.value)}
          placeholder="Write a compelling excerpt that summarizes your post..."
          rows={3}
          className="w-full text-xl text-gray-600 border-none focus:outline-none focus:ring-0 placeholder-gray-400 resize-none"
        />
      </div>

      {/* Destination */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Destination
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={content.destination || ''}
            onChange={(e) => handleDestinationChange(e.target.value)}
            placeholder="Where is this trip about?"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rausch-500 focus:border-transparent"
          />
        </div>
        {content.destination && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{content.destination}</span>
            </div>
            <button
              onClick={() => setShowPOIPanel(!showPOIPanel)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-rausch-600 hover:bg-rausch-50 rounded-lg transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              {showPOIPanel ? 'Hide' : 'Show'} Smart Suggestions
            </button>
          </div>
        )}
      </div>

      {/* POI Suggestions Panel */}
      {showPOIPanel && selectedLocation && (
        <POISuggestionsPanel
          location={selectedLocation}
          onSelectPOI={handleSelectPOI}
          onSelectActivity={handleSelectActivity}
          onClose={() => setShowPOIPanel(false)}
        />
      )}

      {/* Introduction */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Introduction
          </label>
          <button className="flex items-center gap-1 text-sm text-rausch-600 hover:text-rausch-700">
            <Sparkles className="h-4 w-4" />
            AI Assist
          </button>
        </div>
        <textarea
          value={content.introduction || ''}
          onChange={(e) => handleIntroductionChange(e.target.value)}
          placeholder="Write an engaging introduction that hooks your readers..."
          rows={6}
          className="w-full text-gray-900 border-none focus:outline-none focus:ring-0 placeholder-gray-400 resize-none"
        />
      </div>

      {/* Day-by-Day Itinerary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Day-by-Day Itinerary</h2>
          <button
            onClick={handleAddDay}
            className="flex items-center gap-2 px-4 py-2 bg-rausch-600 text-white rounded-lg hover:bg-rausch-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Day
          </button>
        </div>

        {days.map((day, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200">
            <button
              onClick={() => setExpandedDay(expandedDay === index ? null : index)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-rausch-100 rounded-full flex items-center justify-center">
                  <span className="text-rausch-700 font-semibold">{day.day_number}</span>
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">{day.title}</h3>
                  <p className="text-sm text-gray-600">{day.activities?.length || 0} activities</p>
                </div>
              </div>
              {expandedDay === index ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {expandedDay === index && (
              <div className="p-6 pt-0 space-y-4 border-t border-gray-200">
                {/* Day Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day Title
                  </label>
                  <input
                    type="text"
                    value={day.title}
                    onChange={(e) => handleDayChange(index, { title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rausch-500 focus:border-transparent"
                  />
                </div>

                {/* Day Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={day.description}
                    onChange={(e) => handleDayChange(index, { description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rausch-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Activities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Activities
                  </label>
                  <div className="space-y-2">
                    {day.activities?.map((activity, actIndex) => (
                      <div key={actIndex} className="flex items-center gap-2">
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-900">{activity}</span>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const activity = prompt('Enter activity:')
                        if (activity) handleAddActivity(index, activity)
                      }}
                      className="text-sm text-rausch-600 hover:text-rausch-700"
                    >
                      + Add Activity
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {days.length === 0 && (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-600 mb-4">No days added yet</p>
            <button
              onClick={handleAddDay}
              className="text-rausch-600 hover:underline"
            >
              Add your first day
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

