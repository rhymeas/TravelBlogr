'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface RefetchOptions {
  refetchAll: boolean
  refetchImages: boolean
  refetchActivities: boolean
  translateContent: boolean
  refetchActivityImages: boolean
  refetchActivityLinks: boolean
}

interface AdminRefetchModalProps {
  isOpen: boolean
  onClose: () => void
  locationSlug: string
  locationName: string
  locationCountry: string
}

interface RefetchProgress {
  step: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
}

export function AdminRefetchModal({
  isOpen,
  onClose,
  locationSlug,
  locationName,
  locationCountry
}: AdminRefetchModalProps) {
  const [options, setOptions] = useState<RefetchOptions>({
    refetchAll: false,
    refetchImages: false,
    refetchActivities: false,
    translateContent: false,
    refetchActivityImages: false,
    refetchActivityLinks: false
  })

  const [isRefetching, setIsRefetching] = useState(false)
  const [progress, setProgress] = useState<RefetchProgress[]>([])
  const [summary, setSummary] = useState<{
    featuredImage?: boolean
    galleryCount?: number
    activityImagesFixed?: number
    activityLinksFixed?: number
    translatedItems?: number
  } | null>(null)

  const toggleOption = (key: keyof RefetchOptions) => {
    setOptions(prev => {
      const newOptions = { ...prev, [key]: !prev[key] }
      
      // If "Refetch All" is toggled on, enable all options
      if (key === 'refetchAll' && !prev.refetchAll) {
        return {
          refetchAll: true,
          refetchImages: true,
          refetchActivities: true,
          translateContent: true,
          refetchActivityImages: true,
          refetchActivityLinks: true
        }
      }
      
      // If "Refetch All" is toggled off, disable all options
      if (key === 'refetchAll' && prev.refetchAll) {
        return {
          refetchAll: false,
          refetchImages: false,
          refetchActivities: false,
          translateContent: false,
          refetchActivityImages: false,
          refetchActivityLinks: false
        }
      }
      
      // If any individual option is toggled off, disable "Refetch All"
      if (key !== 'refetchAll' && !newOptions[key]) {
        newOptions.refetchAll = false
      }
      
      return newOptions
    })
  }

  const updateProgress = (step: string, status: RefetchProgress['status'], message?: string) => {
    setProgress(prev => {
      const existing = prev.find(p => p.step === step)
      if (existing) {
        return prev.map(p => p.step === step ? { ...p, status, message } : p)
      }
      return [...prev, { step, status, message }]
    })
  }

  const handleRefetch = async () => {
    // Validate at least one option is selected
    const hasSelection = Object.entries(options).some(([key, value]) => key !== 'refetchAll' && value)
    if (!hasSelection) {
      alert('Please select at least one refetch option')
      return
    }

    setIsRefetching(true)
    setProgress([])
    setSummary(null)

    try {
      // Step 1: Refetch Images
      if (options.refetchImages || options.refetchAll) {
        updateProgress('images', 'running', 'Fetching high-quality images...')
        
        const response = await fetch('/api/admin/refetch-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationSlug,
            refetchImages: true,
            refetchActivityImages: options.refetchActivityImages || options.refetchAll
          })
        })

        const data = await response.json()
        
        if (response.ok) {
          updateProgress('images', 'success', `Updated ${data.galleryCount || 0} gallery images`)
          setSummary(prev => ({
            ...prev,
            featuredImage: !!data.featuredImage,
            galleryCount: data.galleryCount,
            activityImagesFixed: data.activityImagesFixed
          }))
        } else {
          updateProgress('images', 'error', data.error || 'Failed to refetch images')
        }
      }

      // Step 2: Refetch Activity Images Only
      if (options.refetchActivityImages && !options.refetchImages && !options.refetchAll) {
        updateProgress('activity-images', 'running', 'Fetching activity images...')
        
        const response = await fetch('/api/admin/refetch-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationSlug,
            refetchActivityImages: true
          })
        })

        const data = await response.json()
        
        if (response.ok) {
          updateProgress('activity-images', 'success', `Fixed ${data.activityImagesFixed || 0} activity images`)
          setSummary(prev => ({ ...prev, activityImagesFixed: data.activityImagesFixed }))
        } else {
          updateProgress('activity-images', 'error', data.error || 'Failed to refetch activity images')
        }
      }

      // Step 3: Refetch Activity Links
      if (options.refetchActivityLinks || options.refetchAll) {
        updateProgress('activity-links', 'running', 'Finding activity links...')
        
        const response = await fetch('/api/admin/refetch-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationSlug,
            refetchActivityLinks: true,
            locationName,
            locationCountry
          })
        })

        const data = await response.json()
        
        if (response.ok) {
          updateProgress('activity-links', 'success', `Added ${data.activityLinksFixed || 0} activity links`)
          setSummary(prev => ({ ...prev, activityLinksFixed: data.activityLinksFixed }))
        } else {
          updateProgress('activity-links', 'error', data.error || 'Failed to refetch activity links')
        }
      }

      // Step 4: Translate Content
      if (options.translateContent || options.refetchAll) {
        updateProgress('translation', 'running', 'Translating non-English content...')
        
        const response = await fetch('/api/admin/refetch-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locationSlug,
            translateContent: true
          })
        })

        const data = await response.json()
        
        if (response.ok) {
          updateProgress('translation', 'success', `Translated ${data.translatedItems || 0} items`)
          setSummary(prev => ({ ...prev, translatedItems: data.translatedItems }))
        } else {
          updateProgress('translation', 'error', data.error || 'Failed to translate content')
        }
      }

      // All done!
      setTimeout(() => {
        window.location.reload()
      }, 2000)

    } catch (error) {
      console.error('Refetch error:', error)
      updateProgress('error', 'error', 'Network error occurred')
    } finally {
      setIsRefetching(false)
    }
  }

  const getStatusIcon = (status: RefetchProgress['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto z-50 p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Refetch Location Data
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-gray-600 mb-6">
            Select which data to refetch for <strong>{locationName}</strong>
          </Dialog.Description>

          {/* Options */}
          {!isRefetching && progress.length === 0 && (
            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 p-3 rounded-lg border-2 border-orange-200 bg-orange-50 cursor-pointer hover:bg-orange-100 transition-colors">
                <input
                  type="checkbox"
                  checked={options.refetchAll}
                  onChange={() => toggleOption('refetchAll')}
                  className="mt-0.5 h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Refetch All</div>
                  <div className="text-sm text-gray-600">Complete refresh (images + activities + translations)</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.refetchImages}
                  onChange={() => toggleOption('refetchImages')}
                  className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Refetch Images Only</div>
                  <div className="text-sm text-gray-600">Update featured image and gallery images</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.refetchActivityImages}
                  onChange={() => toggleOption('refetchActivityImages')}
                  className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Refetch Activity Images</div>
                  <div className="text-sm text-gray-600">Update missing/broken activity images</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.refetchActivityLinks}
                  onChange={() => toggleOption('refetchActivityLinks')}
                  className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Refetch Activity Links</div>
                  <div className="text-sm text-gray-600">Find and add missing activity links</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={options.translateContent}
                  onChange={() => toggleOption('translateContent')}
                  className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Translate Content</div>
                  <div className="text-sm text-gray-600">Translate non-English content to English</div>
                </div>
              </label>
            </div>
          )}

          {/* Progress */}
          {progress.length > 0 && (
            <div className="space-y-2 mb-6">
              {progress.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  {getStatusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 capitalize">{item.step.replace('-', ' ')}</div>
                    {item.message && (
                      <div className="text-sm text-gray-600">{item.message}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isRefetching}
              className="flex-1"
            >
              {isRefetching ? 'Close when done' : 'Cancel'}
            </Button>
            <Button
              onClick={handleRefetch}
              disabled={isRefetching}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isRefetching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Refetching...
                </>
              ) : (
                'Start Refetch'
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

