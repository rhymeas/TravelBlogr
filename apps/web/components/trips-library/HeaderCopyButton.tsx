'use client'

/**
 * Header Copy Button Component
 * 
 * Shows "Copy to My Trips" button in header when viewing trip templates
 * Only visible to authenticated users
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getBrowserSupabase } from '@/lib/supabase'
import { Copy } from 'lucide-react'
import toast from 'react-hot-toast'

interface HeaderCopyButtonProps {
  guideId: string
  guideTitle: string
}

export function HeaderCopyButton({ guideId, guideTitle }: HeaderCopyButtonProps) {
  const { user, isAuthenticated } = useAuth()
  const router = useRouter()
  const [copying, setCopying] = useState(false)

  // Only show to authenticated users
  if (!isAuthenticated || !user) {
    return null
  }

  const handleCopyTemplate = async () => {
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

  return (
    <button
      onClick={handleCopyTemplate}
      disabled={copying}
      className="flex items-center gap-2 px-4 py-2 bg-rausch-500 hover:bg-rausch-600 text-white rounded-full font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Copy this trip template to your account"
    >
      {copying ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Copying...
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span className="hidden sm:inline">Copy to My Trips</span>
          <span className="sm:hidden">Copy</span>
        </>
      )}
    </button>
  )
}

