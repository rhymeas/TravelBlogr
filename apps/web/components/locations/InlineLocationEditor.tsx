'use client'

import { useState } from 'react'
import { Edit2, Check, X, Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AIQuickHelpButton } from '@/components/shared/AIQuickHelpButton'
import { useAuth } from '@/hooks/useAuth'
import { GalleryUploadModal } from '@/components/upload/GalleryUploadModal'
import toast from 'react-hot-toast'

interface InlineLocationEditorProps {
  locationId: string
  locationSlug: string
  locationCountry?: string
  field: 'description' | 'activities' | 'restaurants' | 'images'
  value: any
  onUpdate?: (newValue: any) => void
  enabled?: boolean // gated by page-level Edit Mode
}

export function InlineLocationEditor({
  locationId,
  locationSlug,
  locationCountry,
  field,
  value,
  onUpdate,
  enabled = false,
}: InlineLocationEditorProps) {
  const { isAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [isSaving, setIsSaving] = useState(false)

  // Gate all edit affordances behind page-level Edit Mode
  if (!enabled) {
    return null
  }

  // Show subtle indicator for non-authenticated users (only when Edit Mode is on)
  if (!isAuthenticated) {
    return (
      <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-gray-100 border border-gray-300 rounded-full px-2 py-1 shadow-sm">
          <span className="text-xs text-gray-600">Sign in to edit</span>
        </div>
      </div>
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/locations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          locationSlug,
          field: field === 'images' ? 'gallery_images' : field,
          value: editValue
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Updated successfully! 🎉')
        setIsEditing(false)
        onUpdate?.(editValue)
        // Notify other UI parts (e.g., CommunityActivityFeed) to refresh
        try {
          const detail = { type: 'field-updated', field, locationId, locationSlug, ts: Date.now() }
          window.dispatchEvent(new CustomEvent('location-updated', { detail }))
          localStorage.setItem('location-update', JSON.stringify(detail))
          // Clear it shortly after to avoid storage bloat
          setTimeout(() => localStorage.removeItem('location-update'), 2000)
        } catch (e) {
          // no-op
        }
      } else {
        toast.error(data.error || 'Failed to update')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('Failed to update')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
  }

  return (
    <>
      {/* Edit Button - Shows on hover */}
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-300 rounded-full p-2 shadow-sm hover:bg-gray-50 z-10"
          title="Edit this section"
        >
          <Edit2 className="h-4 w-4 text-gray-600" />
        </button>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-800">
              ✏️ Editing {field}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Field-specific editors */}
          {field === 'description' && (
            <div className="space-y-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={7}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 bg-white text-black placeholder-gray-500"
                placeholder="Enter location description..."
              />
              <div className="flex gap-2">
                <AIQuickHelpButton
                  mode="improve"
                  fieldType="description"
                  currentValue={editValue}
                  locationName={locationSlug}
                  onApply={(newValue) => setEditValue(newValue)}
                  size="sm"
                />
                <AIQuickHelpButton
                  mode="generate"
                  fieldType="description"
                  currentValue={editValue}
                  locationName={locationSlug}
                  onApply={(newValue) => setEditValue(newValue)}
                  size="sm"
                />
              </div>
            </div>
          )}

          {field === 'activities' && (
            <ActivityEditor
              activities={editValue}
              onChange={setEditValue}
              locationLabel={locationSlug}
              country={locationCountry}
              locationId={locationId}
              onAutoPersist={async (nextActivities) => {
                try {
                  await fetch('/api/locations/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      locationId,
                      locationSlug,
                      field: 'activities',
                      value: nextActivities
                    })
                  })
                  onUpdate?.(nextActivities)
                  // Gentle autosave toast (debounced via id)
                  try { (window as any).toast?.success?.('Saved', { id: 'autosave-activities' }) } catch {}
                } catch (e) {
                  // Silent fail for autosave
                }
              }}
            />
          )}

          {field === 'restaurants' && (
            <RestaurantEditor
              restaurants={editValue}
              onChange={setEditValue}
            />
          )}

          {field === 'images' && (
            <ImageEditor
              images={editValue}
              onChange={setEditValue}
            />
          )}
        </div>
      )}
    </>
  )
}

// Activity Editor Component
type LinkSuggestion = { title: string; url: string; source: string }

