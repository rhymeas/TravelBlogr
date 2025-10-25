'use client'

import { useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface EditableLocationTitleProps {
  locationId: string
  locationSlug: string
  locationName: string
  onUpdate?: (newName: string) => void
  enabled?: boolean
}

export function EditableLocationTitle({
  locationId,
  locationSlug,
  locationName: initialName,
  onUpdate,
  enabled = false,
}: EditableLocationTitleProps) {
  const { isAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [editValue, setEditValue] = useState(initialName)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!editValue.trim()) {
      toast.error('Location name cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/locations/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          locationSlug,
          field: 'name',
          value: editValue.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Location name updated! 🎉')
        const newName = editValue.trim()
        setName(newName)
        setIsEditing(false)
        onUpdate?.(newName)
        // Notify community activity feed to refresh
        try {
          const detail = { type: 'field-updated', field: 'name', locationId, locationSlug, ts: Date.now() }
          window.dispatchEvent(new CustomEvent('location-updated', { detail }))
          localStorage.setItem('location-update', JSON.stringify(detail))
          setTimeout(() => localStorage.removeItem('location-update'), 2000)
        } catch {}
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
    setEditValue(name)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 mb-2">
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="text-display-medium font-bold text-sleek-black border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? 'Saving...' : <><Check className="h-4 w-4" /></>}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="group relative inline-block">
      <h1 className="text-display-medium font-bold text-sleek-black mb-2">
        {name}
      </h1>
      {isAuthenticated && enabled && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-300 rounded-full p-1.5 shadow-sm hover:bg-gray-50"
          title="Edit location name"
        >
          <Edit2 className="h-4 w-4 text-gray-600" />
        </button>
      )}
    </div>
  )
}

