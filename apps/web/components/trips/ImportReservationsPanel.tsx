'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { Upload, FileText, Mail, Loader2, CheckCircle2, XCircle } from 'lucide-react'

interface ImportReservationsPanelProps {
  tripId: string
  onImportComplete?: () => void
}

export function ImportReservationsPanel({ tripId, onImportComplete }: ImportReservationsPanelProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    parsed: number
    saved: number
    error?: string
  } | null>(null)

  const handleImport = async () => {
    if (!text.trim()) {
      alert('Please paste your reservation confirmation')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/trips/${tripId}/reservations/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          source: 'paste',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          parsed: 0,
          saved: 0,
          error: data.error || 'Failed to import reservations',
        })
        return
      }

      setResult({
        success: true,
        parsed: data.parsed,
        saved: data.saved,
      })

      setText('')
      onImportComplete?.()
    } catch (error) {
      console.error('Error importing reservations:', error)
      setResult({
        success: false,
        parsed: 0,
        saved: 0,
        error: 'Network error. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Upload className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Import Reservations</h3>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600">
        Paste your booking confirmation emails from Booking.com, Airbnb, airlines, or other providers.
        We'll automatically extract the details and add them to your trip.
      </p>

      {/* Textarea */}
      <div className="space-y-2">
        <label htmlFor="reservation-text" className="text-sm font-medium text-gray-700">
          Paste Confirmation Email
        </label>
        <Textarea
          id="reservation-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your booking confirmation email here...

Example:
Booking Confirmation #123456789
Hotel: Grand Plaza Hotel
Check-in: 12/25/2024
Check-out: 12/28/2024
Total: $450.00"
          rows={12}
          className="font-mono text-sm"
          disabled={loading}
        />
      </div>

      {/* Supported Providers */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-gray-500">Supported:</span>
        <div className="flex flex-wrap gap-2">
          {['Booking.com', 'Airbnb', 'Airlines', 'Hotels.com', 'Expedia'].map((provider) => (
            <span
              key={provider}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
            >
              {provider}
            </span>
          ))}
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg ${
            result.success
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p
              className={`text-sm font-medium ${
                result.success ? 'text-green-900' : 'text-red-900'
              }`}
            >
              {result.success
                ? `Successfully imported ${result.saved} reservation(s)!`
                : 'Import failed'}
            </p>
            {result.error && (
              <p className="text-sm text-red-700 mt-1">{result.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleImport}
          disabled={loading || !text.trim()}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Import Reservation
            </>
          )}
        </Button>
        {text && (
          <Button
            variant="outline"
            onClick={() => {
              setText('')
              setResult(null)
            }}
            disabled={loading}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900">
            <p className="font-medium mb-1">Tips for best results:</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-800">
              <li>Copy the entire confirmation email</li>
              <li>Include confirmation numbers and dates</li>
              <li>One reservation per import works best</li>
              <li>Supported formats: Booking.com, Airbnb, Airlines, Hotels</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Future Feature Hint */}
      <div className="text-center pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <Mail className="h-3 w-3 inline mr-1" />
          Coming soon: Auto-import from Gmail
        </p>
      </div>
    </div>
  )
}

