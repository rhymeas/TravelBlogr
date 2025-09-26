'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { registerServiceWorker, isPWAInstalled, getNetworkStatus, onNetworkChange } from '@/lib/pwa'

interface PWAContextType {
  isInstalled: boolean
  isOnline: boolean
  registration: ServiceWorkerRegistration | null
  networkStatus: {
    online: boolean
    effectiveType?: string
    downlink?: number
    rtt?: number
  }
  updateAvailable: boolean
  installApp: () => Promise<boolean>
  updateApp: () => void
}

const PWAContext = createContext<PWAContextType | undefined>(undefined)

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [networkStatus, setNetworkStatus] = useState(getNetworkStatus())
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Initialize PWA
    const initPWA = async () => {
      // Check if already installed
      setIsInstalled(isPWAInstalled())
      
      // Register service worker
      const reg = await registerServiceWorker()
      setRegistration(reg)

      // Listen for updates
      if (reg) {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true)
              }
            })
          }
        })
      }
    }

    initPWA()

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    // Listen for network changes
    const unsubscribeNetworkChange = onNetworkChange((online) => {
      setIsOnline(online)
      setNetworkStatus(getNetworkStatus())
    })

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      unsubscribeNetworkChange()
    }
  }, [])

  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setDeferredPrompt(null)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Error installing PWA:', error)
      return false
    }
  }

  const updateApp = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  const value: PWAContextType = {
    isInstalled,
    isOnline,
    registration,
    networkStatus,
    updateAvailable,
    installApp,
    updateApp
  }

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  )
}

export function usePWA() {
  const context = useContext(PWAContext)
  if (context === undefined) {
    throw new Error('usePWA must be used within a PWAProvider')
  }
  return context
}
