'use client'

import { useState, useEffect } from 'react'
import { Star, Save, Trash2, Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface NotesWidgetProps {
  type: 'location' | 'activity' | 'restaurant'
  itemId: string
  itemName: string
  userId?: string
}

interface Note {
  id: string
  note_text: string | null
  rating: number | null
  photos: string[]
  visited_date?: string | null
  dish_recommendations?: string | null
}

export function NotesWidget({ type, itemId, itemName, userId }: NotesWidgetProps) {
  const [note, setNote] = useState<Note | null>(null)
  const [noteText, setNoteText] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch existing note
  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchNote = async () => {
      try {
        const endpoint = `/api/notes/${type}?${type}Id=${itemId}`
        const response = await fetch(endpoint)
        const data = await response.json()

        if (data.success && data.data) {
          setNote(data.data)
          setNoteText(data.data.note_text || '')
          setRating(data.data.rating)
        }
      } catch (error) {
        console.error('Error fetching note:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNote()
  }, [type, itemId, userId])

  const handleSave = async () => {
    if (!userId) {
      toast.error('Please sign in to add notes')
      return
    }

    if (!noteText.trim() && !rating) {
      toast.error('Please add a note or rating')
      return
    }

    setSaving(true)

    try {
      const endpoint = `/api/notes/${type}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [`${type}Id`]: itemId,
          noteText: noteText.trim() || null,
          rating,
          photos: [],
          isPrivate: true,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setNote(data.data)
        setIsEditing(false)
        toast.success('Note saved successfully!')
      } else {
        toast.error(data.error || 'Failed to save note')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      toast.error('Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this note?')) return

    setSaving(true)

    try {
      const endpoint = `/api/notes/${type}?${type}Id=${itemId}`
      const response = await fetch(endpoint, { method: 'DELETE' })
      const data = await response.json()

      if (data.success) {
        setNote(null)
        setNoteText('')
        setRating(null)
        setIsEditing(false)
        toast.success('Note deleted successfully!')
      } else {
        toast.error(data.error || 'Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      toast.error('Failed to delete note')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <a href="/auth/signin" className="font-medium hover:underline">
            Sign in
          </a>{' '}
          to add personal notes and ratings
        </p>
      </div>
    )
  }

  if (!note && !isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <button
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2"
        >
          <Star className="h-4 w-4" />
          Add your personal note
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">
          {isEditing ? 'Your Note' : 'My Note'}
        </h4>
        {note && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-600 hover:text-gray-900 text-xs"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 text-xs"
              disabled={saving}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => isEditing && setRating(star)}
            onMouseEnter={() => isEditing && setHoverRating(star)}
            onMouseLeave={() => isEditing && setHoverRating(null)}
            disabled={!isEditing}
            className={`transition-colors ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= (hoverRating || rating || 0)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {rating && (
          <span className="text-sm text-gray-600 ml-2">
            {rating}/5
          </span>
        )}
      </div>

      {/* Note Text */}
      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={`Add your thoughts about ${itemName}...`}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
          />
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || (!noteText.trim() && !rating)}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Note'}
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false)
                if (note) {
                  setNoteText(note.note_text || '')
                  setRating(note.rating)
                } else {
                  setNoteText('')
                  setRating(null)
                }
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-700 whitespace-pre-wrap">
          {noteText || <span className="text-gray-400 italic">No notes yet</span>}
        </div>
      )}
    </div>
  )
}

