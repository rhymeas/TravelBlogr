'use client'

/**
 * Trip Template Actions Component
 * 
 * Auth-aware CTA buttons for trip templates:
 * - Not authenticated: "Sign Up Free" + "Start Planning Free"
 * - Authenticated: "Copy to My Trips" + "Explore Destinations"
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { getBrowserSupabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { Copy, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface TripTemplateActionsProps {
  guideId: string
  guideTitle: string
  className?: string
}

export function TripTemplateActions({ guideId, guideTitle, className = '' }: TripTemplateActionsProps) {
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

  // Not authenticated - Show sign-up CTA
  if (!isAuthenticated) {
    return (
      <Card className={`p-8 bg-gradient-to-r from-rausch-500 to-rausch-600 text-white text-center ${className}`}>
        <h2 className="text-3xl font-bold mb-3">
          Ready to Create Your Own Adventure?
        </h2>
        <p className="text-rausch-50 mb-6 max-w-2xl mx-auto">
          Join thousands of families planning unforgettable trips with TravelBlogr.
          It's free to start!
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => showSignIn()}
            className="px-6 py-3 bg-white text-rausch-500 rounded-lg hover:bg-gray-100 transition-colors font-bold"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Sign Up Free
          </Button>
          <Link
            href="/plan"
            className="px-6 py-3 bg-rausch-700 text-white rounded-lg hover:bg-rausch-800 transition-colors font-bold inline-flex items-center"
          >
            Start Planning Free
            <ArrowRight className="h-5 w-5 ml-2" />
          </Link>
        </div>
      </Card>
    )
  }

  // Authenticated - Show copy template CTA
  return (
    <Card className={`p-8 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 text-center ${className}`}>
      <div className="flex items-center justify-center mb-3">
        <CheckCircle2 className="h-8 w-8 text-green-500 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">
          Love This Itinerary?
        </h2>
      </div>
      <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
        Copy this trip to your account and customize it for your own adventure!
        Add your own notes, photos, and make it uniquely yours.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button
          onClick={handleCopyTemplate}
          disabled={copying}
          className="px-6 py-3 bg-rausch-500 hover:bg-rausch-600 text-white rounded-lg transition-colors font-bold"
        >
          {copying ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Copying...
            </>
          ) : (
            <>
              <Copy className="h-5 w-5 mr-2" />
              Copy to My Trips
            </>
          )}
        </Button>
        <Link
          href="/locations"
          className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-bold inline-flex items-center"
        >
          Explore Destinations
          <ArrowRight className="h-5 w-5 ml-2" />
        </Link>
      </div>
    </Card>
  )
}

