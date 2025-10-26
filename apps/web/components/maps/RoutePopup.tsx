"use client"
import { useState } from "react"


import { X } from "lucide-react"

export interface RoutePopupProps {
  distanceKm: number
  durationH?: number
  elevationM?: number
  inclinePct?: number
  roadType?: "paved" | "unpaved" | "mixed" | "unknown"
  onAddNote?: (text: string) => void
  onAddChecklist?: (text: string) => void
  onAddWaypoint?: () => void
  onClose?: () => void
}

export function RoutePopup({
  distanceKm,
  durationH,
  elevationM,
  inclinePct,
  roadType = "unknown",
  onAddNote,
  onAddChecklist,
  onAddWaypoint,
  onClose
}: RoutePopupProps) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [checkOpen, setCheckOpen] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [checkText, setCheckText] = useState("")

  const submitNote = () => {
    if (!onAddNote) return
    const t = noteText.trim()
    if (!t) return
    onAddNote(t)
    setNoteText("")
    setNoteOpen(false)
  }

  const submitCheck = () => {
    if (!onAddChecklist) return
    const t = checkText.trim()
    if (!t) return
    onAddChecklist(t)
    setCheckText("")
    setCheckOpen(false)
  }
  const formatDuration = (hours?: number) => {
    if (!hours || hours <= 0) return "—"
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return `${h}:${m.toString().padStart(2, "0")} h`
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm text-gray-900 border border-gray-200 rounded-2xl shadow-xl w-64 md:w-72 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <div className="text-xs font-semibold">Route point</div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="p-3 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">After</span>
          <span className="font-medium">{Math.round(distanceKm)} km ({formatDuration(durationH)})</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Elevation</span>
          <span className="font-medium">{elevationM != null ? `${Math.round(elevationM)} m` : "—"}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Incline</span>
          <span className={`font-medium ${inclinePct && inclinePct > 5 ? 'text-orange-600' : 'text-gray-900'}`}>
            {inclinePct != null ? `~ ${inclinePct.toFixed(1)} %` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Surface</span>
          <span className="font-medium capitalize">{roadType}</span>
        </div>
      </div>

      <div className="px-3 pb-3 space-y-2">
        {/* Actions */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => { setNoteOpen(v => !v); setCheckOpen(false) }}
            className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-2 py-1 rounded-full"
          >
            + Note
          </button>
          <button
            type="button"
            onClick={() => { setCheckOpen(v => !v); setNoteOpen(false) }}
            className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium px-2 py-1 rounded-full"
          >
            + Check
          </button>
          <button
            type="button"
            onClick={onAddWaypoint}
            className="text-[11px] bg-gray-900 hover:bg-black text-white font-medium px-2 py-1 rounded-full"
          >
            Add
          </button>
        </div>

        {/* Inline note input */}
        {noteOpen && (
          <div className="flex items-center gap-1.5">
            <input
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitNote() }}
              placeholder="Quick note..."
              className="flex-1 text-xs px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <button
              type="button"
              onClick={submitNote}
              className="text-[11px] px-3 py-2 rounded-full bg-gray-900 text-white hover:bg-black"
            >
              Save
            </button>
          </div>
        )}

        {/* Inline checklist input */}
        {checkOpen && (
          <div className="flex items-center gap-1.5">
            <input
              value={checkText}
              onChange={(e) => setCheckText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitCheck() }}
              placeholder="Add checkpoint..."
              className="flex-1 text-xs px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <button
              type="button"
              onClick={submitCheck}
              className="text-[11px] px-3 py-2 rounded-full bg-gray-900 text-white hover:bg-black"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

