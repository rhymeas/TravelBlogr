"use client"

import { useState, useEffect } from 'react'
import { X, Save, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { AIQuickHelpButton } from '@/components/shared/AIQuickHelpButton'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

export interface NotesModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: (payload: { clientUid: string; noteText: string }) => void
  context: {
    dayIndex: number
    stopIndex: number
    locationName?: string
    activityTitle: string
    activityId?: string
    locationId?: string
    tripId?: string
  }
  initialText?: string
}

export function NotesModal({ isOpen, onClose, onSaved, context, initialText = '' }: NotesModalProps) {
  const { isAuthenticated } = useAuth()
  const [noteText, setNoteText] = useState(initialText)
  const [saving, setSaving] = useState(false)
  const [clientUid] = useState<string>(() => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`))

  useEffect(() => {
    if (isOpen) setNoteText(initialText || '')
  }, [isOpen, initialText])

  if (!isOpen) return null

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save notes')
      return
    }
    if (!noteText.trim()) {
      toast.error('Please write a note first')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/trip-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUid,
          noteText: noteText.trim(),
          activityId: context.activityId,
          locationId: context.locationId,
          activityTitle: context.activityTitle,
          locationName: context.locationName,
          tripId: context.tripId || null,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save note')
      toast.success('Note saved')
      onSaved?.({ clientUid, noteText: noteText.trim() })
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-5 border-b border-gray-200">
          <div>
            <div className="text-sm font-semibold text-gray-900">Add notes</div>
            <div className="text-xs text-gray-500">{context.activityTitle}{context.locationName ? ` · ${context.locationName}` : ''}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-10 space-y-5">
          <Textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={6}
            placeholder="Write your notes..."
            className="w-full text-sm"
          />

          <div className="flex items-center gap-2">
            <AIQuickHelpButton
              mode="generate"
              fieldType="highlights"
              currentValue={noteText}
              locationName={context.locationName || context.activityTitle}
              onApply={(v) => setNoteText(v)}
              size="sm"
            />
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
              className="ml-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white"
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

