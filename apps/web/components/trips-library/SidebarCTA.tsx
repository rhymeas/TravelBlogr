'use client'

/**
 * Sidebar CTA Component for Trip Templates
 * 
 * Auth-aware sidebar call-to-action:
 * - Not authenticated: "Start Planning Free" + "Explore Destinations"
 * - Authenticated: "Copy to My Trips" + "Explore Destinations"
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { getBrowserSupabase } from '@/lib/supabase'
import Link from 'next/link'
import { Copy, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface SidebarCTAProps {
  guideId: string
  guideTitle: string
}

export function SidebarCTA({ guideId, guideTitle }: SidebarCTAProps) {
  const { user, isAuthenticated } = useAuth()
  const { showSignIn } = useAuthModal()
  const router = useRouter()
  const [copying, setCopying] = useState(false)

  const handleCopyTemplate = async () => {
    if (!isAuthenticated || !user) {
      showSignIn()
      return
    }

    try {
      setCopying(true)
      const supabase = getBrowserSupabase()

      // Call RPC function to copy template
      const { data, error } = await supabase.rpc('copy_trip_template', {
        p_template_id: guideId,
        p_user_id: user.id
      })

      if (error) {
        console.error('RPC error:', error)
        throw error
      }

      if (!data) {
        throw new Error('No trip ID returned from copy operation')
      }

      toast.success('Template copied to your trips!')
      router.push(`/dashboard/trips/${data}`)
    } catch (error: any) {
      console.error('Error copying template:', error)
      toast.error(error.message || 'Failed to copy template')
    } finally {
      setCopying(false)
    }
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="mt-5 pt-5 border-t border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2 text-sm">Love this itinerary?</h4>
        <p className="text-xs text-gray-600 mb-3">
          Create your own personalized travel guide!
        </p>
        <button
          onClick={() => showSignIn()}
          className="block w-full px-4 py-2.5 bg-rausch-500 text-white text-center rounded-lg hover:bg-rausch-600 transition-colors font-semibold text-sm flex items-center justify-center"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Start Planning Free
        </button>
        <Link
          href="/locations"
          className="block w-full mt-2 px-4 py-2.5 bg-white text-rausch-500 border-2 border-rausch-500 text-center rounded-lg hover:bg-rausch-50 transition-colors font-semibold text-sm"
        >
          Explore Destinations
        </Link>
      </div>
    )
  }

  // Authenticated
  return (
    <div className="mt-5 pt-5 border-t border-gray-200">
      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Love this itinerary?</h4>
      <p className="text-xs text-gray-600 mb-3">
        Copy this trip to your account and customize it!
      </p>
      <button
        onClick={handleCopyTemplate}
        disabled={copying}
        className="block w-full px-4 py-2.5 bg-rausch-500 text-white text-center rounded-lg hover:bg-rausch-600 transition-colors font-semibold text-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {copying ? (
          <>
            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Copying...
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 mr-2" />
            Copy to My Trips
          </>
        )}
      </button>
      <Link
        href="/locations"
        className="block w-full mt-2 px-4 py-2.5 bg-white text-rausch-500 border-2 border-rausch-500 text-center rounded-lg hover:bg-rausch-50 transition-colors font-semibold text-sm"
      >
        Explore Destinations
      </Link>
    </div>
  )
}

