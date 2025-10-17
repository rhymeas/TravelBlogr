'use client'

import { useState } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Select } from '@/components/ui/Select'
import { getBrowserSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ImageUpload } from '@/components/upload/ImageUpload'

interface TripEditModalProps {
  isOpen: boolean
  onClose: () => void
  trip: any
  onUpdate: () => void
}

export function TripEditModal({ isOpen, onClose, trip, onUpdate }: TripEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: trip.title || '',
    description: trip.description || '',
    destination: trip.destination || '',
    duration_days: trip.duration_days || '',
    trip_type: trip.trip_type || '',
    cover_image: trip.cover_image || '',
    highlights: trip.highlights?.join('\n') || '',
    is_public_template: trip.is_public_template || false,
    is_featured: trip.is_featured || false,
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const supabase = getBrowserSupabase()

      const { error } = await supabase
        .from('trips')
        .update({
          title: formData.title,
          description: formData.description,
          destination: formData.destination,
          duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
          trip_type: formData.trip_type,
          cover_image: formData.cover_image,
          highlights: formData.highlights.split('\n').filter((h: string) => h.trim()),
          is_public_template: formData.is_public_template,
          is_featured: formData.is_featured,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trip.id)

      if (error) throw error

      toast.success('Trip updated successfully')
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error updating trip:', error)
      toast.error('Failed to update trip')
    } finally {
      setSaving(false)
    }
  }

  const tripTypes = [
    { value: '', label: 'Select type' },
    { value: 'family', label: 'Family' },
    { value: 'adventure', label: 'Adventure' },
    { value: 'beach', label: 'Beach' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'road-trip', label: 'Road Trip' },
    { value: 'solo', label: 'Solo' },
    { value: 'romantic', label: 'Romantic' },
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Trip Details"
      size="lg"
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={handleSave}
          cancelText="Cancel"
          confirmText="Save Changes"
          confirmLoading={saving}
          confirmDisabled={!formData.title || !formData.destination}
        />
      }
    >
      <div className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title">Trip Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., Summer Road Trip Through California"
            required
          />
        </div>

        {/* Destination */}
        <div>
          <Label htmlFor="destination">Destination *</Label>
          <Input
            id="destination"
            value={formData.destination}
            onChange={(e) => handleChange('destination', e.target.value)}
            placeholder="e.g., California, USA"
            required
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Describe your trip..."
            rows={4}
          />
        </div>

        {/* Duration and Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration_days">Duration (days)</Label>
            <Input
              id="duration_days"
              type="number"
              value={formData.duration_days}
              onChange={(e) => handleChange('duration_days', e.target.value)}
              placeholder="7"
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="trip_type">Trip Type</Label>
            <Select
              id="trip_type"
              value={formData.trip_type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('trip_type', e.target.value)}
              options={tripTypes}
            />
          </div>
        </div>

        {/* Highlights */}
        <div>
          <Label htmlFor="highlights">Highlights (one per line)</Label>
          <Textarea
            id="highlights"
            value={formData.highlights}
            onChange={(e) => handleChange('highlights', e.target.value)}
            placeholder="Golden Gate Bridge&#10;Yosemite National Park&#10;Pacific Coast Highway"
            rows={4}
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter each highlight on a new line
          </p>
        </div>

        {/* Cover Image */}
        <div>
          <Label>Cover Image</Label>
          <ImageUpload
            bucket="trip-images"
            userId={trip.user_id}
            currentImage={formData.cover_image}
            onUploadComplete={(url) => handleChange('cover_image', url)}
          />
        </div>

        {/* Public Template Toggle */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="is_public_template"
            checked={formData.is_public_template}
            onChange={(e) => handleChange('is_public_template', e.target.checked)}
            className="h-4 w-4 text-rausch-600 focus:ring-rausch-500 border-gray-300 rounded"
          />
          <div>
            <Label htmlFor="is_public_template" className="font-medium">
              Public Template
            </Label>
            <p className="text-sm text-gray-600">
              Make this trip available as a template for others to copy
            </p>
          </div>
        </div>

        {/* Featured Toggle */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <input
            type="checkbox"
            id="is_featured"
            checked={formData.is_featured}
            onChange={(e) => handleChange('is_featured', e.target.checked)}
            className="h-4 w-4 text-rausch-600 focus:ring-rausch-500 border-gray-300 rounded"
          />
          <div>
            <Label htmlFor="is_featured" className="font-medium">
              Featured Trip
            </Label>
            <p className="text-sm text-gray-600">
              Highlight this trip on your profile
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