function ActivityEditor({ activities, onChange, locationLabel, country, locationId, onAutoPersist }: { activities: any[], onChange: (val: any) => void, locationLabel?: string, country?: string, locationId?: string, onAutoPersist?: (nextActivities: any[]) => void }) {
  const { user } = useAuth()
  const [loadingImg, setLoadingImg] = useState<Record<number, boolean>>({})
  const [loadingLinks, setLoadingLinks] = useState<Record<number, boolean>>({})
  const [loadingDesc, setLoadingDesc] = useState<Record<number, boolean>>({})
  const [linkSuggestions, setLinkSuggestions] = useState<Record<number, LinkSuggestion[]>>({})
  const [uploadIndex, setUploadIndex] = useState<number | null>(null)

  const addActivity = () => {
    onChange([...activities, {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      category: 'outdoor',
      completed: false,
      image_url: '',
      link_url: '',
      link_source: undefined
    }])
  }

  const updateActivity = (index: number, field: string, value: any) => {
    const updated = [...activities]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const removeActivity = (index: number) => {
    onChange(activities.filter((_, i) => i !== index))
  }

  const findImage = async (index: number) => {
    setLoadingImg(s => ({ ...s, [index]: true }))
    try {
      const a = activities[index]
      const res = await fetch(`/api/activities/find-image?activityName=${encodeURIComponent(a.name)}&locationName=${encodeURIComponent(locationLabel || '')}`)
      const json = await res.json()
      if (json?.success && json.url) {
        const next = [...activities]
        next[index] = { ...next[index], image_url: json.url }
        onChange(next)
        onAutoPersist?.(next)
      }
    } finally {
      setLoadingImg(s => ({ ...s, [index]: false }))
    }
  }

  const findLinks = async (index: number) => {
    setLoadingLinks(s => ({ ...s, [index]: true }))
    try {
      const a = activities[index]
      const locQuery = (locationLabel || '').replace(/-/g, ' ').trim()
      const res = await fetch(`/api/activities/find-links?activityName=${encodeURIComponent(a.name)}&locationName=${encodeURIComponent(locQuery)}`)
      const json = await res.json()
      if (json?.success && Array.isArray(json.links) && json.links.length) {
        setLinkSuggestions(prev => ({ ...prev, [index]: json.links as LinkSuggestion[] }))
        // Do NOT auto-pick; let user choose from compact selector
      }
    } finally {
      setLoadingLinks(s => ({ ...s, [index]: false }))
    }
  }

  const generateDescription = async (index: number) => {
    setLoadingDesc(s => ({ ...s, [index]: true }))
    try {
      const a = activities[index]
      const loc = (locationLabel || '').replace(/-/g, ' ').trim()
      const url = `/api/activities/generate-description?activityName=${encodeURIComponent(a.name)}&locationName=${encodeURIComponent(loc)}${country ? `&country=${encodeURIComponent(country)}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      if (json?.success && json.description) updateActivity(index, 'description', json.description)
    } finally {
      setLoadingDesc(s => ({ ...s, [index]: false }))
    }
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div key={activity.id} className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={activity.name}
                onChange={(e) => updateActivity(index, 'name', e.target.value)}
                placeholder="Activity name"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              />
              <div className="flex items-center gap-2">
                <textarea
                  value={activity.description || ''}
                  onChange={(e) => updateActivity(index, 'description', e.target.value)}
                  placeholder="Short 1–2 sentence description"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  rows={2}
                />
                <Button size="sm" variant="ghost" onClick={() => generateDescription(index)} disabled={!!loadingDesc[index]} title="Generate description">
                  <Wand2 className="h-3 w-3" />
                </Button>
              </div>
              <select
                value={activity.category}
                onChange={(e) => updateActivity(index, 'category', e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              >
                <option value="outdoor">🏔️ Outdoor</option>
                <option value="cultural">🎭 Cultural</option>
                <option value="food">🍽️ Food</option>
                <option value="adventure">🚀 Adventure</option>
                <option value="relaxation">🧘 Relaxation</option>
              </select>
              {/* Small, sleek tags row */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {/* Difficulty */}
                <select
                  value={activity.difficulty || ''}
                  onChange={(e) => updateActivity(index, 'difficulty', e.target.value || undefined)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                >
                  <option value="">Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="hard">Hard</option>
                </select>
                {/* Duration */}
                <input
                  type="text"
                  value={activity.duration || ''}
                  onChange={(e) => updateActivity(index, 'duration', e.target.value || undefined)}
                  placeholder="Duration (e.g., 2-3 h)"
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 w-36"
                />
                {/* Cost */}
                <select
                  value={activity.cost || ''}
                  onChange={(e) => updateActivity(index, 'cost', e.target.value || undefined)}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                >
                  <option value="">Cost</option>
                  <option value="free">Free</option>
                  <option value="low">$ Low</option>
                  <option value="medium">$$ Medium</option>
                  <option value="high">$$$ High</option>
                </select>
              </div>

              {/* Links */}
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="url"
                      value={activity.link_url || ''}
                      onChange={(e) => updateActivity(index, 'link_url', e.target.value || undefined)}
                      placeholder="Paste link (official, Wikipedia, booking, etc.)"
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    />
                    {activity.link_source && (
                      <span className="px-2 py-0.5 text-[10px] rounded bg-gray-100 border border-gray-200 text-gray-700 capitalize">
                        {activity.link_source}
                      </span>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => findLinks(index)} disabled={!!loadingLinks[index]} title="Find links">
                    <LinkIcon className="h-3 w-3" />
                  </Button>
                </div>

                {/* Compact inline selector for suggestions */}
                {linkSuggestions[index]?.length ? (
                  <div className="flex flex-wrap items-center gap-1">
                    {linkSuggestions[index].map((sugg, si) => {
                      const isActive = activity.link_url === sugg.url
                      return (
                        <button
                          key={si}
                          type="button"
                          onClick={() => {
                            const next = [...activities]
                            next[index] = { ...next[index], link_url: sugg.url, link_source: sugg.source }
                            onChange(next)
                            onAutoPersist?.(next)
                          }}
                          className={`px-2 py-0.5 text-[11px] rounded-full border ${isActive ? 'bg-rausch-100 border-rausch-300 text-rausch-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                          title={sugg.title}
                        >
                          {sugg.source}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>

              {/* Image */}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="url"
                  value={activity.image_url || ''}
                  onChange={(e) => updateActivity(index, 'image_url', e.target.value || undefined)}
                  placeholder="Paste image URL"
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
                <Button size="sm" variant="ghost" onClick={() => findImage(index)} disabled={!!loadingImg[index]} title="Find image">
                  <ImageIcon className="h-3 w-3" />
                </Button>
                {/* Subtle 'Add photo' opens modal */}
                <button className="text-[11px] text-rausch-600 hover:underline" onClick={(e) => { e.preventDefault(); if (!user) { toast.error('Please sign in to upload images'); return } setUploadIndex(index) }}>
                  Add photo
                </button>
              </div>
            </div>
            <button
              onClick={() => removeActivity(index)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={addActivity}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Activity
      </Button>

      {uploadIndex !== null && user && (
        <GalleryUploadModal
          isOpen={true}
          title="Add activity photo"
          userId={user.id}
          userDisplayName={((user as any)?.user_metadata?.full_name) || (user?.email?.split('@')[0]) || 'Anonymous'}
          locationId={locationId || 'activities'}
          onClose={() => setUploadIndex(null)}
          folder={`${locationId || 'activities'}/activity_${activities[uploadIndex].id}`}
          allowMultiple={false}
          onImageSelect={(url) => {
            const next = [...activities]
            next[uploadIndex] = { ...next[uploadIndex], image_url: url }
            onChange(next)
            onAutoPersist?.(next)
          }}
        />
      )}

    </div>
  )
}

// Restaurant Editor Component
function RestaurantEditor({ restaurants, onChange }: { restaurants: any[], onChange: (val: any) => void }) {
  const addRestaurant = () => {
    onChange([...restaurants, {
      id: `temp-${Date.now()}`,
      name: '',
      description: '',
      cuisine: '',
      price_range: '$$',
      rating: 4.0,
      address: '',
      specialties: []
    }])
  }

  const updateRestaurant = (index: number, field: string, value: any) => {
    const updated = [...restaurants]
    updated[index] = { ...updated[index], [field]: value }


    onChange(updated)
  }

  const removeRestaurant = (index: number) => {
    onChange(restaurants.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {restaurants.map((restaurant, index) => (
        <div key={restaurant.id} className="bg-white p-3 rounded-lg border border-gray-200">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <input
                type="text"
                value={restaurant.name}
                onChange={(e) => updateRestaurant(index, 'name', e.target.value)}
                placeholder="Restaurant name"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={restaurant.address}
                onChange={(e) => updateRestaurant(index, 'address', e.target.value)}
                placeholder="Address"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={restaurant.cuisine}
                  onChange={(e) => updateRestaurant(index, 'cuisine', e.target.value)}
                  placeholder="Cuisine type"
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                />
                <select
                  value={restaurant.price_range}
                  onChange={(e) => updateRestaurant(index, 'price_range', e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                >
                  <option value="$">$ - Budget</option>
                  <option value="$$">$$ - Moderate</option>
                  <option value="$$$">$$$ - Upscale</option>
                  <option value="$$$$">$$$$ - Fine Dining</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => removeRestaurant(index)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <Button
        size="sm"
        variant="outline"
        onClick={addRestaurant}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add Restaurant
      </Button>
    </div>
  )
}

// Image Editor Component
function ImageEditor({ images, onChange }: { images: string[], onChange: (val: string[]) => void }) {
  const [newImageUrl, setNewImageUrl] = useState('')

  const addImage = () => {
    if (newImageUrl.trim()) {
      onChange([...images, newImageUrl.trim()])
      setNewImageUrl('')
    }
  }

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {images.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Image ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
          placeholder="Paste image URL..."
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
        />
        <Button
          size="sm"
          onClick={addImage}
          disabled={!newImageUrl.trim()}
        >
          <ImageIcon className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}

