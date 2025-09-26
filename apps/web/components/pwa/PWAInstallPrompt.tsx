'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { X, Download, Smartphone, Monitor, Zap } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      setIsStandalone(isStandaloneMode || isIOSStandalone)
      setIsInstalled(isStandaloneMode || isIOSStandalone)
    }

    // Check if iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
      setIsIOS(isIOSDevice)
    }

    checkInstalled()
    checkIOS()

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay if not already installed
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true)
        }
      }, 3000)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isInstalled])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
      }
      
      setShowPrompt(false)
      setDeferredPrompt(null)
    } catch (error) {
      console.error('Error installing PWA:', error)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem('pwa-prompt-dismissed', 'true')
  }

  // Don't show if already installed or dismissed
  if (isInstalled || !showPrompt || sessionStorage.getItem('pwa-prompt-dismissed')) {
    return null
  }

  // iOS install instructions
  if (isIOS && !isStandalone) {
    return (
      <Card className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-white border shadow-lg md:max-w-md md:left-auto md:right-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Smartphone className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">
              Install TravelBlogr
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Add to your home screen for the best experience
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>1. Tap the Share button <span className="inline-block w-4 h-4 bg-blue-100 rounded text-center">↗</span></p>
              <p>2. Select "Add to Home Screen"</p>
              <p>3. Tap "Add" to install</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    )
  }

  // Standard PWA install prompt
  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 p-4 bg-white border shadow-lg md:max-w-md md:left-auto md:right-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Download className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Install TravelBlogr
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Get the full app experience with offline access and push notifications
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              <span>Faster loading</span>
            </div>
            <div className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              <span>Works offline</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="flex-1"
            >
              Install App
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
            >
              Not now
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Hook for checking PWA installation status
export function usePWAInstall() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstallable, setIsInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check if already installed
    const checkInstalled = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      const isIOSStandalone = (window.navigator as any).standalone === true
      setIsInstalled(isStandaloneMode || isIOSStandalone)
    }

    checkInstalled()

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error installing PWA:', error)
      return false
    }
  }

  return {
    isInstalled,
    isInstallable,
    install
  }
}
