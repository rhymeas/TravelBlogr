'use client'

import { useState } from 'react'
import { X, MapPin, Loader2 } from 'lucide-react'
import { LocationAutocomplete } from './LocationAutocomplete'

interface AddStopModalProps {
  isOpen: boolean
  onClose: () => void
  fromLocation: string
  toLocation: string
  onAddStop: (stopLocation: string) => Promise<void>
}

export function AddStopModal({
  isOpen,
  onClose,
  fromLocation,
  toLocation,
  onAddStop
}: AddStopModalProps) {
  const [stopLocation, setStopLocation] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stopLocation.trim()) return

    setIsLoading(true)
    try {
      await onAddStop(stopLocation)
      // Keep modal open to allow multiple additions without closing
      setStopLocation('')
    } catch (error) {
      console.error('Failed to add stop:', error)
      alert('Failed to add stop. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Stop Along the Way</h2>
              <p className="text-sm text-gray-500 mt-1">
                Between <span className="font-medium text-gray-700">{fromLocation}</span> and{' '}
                <span className="font-medium text-gray-700">{toLocation}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Stop Location
                </label>
                <LocationAutocomplete
                  value={stopLocation}
                  onChange={(value) => setStopLocation(value)}
                  placeholder="Enter a city or location..."
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-2">
                  We'll regenerate your itinerary to include this stop
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!stopLocation.trim() || isLoading}
                className="flex-1 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding Stop...
                  </>
                ) : (
                  'Add Stop'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

