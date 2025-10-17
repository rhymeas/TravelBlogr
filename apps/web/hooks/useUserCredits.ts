'use client'

/**
 * Hook to fetch and manage user credits
 * Used in header to display credit balance
 */

import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'

interface CreditStats {
  remaining: number
  purchased: number
  used: number
  lastPurchaseDate?: string
}

export function useUserCredits() {
  const { user, isAuthenticated } = useAuth()
  const [credits, setCredits] = useState<CreditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCredits(null)
      setLoading(false)
      return
    }

    fetchCredits()
  }, [isAuthenticated, user])

  const fetchCredits = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/credits/balance')

      if (!response.ok) {
        throw new Error('Failed to fetch credits')
      }

      const result = await response.json()
      const data = result.data || result

      setCredits({
        remaining: data.remaining || 0,
        purchased: data.totalPurchased || 0,
        used: data.totalUsed || 0,
        lastPurchaseDate: data.lastPurchaseDate,
      })
    } catch (err) {
      console.error('Error fetching credits:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch credits')
      setCredits(null)
    } finally {
      setLoading(false)
    }
  }

  const refresh = () => {
    if (isAuthenticated && user) {
      fetchCredits()
    }
  }

  return {
    credits: credits?.remaining ?? 0,
    stats: credits,
    loading,
    error,
    refresh,
  }
}

