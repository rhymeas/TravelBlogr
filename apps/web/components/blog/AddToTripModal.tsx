"use client"

import { useEffect, useMemo, useState } from "react"
import { getBrowserSupabase } from "@/lib/supabase"

interface AddToTripModalProps {
  open: boolean
  onClose: () => void
  // Items to add. Minimal shape for itinerary-items API
  items: Array<{
    title: string
    type?: "activity" | "meal" | "travel" | "note"
    image?: string
  }>
  // Optional defaults
  defaultDay?: number // 1-based for UX; will be converted to dayIndex (0-based)
}

interface TripRow { id: string; title?: string; slug?: string }

export function AddToTripModal({ open, onClose, items, defaultDay = 1 }: AddToTripModalProps) {
  const [loading, setLoading] = useState(false)
  const [trips, setTrips] = useState<TripRow[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>("")
  const [day, setDay] = useState<number>(defaultDay || 1)
  const [error, setError] = useState<string>("")
  const supabase = useMemo(() => getBrowserSupabase(), [])

  useEffect(() => {
    if (!open) return
    setError("")
    setLoading(true)
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError("Please sign in to add items to a trip.")
          setLoading(false)
          return
        }
        const { data, error } = await supabase
          .from("trips")
          .select("id, title, slug")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        if (error) throw error
        setTrips((data || []) as TripRow[])
        if (data && data.length > 0) setSelectedTripId(data[0].id)
      } catch (e: any) {
        setError(e?.message || "Failed to load your trips")
      } finally {
        setLoading(false)
      }
    })()
  }, [open, supabase])

  const handleConfirm = async () => {
    setError("")
    if (!selectedTripId) {
      setError("Please select a trip")
      return
    }
    const dayIndex = Math.max(0, Math.floor(day) - 1)

    try {
      setLoading(true)
      // POST items sequentially to the itinerary-items API
      for (const it of items) {
        const body = {
          dayIndex,
          title: it.title,
          type: it.type || "activity",
          image: it.image || undefined
        }
        const res = await fetch(`/api/trips/${selectedTripId}/itinerary-items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.error || `Failed to add item: ${it.title}`)
        }
      }
      onClose()
    } catch (e: any) {
      setError(e?.message || "Failed to add items")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-5">
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Add to Trip</h3>
          <p className="text-sm text-gray-600">Choose a trip and day to add the selected item(s).</p>
        </div>

        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Trip</label>
          <select
            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            disabled={loading}
          >
            {trips.length === 0 && <option value="">No trips found</option>}
            {trips.map(t => (
              <option key={t.id} value={t.id}>{t.title || t.slug || t.id}</option>
            ))}
          </select>

          <label className="block text-sm font-medium text-gray-700">Day (1-based)</label>
          <input
            type="number"
            min={1}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={day}
            onChange={(e) => setDay(Number(e.target.value) || 1)}
            disabled={loading}
          />

          <div className="rounded-md bg-gray-50 p-2 text-xs text-gray-600">
            {items.length} item{items.length !== 1 ? "s" : ""} will be added as activities.
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-3 py-1.5 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-70"
            disabled={loading || !selectedTripId}
          >
            {loading ? "Adding..." : "Add to Trip"}
          </button>
        </div>
      </div>
    </div>
  )
}

