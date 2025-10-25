"use client"

import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { AIQuickHelpButton } from '@/components/shared/AIQuickHelpButton'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

export interface ChecklistItem { text: string; checked?: boolean }

export interface ChecklistModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: (payload: { clientUid: string; items: ChecklistItem[]; templateType?: string }) => void
  context: {
    dayIndex: number
    stopIndex: number
    locationName?: string
    activityTitle: string
    activityId?: string
    locationId?: string
    tripId?: string
  }
  initialItems?: ChecklistItem[]
}

const TEMPLATES: Record<string, string[]> = {
  Packing: ['Passport', 'Phone charger', 'Comfortable shoes', 'Reusable water bottle', 'Sunscreen'],
  Documents: ['Passport/ID', 'Boarding pass', 'Hotel reservation', 'Travel insurance', 'Emergency contacts'],
  Activities: ['Book tickets', 'Check opening hours', 'Reserve table', 'Plan transport', 'Check weather'],
}

export function ChecklistModal({ isOpen, onClose, onSaved, context, initialItems = [] }: ChecklistModalProps) {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<ChecklistItem[]>(initialItems)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<string>('')
  const [clientUid] = useState<string>(() => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`))

  useEffect(() => {
    if (isOpen) setItems(initialItems.length ? initialItems : [])
  }, [isOpen, initialItems])

  if (!isOpen) return null

  const handleAddItem = () => {
    setItems(prev => [...prev, { text: '', checked: false }])
  }

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save checklist')
      return
    }
    const cleaned = items.filter(i => i.text.trim().length > 0)
    if (!cleaned.length) {
      toast.error('Please add at least one item')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/trip-checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientUid,
          items: cleaned,
          templateType: template || null,
          activityId: context.activityId,
          locationId: context.locationId,
          activityTitle: context.activityTitle,
          locationName: context.locationName,
          tripId: context.tripId || null,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save checklist')
      toast.success('Checklist saved')
      onSaved?.({ clientUid, items: cleaned, templateType: template || undefined })
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save checklist')
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
            <div className="text-sm font-semibold text-gray-900">Add checklist</div>
            <div className="text-xs text-gray-500">{context.activityTitle}{context.locationName ? ` · ${context.locationName}` : ''}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-10 space-y-4">
          {/* Templates */}
          <div className="flex flex-wrap items-center gap-2">
            {Object.keys(TEMPLATES).map((t) => (
              <button
                key={t}
                onClick={() => { setTemplate(t); setItems(TEMPLATES[t].map(text => ({ text, checked: false }))) }}
                className={`px-2.5 py-1 text-xs rounded-full border ${template === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="space-y-2 max-h-64 overflow-auto pr-1">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!it.checked}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...it, checked: e.target.checked };
                    setItems(next)
                  }}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-black focus:ring-black"
                />
                <input
                  value={it.text}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx] = { ...it, text: e.target.value };
                    setItems(next)
                  }}
                  placeholder="Checklist item..."
                  className="flex-1 border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-gray-100">
                  <Trash2 className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            ))}
            <button onClick={handleAddItem} className="text-xs font-medium text-gray-600 hover:text-gray-800" type="button">
              <Plus className="w-3.5 h-3.5 inline mr-1" /> Add item
            </button>
          </div>

          {/* AI Help + Save */}
          <div className="flex items-center gap-2">
            <AIQuickHelpButton
              mode="generate"
              fieldType="highlights"
              currentValue={items.map(i => i.text)}
              locationName={context.locationName || context.activityTitle}
              onApply={(v) => {
                const lines = v.split('\n').map(l => l.replace(/^\s*[•*-]\s?/, '').trim()).filter(Boolean)
                setItems(lines.slice(0, 12).map(text => ({ text, checked: false })))
              }}
              size="sm"
            />
            <Button onClick={handleSave} disabled={saving} size="sm" className="ml-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

