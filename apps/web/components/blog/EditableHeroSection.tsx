'use client'

/**
 * EditableHeroSection - CMS-Editable Hero Section
 * 
 * A hero section that can be edited inline by admins.
 * Fetches content from content_blocks table and allows real-time editing.
 * 
 * Use cases:
 * - Blog homepage hero
 * - Landing page hero
 * - Campaign pages
 */

import { useState, useEffect } from 'react'
import { Edit2, Save, X } from 'lucide-react'
import { HeroSection, HeroSectionProps } from './HeroSection'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { getBrowserSupabase } from '@/lib/supabase'

interface EditableHeroSectionProps {
  pageSlug: string
  blockKey?: string
  defaultContent?: Partial<HeroSectionProps>
  isAdmin?: boolean
}

export function EditableHeroSection({
  pageSlug,
  blockKey = 'hero',
  defaultContent,
  isAdmin = false
}: EditableHeroSectionProps) {
  const [content, setContent] = useState<HeroSectionProps | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState<Partial<HeroSectionProps>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Fetch content from database
  useEffect(() => {
    fetchContent()
  }, [pageSlug, blockKey])

  const fetchContent = async () => {
    try {
      const supabase = getBrowserSupabase()
      const { data, error } = await supabase
        .from('content_blocks')
        .select('content')
        .eq('page_slug', pageSlug)
        .eq('block_key', blockKey)
        .eq('block_type', 'hero')
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching hero content:', error)
      }

      if (data?.content) {
        setContent(data.content as HeroSectionProps)
      } else if (defaultContent) {
        setContent(defaultContent as HeroSectionProps)
      }
    } catch (error) {
      console.error('Error fetching hero content:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setEditedContent(content || {})
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditedContent({})
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const supabase = getBrowserSupabase()
      
      // Upsert content block
      const { error } = await supabase
        .from('content_blocks')
        .upsert({
          page_slug: pageSlug,
          block_key: blockKey,
          block_type: 'hero',
          content: editedContent,
          is_active: true
        }, {
          onConflict: 'page_slug,block_key'
        })

      if (error) throw error

      setContent(editedContent as HeroSectionProps)
      setIsEditing(false)
      setEditedContent({})
    } catch (error) {
      console.error('Error saving hero content:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    )
  }

  if (!content) {
    return null
  }

  return (
    <div className="relative group">
      {/* Edit Controls (Admin Only) */}
      {isAdmin && !isEditing && (
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={handleEdit}
            variant="secondary"
            size="sm"
            className="shadow-lg"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Hero
          </Button>
        </div>
      )}

      {/* Edit Mode */}
      {isEditing ? (
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Edit Hero Section</h3>
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <Input
              value={editedContent.title || ''}
              onChange={(e) => setEditedContent({ ...editedContent, title: e.target.value })}
              placeholder="Enter hero title"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle
            </label>
            <Textarea
              value={editedContent.subtitle || ''}
              onChange={(e) => setEditedContent({ ...editedContent, subtitle: e.target.value })}
              placeholder="Enter hero subtitle"
              rows={3}
            />
          </div>

          {/* CTA Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA Button Text
            </label>
            <Input
              value={editedContent.ctaText || ''}
              onChange={(e) => setEditedContent({ ...editedContent, ctaText: e.target.value })}
              placeholder="e.g., Start Planning"
            />
          </div>

          {/* CTA Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CTA Button Link
            </label>
            <Input
              value={editedContent.ctaLink || ''}
              onChange={(e) => setEditedContent({ ...editedContent, ctaLink: e.target.value })}
              placeholder="e.g., /trips/new"
            />
          </div>

          {/* Images (simplified - just show current images) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images
            </label>
            <p className="text-sm text-gray-500">
              Current images: {editedContent.images?.length || 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Image management coming soon. For now, edit via database.
            </p>
          </div>
        </div>
      ) : (
        // Display Mode
        <HeroSection {...content} />
      )}
    </div>
  )
}

