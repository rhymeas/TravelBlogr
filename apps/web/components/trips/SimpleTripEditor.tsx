'use client'

import { useState } from 'react'
import { X, Save, Plus, Trash2, MapPin, Image as ImageIcon, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getBrowserSupabase } from '@/lib/supabase'

interface Location {
  id?: string
  title: string
  content: string
  location: string
  post_date: string
  featured_image?: string
  order_index: number
}

interface SimpleTripEditorProps {
  tripId: string
  trip: any
  locations: Location[]
  onUpdate: () => void
}

export function SimpleTripEditor({ tripId, trip, locations, onUpdate }: SimpleTripEditorProps) {
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    content: '',
    post_date: new Date().toISOString().split('T')[0],
    featured_image: ''
  })

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setIsAddingNew(false)
    setFormData({
      title: location.title,
      location: location.location || '',
      content: location.content,
      post_date: location.post_date,
      featured_image: location.featured_image || ''
    })
  }

  const handleAddNew = () => {
    setIsAddingNew(true)
    setEditingLocation(null)
    setFormData({
      title: '',
      location: '',
      content: '',
      post_date: new Date().toISOString().split('T')[0],
      featured_image: ''
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const supabase = getBrowserSupabase()

      if (editingLocation?.id) {
        // Update existing
        const { error } = await supabase
          .from('posts')
          .update({
            title: formData.title,
            location: formData.location,
            content: formData.content,
            post_date: formData.post_date,
            featured_image: formData.featured_image || null
          })
          .eq('id', editingLocation.id)

        if (error) throw error
        alert('Location updated!')
      } else {
        // Create new
        const { error } = await supabase
          .from('posts')
          .insert({
            trip_id: tripId,
            title: formData.title,
            location: formData.location,
            content: formData.content,
            post_date: formData.post_date,
            featured_image: formData.featured_image || null,
            order_index: locations.length + 1
          })

        if (error) throw error
        alert('Location added!')
      }

      setEditingLocation(null)
      setIsAddingNew(false)
      onUpdate()
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this location?')) return

    try {
      const supabase = getBrowserSupabase()
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Location deleted!')
      onUpdate()
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Failed to delete')
    }
  }

  const showPanel = editingLocation || isAddingNew

  return (
    <div className="relative">
      {/* Main Content - Location List */}
      <div className={`transition-all duration-300 ${showPanel ? 'mr-96' : ''}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Trip Locations</h3>
            <Button onClick={handleAddNew} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" />
              Add Location
            </Button>
          </div>

          <div className="space-y-2">
            {locations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No locations yet. Add your first location!</p>
              </div>
            ) : (
              locations.map((location, index) => (
                <div
                  key={location.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{location.title}</h4>
                    <p className="text-xs text-gray-500">{location.location || 'No location set'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => location.id && handleDelete(location.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Side Panel - Edit Form */}
      {showPanel && (
        <div className="fixed right-0 top-0 h-screen w-96 bg-white border-l border-gray-200 shadow-2xl z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {isAddingNew ? 'Add Location' : 'Edit Location'}
            </h3>
            <button
              onClick={() => {
                setEditingLocation(null)
                setIsAddingNew(false)
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Day 1: Penticton"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <MapPin className="h-4 w-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Penticton, BC"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.post_date}
                onChange={(e) => setFormData({ ...formData, post_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <LinkIcon className="h-4 w-4 inline mr-1" />
                Image URL (paste link)
              </label>
              <input
                type="url"
                value={formData.featured_image}
                onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="https://images.unsplash.com/..."
              />
              {formData.featured_image && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={formData.featured_image}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-location.jpg'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Describe this location, activities, tips..."
              />
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving || !formData.title}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Location'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

