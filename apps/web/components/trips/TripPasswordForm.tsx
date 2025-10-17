'use client'

import { useState } from 'react'
import { Key, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TripPasswordFormProps {
  tripSlug: string
}

export function TripPasswordForm({ tripSlug }: TripPasswordFormProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Verify password via API
      const response = await fetch(`/api/trips/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: tripSlug, password })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store password in session storage and reload
        sessionStorage.setItem(`trip_password_${tripSlug}`, password)
        router.refresh()
      } else {
        setError(data.error || 'Incorrect password')
      }
    } catch (err) {
      setError('Failed to verify password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
            <Lock className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Password Protected Trip
        </h1>
        <p className="text-gray-600 text-center mb-6">
          This trip is password protected. Please enter the password to view it.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Access Trip'}
          </button>
        </form>
      </div>
    </div>
  )
}

