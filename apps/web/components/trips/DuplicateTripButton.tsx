'use client'

import { useState } from 'react'
import { Copy, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface DuplicateTripButtonProps {
  tripId: string
  tripTitle: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showIcon?: boolean
  onSuccess?: (newTripId: string) => void
  className?: string
}

export function DuplicateTripButton({
  tripId,
  tripTitle,
  variant = 'outline',
  size = 'md',
  showIcon = true,
  onSuccess,
  className = ''
}: DuplicateTripButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState(`${tripTitle} (Copy)`)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDuplicate = async () => {
    if (!newTitle.trim()) {
      toast.error('Please enter a title for the duplicated trip')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newTitle: newTitle.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to duplicate trip')
      }

      toast.success('Trip duplicated successfully!')
      setShowModal(false)

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess(data.trip.id)
      } else {
        // Redirect to the new trip's edit page
        router.push(`/dashboard/trips/${data.trip.id}/edit`)
      }
    } catch (error) {
      console.error('Error duplicating trip:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate trip')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setShowModal(true)}
        className={className}
      >
        {showIcon && <Copy className="h-4 w-4 mr-2" />}
        Duplicate Trip
      </Button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Duplicate Trip
            </h2>
            
            <p className="text-gray-600 mb-4">
              This will create a copy of "{tripTitle}" in your account. You can customize it however you like.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="newTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  New Trip Title
                </label>
                <Input
                  id="newTitle"
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter title for duplicated trip"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDuplicate}
                  disabled={isLoading || !newTitle.trim()}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Duplicating...
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The duplicated trip will be created as a draft. All posts and media will be copied.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

