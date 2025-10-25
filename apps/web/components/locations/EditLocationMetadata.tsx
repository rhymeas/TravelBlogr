'use client'

import { useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface EditLocationMetadataProps {
  locationId: string
  locationSlug: string
  country: string
  region?: string
  latitude?: number
  longitude?: number
  enabled: boolean
  onUpdate?: (data: any) => void
}

export function EditLocationMetadata({
  locationId,
  locationSlug,
  country: initialCountry,
  region: initialRegion,
  latitude: initialLatitude,
  longitude: initialLongitude,
  enabled,
  onUpdate,
}: EditLocationMetadataProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    country: initialCountry,
    region: initialRegion || '',
    latitude: initialLatitude?.toString() || '',
    longitude: initialLongitude?.toString() || '',
  })

  const handleSave = async () => {
    if (!formData.country.trim()) {
      toast.error('Country is required')
      return
    }

    // Validate coordinates if provided
    if (formData.latitude || formData.longitude) {
      if (!formData.latitude || !formData.longitude) {
        toast.error('Both latitude and longitude must be provided')
        return
      }

      const lat = parseFloat(formData.latitude)
      const lon = parseFloat(formData.longitude)

      if (isNaN(lat) || isNaN(lon)) {
        toast.error('Coordinates must be valid numbers')
        return
      }

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        toast.error('Invalid coordinates')
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch('/api/locations/update-metadata', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          locationSlug,
          country: formData.country,
          region: formData.region || undefined,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update metadata')
      }

      toast.success('✅ Location metadata updated!')
      setIsEditing(false)
      onUpdate?.(data.updated)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  if (!enabled) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <MapPin className="h-4 w-4" />
        <span>{initialCountry}</span>
        {initialRegion && <span>• {initialRegion}</span>}
      </div>
    )
  }

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className="p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors mb-4"
      >
        <div className="flex items-center gap-2 text-sm text-blue-900">
          <MapPin className="h-4 w-4" />
          <span className="font-medium">
            {initialCountry}
            {initialRegion && ` • ${initialRegion}`}
          </span>
          {initialLatitude && initialLongitude && (
            <span className="text-xs text-blue-700">
              ({initialLatitude.toFixed(4)}, {initialLongitude.toFixed(4)})
            </span>
          )}
        </div>
        <p className="text-xs text-blue-700 mt-1">Click to edit location metadata</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white border-2 border-blue-300 rounded-lg mb-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Edit Location Metadata</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* Country */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Country *
          </label>
          <input
            type="text"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="e.g., Germany"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Region
          </label>
          <input
            type="text"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            placeholder="e.g., Bavaria"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Latitude */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Latitude
          </label>
          <input
            type="number"
            step="0.000001"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            placeholder="e.g., 51.1657"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Longitude */}
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Longitude
          </label>
          <input
            type="number"
            step="0.000001"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
            placeholder="e.g., 10.4515"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <button
          onClick={() => {
            setIsEditing(false)
            setFormData({
              country: initialCountry,
              region: initialRegion || '',
              latitude: initialLatitude?.toString() || '',
              longitude: initialLongitude?.toString() || '',
            })
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-medium hover:bg-gray-50 transition-colors text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </div>
  )
}

