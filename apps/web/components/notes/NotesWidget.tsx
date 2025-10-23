'use client'

import { useState, useEffect } from 'react'
import { Star, Save, Trash2, Camera, X, Sparkles, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AIQuickHelpButton } from '@/components/shared/AIQuickHelpButton'
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

interface NoteItem {
  text: string
  checked?: boolean
}

export function NotesWidget({ type, itemId, itemName, userId }: NotesWidgetProps) {
  const [note, setNote] = useState<Note | null>(null)
  const [noteText, setNoteText] = useState('')
  const [noteItems, setNoteItems] = useState<NoteItem[]>([])
  const [rating, setRating] = useState<number | null>(null)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noteType, setNoteType] = useState<string>('general')

  // Ensure at least one bullet input is present when entering edit mode
  useEffect(() => {
    if (isEditing && noteItems.length === 0) {
      try {
        const parsed = noteText
          .split('\n')
          .map((l) => l.replace(/^\s*[\u2022*-]\s?/, '').trim())
          .filter(Boolean)
          .map((t) => ({ text: t, checked: false }))
        setNoteItems(parsed.length ? parsed : [{ text: '', checked: false }])
      } catch {
        setNoteItems([{ text: '', checked: false }])
      }
    }
  }, [isEditing])

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
          const text = data.data.note_text || ''
          setNoteText(text)
          // Prefer structured JSON note items if present; fallback to plain lines
          let items: NoteItem[] = []
          try {
            const parsed = JSON.parse(text)
            if (Array.isArray(parsed)) {
              items = parsed
                .map((it) => ({ text: String(it.text ?? it), checked: Boolean(it.checked) }))
                .filter((it) => it.text && it.text.trim().length > 0)
            }
          } catch {}
          if (!items.length) {
            items = text
              .split('\n')
              .map((l: string) => l.replace(/^\s*[•*-]\s?/, '').trim())
              .filter((l: string) => l.length > 0)
              .map((t: string) => ({ text: t, checked: false }))
          }
          setNoteItems(items)
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

    const compiledText = noteItems.length
      ? noteItems.map(i => `• ${i.text.trim()}`).join('\n')
      : noteText.trim()

    const hasAnyContent = (noteItems.some(i => i.text.trim().length > 0)) || !!rating
    if (!hasAnyContent) {
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
          noteText: compiledText || null,
          noteItems: noteItems,
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
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-gray-400" />
          <h4 className="text-sm font-semibold text-black">
            {isEditing ? 'Your Personal Note' : 'My Travel Note'}
          </h4>
          <span className="ml-2 text-[11px] text-gray-500">🔒 Private to you</span>
        </div>
        {note && !isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-500 hover:text-black text-xs font-medium transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-gray-700 text-xs"
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
              className={`h-4 w-4 ${
                star <= (hoverRating || rating || 0)
                  ? 'fill-black text-black'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {rating && (
          <span className="text-xs text-gray-500 ml-2">
            {rating}/5
          </span>
        )}
      </div>

      {/* Note Text */}
      {isEditing ? (
        <div className="space-y-3">
          {/* Inline bullet inputs */}
          <div className="space-y-2">
            {noteItems.map((pt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xl leading-none text-black select-none">•</span>
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 w-full">
                  <input
                    type="checkbox"
                    checked={!!pt.checked}
                    onChange={(e) => {
                      const next = [...noteItems]
                      next[idx] = { ...pt, checked: e.target.checked }
                      setNoteItems(next)
                    }}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black"
                  />
                  <input
                    value={pt.text}
                    onChange={(e) => {
                      const next = [...noteItems]
                      next[idx] = { ...pt, text: e.target.value }
                      setNoteItems(next)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const next = [...noteItems]
                        next.splice(idx + 1, 0, { text: '', checked: false })
                        setNoteItems(next)
                      } else if (e.key === 'Backspace' && pt.text.length === 0) {
                        e.preventDefault()
                        const next = [...noteItems]
                        next.splice(idx, 1)
                        setNoteItems(next.length ? next : [{ text: '', checked: false }])
                      }
                    }}
                    placeholder="Write a note..."
                    className="flex-1 border-none focus:ring-0 bg-transparent rounded-sm px-0 text-sm leading-relaxed placeholder-gray-400"
                  />
                </div>
              </div>
            ))}
            {/* Quick add */}
            <button
              onClick={() => setNoteItems([...noteItems, { text: '', checked: false }])}
              className="text-xs font-medium text-gray-600 hover:text-gray-800"
              type="button"
            >
              + Add note
            </button>
          </div>

          {/* AI Help Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-700 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
            >
              <option value="general">General</option>
              <option value="tips">Travel Tips</option>
              <option value="food">Food</option>
              <option value="culture">Culture</option>
              <option value="outdoor">Outdoor</option>
              <option value="hidden-gems">Hidden Gems</option>
            </select>

            <AIQuickHelpButton
              mode="generate"
              fieldType="highlights"
              currentValue={noteItems.map(i => i.text)}
              locationName={itemName}
              noteType={noteType}
              onApply={(newValue) => {
                const items = newValue
                  .split('\n')
                  .map((l) => l.replace(/^\s*[•*-]\s?/, '').trim())
                  .filter(Boolean)
                setNoteItems(items.length ? items.slice(0, 6).map(t => ({ text: t, checked: false })) : [{ text: '', checked: false }])
              }}
              size="sm"
              className="text-xs"
            />
            <AIQuickHelpButton
              mode="improve"
              fieldType="highlights"
              currentValue={noteItems.map(i => i.text)}
              locationName={itemName}
              noteType={noteType}
              onApply={(newValue) => {
                const items = newValue
                  .split('\n')
                  .map((l) => l.replace(/^\s*[•*-]\s?/, '').trim())
                  .filter(Boolean)
                setNoteItems(items.length ? items.slice(0, 6).map(t => ({ text: t, checked: false })) : [{ text: '', checked: false }])
              }}
              size="sm"
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || ((noteItems.every(i => !i.text.trim())) && !rating)}
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white text-sm"
              size="sm"
            >
              <Save className="h-3.5 w-3.5" />
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
              size="sm"
              className="text-sm border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : note ? (
        <div className="space-y-2">
          {noteItems.map((pt, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xl leading-none text-black select-none">•</span>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 w-full">
                <input
                  type="checkbox"
                  checked={!!pt.checked}
                  onChange={async (e) => {
                    const next = [...noteItems]
                    next[idx] = { ...pt, checked: e.target.checked }
                    setNoteItems(next)
                    // silent save of check state
                    try {
                      await fetch(`/api/notes/${type}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          [`${type}Id`]: itemId,
                          noteText: noteText,
                          noteItems: next,
                          rating,
                          photos: [],
                          isPrivate: true,
                        }),
                      })
                    } catch {}
                  }}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black"
                />
                <span
                  className={`flex-1 text-sm ${pt.checked ? 'line-through text-gray-400' : 'text-black'}`}
                  onClick={() => setIsEditing(true)}
                >
                  {pt.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State - Encourage Note Creation */
        <div className="text-center py-6 bg-white rounded-md border border-dashed border-gray-300">
          <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <StickyNote className="h-5 w-5 text-gray-400" />
          </div>
          <h5 className="text-sm font-semibold text-black mb-1">
            Create Your Personal Travel Note
          </h5>
          <p className="text-xs text-gray-600 mb-4 max-w-xs mx-auto">
            Save your thoughts, tips, and memories about {itemName}. Your notes stay private and help you plan future trips.
          </p>
          <Button
            onClick={() => setIsEditing(true)}
            className="bg-black hover:bg-gray-800 text-white text-sm"
            size="sm"
          >
            <StickyNote className="h-3.5 w-3.5 mr-2" />
            Add My Note
          </Button>
        </div>
      )}
    </div>
  )
}

