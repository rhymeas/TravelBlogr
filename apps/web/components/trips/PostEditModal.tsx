'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { getBrowserSupabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { ImageUpload } from '@/components/upload/ImageUpload'
import { LocationBrowser } from './LocationBrowser'
import { Search, PenSquare } from 'lucide-react'

interface Post {
  id?: string
  title: string
  content: string
  featured_image?: string
  location?: string
  location_id?: string // Link to community location
  post_date: string
  order_index: number
}

interface PostEditModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  userId: string
  post?: Post | null
  onUpdate: () => void
  nextOrderIndex: number
}

export function PostEditModal({
  isOpen,
  onClose,
  tripId,
  userId,
  post,
  onUpdate,
  nextOrderIndex
}: PostEditModalProps) {
  const [saving, setSaving] = useState(false)
  const [mode, setMode] = useState<'browse' | 'custom'>('browse')
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>()
  const [formData, setFormData] = useState<Post>({
    title: '',
    content: '',
    location: '',
    location_id: undefined,
    post_date: new Date().toISOString().split('T')[0],
    order_index: nextOrderIndex,
    featured_image: '',
  })

  // Update form when post changes
  useEffect(() => {
    if (post) {
      setFormData({
        id: post.id,
        title: post.title,
        content: post.content,
        location: post.location || '',
        location_id: post.location_id,
        post_date: post.post_date,
        order_index: post.order_index,
        featured_image: post.featured_image || '',
      })
      setMode('custom') // Editing existing post always uses custom mode
      setSelectedLocationId(post.location_id)
    } else {
      setFormData({
        title: '',
        content: '',
        location: '',
        location_id: undefined,
        post_date: new Date().toISOString().split('T')[0],
        order_index: nextOrderIndex,
        featured_image: '',
      })
      setMode('browse') // New post starts with browse mode
      setSelectedLocationId(undefined)
    }
  }, [post, nextOrderIndex])

  // Handle location selection from browser
  const handleLocationSelect = async (location: any) => {
    setSelectedLocationId(location.id)

    // Pre-fill form with location data
    setFormData(prev => ({
      ...prev,
      title: location.name,
      content: location.description || '',
      location: `${location.city ? location.city + ', ' : ''}${location.region ? location.region + ', ' : ''}${location.country}`,
      location_id: location.id, // Link to community location
      featured_image: location.featured_image || '',
    }))

    // Switch to custom mode to allow editing
    setMode('custom')
  }

  const handleChange = (field: keyof Post, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const supabase = getBrowserSupabase()

      if (post?.id) {
        // Update existing post
        const { error } = await supabase
          .from('posts')
          .update({
            title: formData.title,
            content: formData.content,
            location: formData.location,
            location_id: formData.location_id || null,
            post_date: formData.post_date,
            featured_image: formData.featured_image,
          })
          .eq('id', post.id)

        if (error) throw error
        toast.success('Location updated successfully')
      } else {
        // Create new post
        const { error } = await supabase
          .from('posts')
          .insert({
            trip_id: tripId,
            user_id: userId,
            title: formData.title,
            content: formData.content,
            location: formData.location,
            location_id: formData.location_id || null,
            post_date: formData.post_date,
            order_index: formData.order_index,
            featured_image: formData.featured_image,
          })

        if (error) throw error
        toast.success('Location added successfully')
      }

      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error('Failed to save location')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!post?.id) return

    if (!confirm('Are you sure you want to delete this location?')) return

    try {
      setSaving(true)
      const supabase = getBrowserSupabase()

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)

      if (error) throw error

      toast.success('Location deleted successfully')
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete location')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={post ? 'Edit Location' : 'Add Location to Trip'}
      size="lg"
      footer={
        mode === 'custom' ? (
          <div className="flex items-center justify-between w-full">
            <div>
              {post?.id && (
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 font-medium"
                  disabled={saving}
                >
                  Delete Location
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <ModalFooter
                onCancel={onClose}
                onConfirm={handleSave}
                cancelText="Cancel"
                confirmText={post ? 'Save Changes' : 'Add Location'}
                confirmLoading={saving}
                confirmDisabled={!formData.title || !formData.content}
              />
            </div>
          </div>
        ) : null
      }
    >
      <div className="space-y-6">
        {/* Mode Tabs - Only show when creating new post */}
        {!post && (
          <div className="flex gap-2 border-b pb-4">
            <Button
              variant={mode === 'browse' ? 'default' : 'outline'}
              onClick={() => setMode('browse')}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Browse Locations
            </Button>
            <Button
              variant={mode === 'custom' ? 'default' : 'outline'}
              onClick={() => setMode('custom')}
              className="flex items-center gap-2"
            >
              <PenSquare className="h-4 w-4" />
              Create Custom
            </Button>
          </div>
        )}

        {/* Browse Mode */}
        {mode === 'browse' && !post && (
          <LocationBrowser
            onSelectLocation={handleLocationSelect}
            selectedLocationId={selectedLocationId}
          />
        )}

        {/* Custom Mode */}
        {mode === 'custom' && (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="post-title">Location/Stop Title *</Label>
              <Input
                id="post-title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Golden Gate Bridge"
                required
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="post-location">Location Name</Label>
              <Input
                id="post-location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="e.g., San Francisco, CA"
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="post-content">Description *</Label>
              <Textarea
                id="post-content"
                value={formData.content}
                onChange={(e) => handleChange('content', e.target.value)}
                placeholder="Describe this location, what you did here, tips for visitors..."
                rows={6}
                required
              />
            </div>

            {/* Date */}
            <div>
              <Label htmlFor="post-date">Date</Label>
              <Input
                id="post-date"
                type="date"
                value={formData.post_date}
                onChange={(e) => handleChange('post_date', e.target.value)}
              />
            </div>

            {/* Featured Image */}
            <div>
              <Label>Featured Image</Label>
              <ImageUpload
                bucket="trip-images"
                userId={userId}
                currentImage={formData.featured_image}
                onUploadComplete={(url) => handleChange('featured_image', url)}
              />
            </div>

            {/* Order Index (hidden, for reference) */}
            <input type="hidden" value={formData.order_index} />
          </div>
        )}
      </div>
    </Modal>
  )
}

