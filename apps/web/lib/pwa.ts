// PWA utilities and service worker registration

export interface PWAInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

// Register service worker
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service workers not supported')
    return null
  }

  try {
    console.log('Registering service worker...')
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('Service worker registered successfully:', registration.scope)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, show update notification
            showUpdateNotification(registration)
          }
        })
      }
    })

    return registration
  } catch (error) {
    console.error('Service worker registration failed:', error)
    return null
  }
}

// Show update notification
function showUpdateNotification(registration: ServiceWorkerRegistration) {
  if (typeof window === 'undefined') return

  const updateBanner = document.createElement('div')
  updateBanner.className = 'fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white p-4 text-center'
  updateBanner.innerHTML = `
    <div class="flex items-center justify-between max-w-4xl mx-auto">
      <span>A new version of TravelBlogr is available!</span>
      <div class="flex gap-2">
        <button id="update-app" class="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium">
          Update
        </button>
        <button id="dismiss-update" class="text-white hover:text-gray-200 px-3 py-1 text-sm">
          Later
        </button>
      </div>
    </div>
  `

  document.body.appendChild(updateBanner)

  // Handle update button click
  const updateButton = document.getElementById('update-app')
  updateButton?.addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  })

  // Handle dismiss button click
  const dismissButton = document.getElementById('dismiss-update')
  dismissButton?.addEventListener('click', () => {
    document.body.removeChild(updateBanner)
  })
}

// Check if app is installed
export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  const isIOSStandalone = (window.navigator as any).standalone === true
  
  return isStandalone || isIOSStandalone
}

// Check if device supports PWA installation
export function isPWAInstallable(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for beforeinstallprompt support
  return 'BeforeInstallPromptEvent' in window || 
         'onbeforeinstallprompt' in window ||
         /iPad|iPhone|iPod/.test(navigator.userAgent) // iOS devices
}

// Get device type
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const userAgent = navigator.userAgent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)|Android(?=.*\bTablet\b)/i.test(userAgent)
  
  if (isTablet) return 'tablet'
  if (isMobile) return 'mobile'
  return 'desktop'
}

// Check if device is iOS
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

// Check if device supports touch
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission === 'denied') {
    return 'denied'
  }

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return 'denied'
  }
}

// Show local notification
export function showNotification(title: string, options?: NotificationOptions): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null
  }

  if (Notification.permission !== 'granted') {
    return null
  }

  try {
    return new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options
    })
  } catch (error) {
    console.error('Error showing notification:', error)
    return null
  }
}

// Subscribe to push notifications
export async function subscribeToPushNotifications(
  registration: ServiceWorkerRegistration,
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    })

    console.log('Push subscription successful:', subscription)
    return subscription
  } catch (error) {
    console.error('Error subscribing to push notifications:', error)
    return null
  }
}

// Convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Cache management
export async function clearAppCache(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  try {
    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    )
    console.log('App cache cleared')
  } catch (error) {
    console.error('Error clearing cache:', error)
  }
}

// Get cache size
export async function getCacheSize(): Promise<number> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return 0
  }

  try {
    const cacheNames = await caches.keys()
    let totalSize = 0

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const requests = await cache.keys()
      
      for (const request of requests) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          totalSize += blob.size
        }
      }
    }

    return totalSize
  } catch (error) {
    console.error('Error calculating cache size:', error)
    return 0
  }
}

// Format cache size
export function formatCacheSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Check network status
export function getNetworkStatus(): {
  online: boolean
  effectiveType?: string
  downlink?: number
  rtt?: number
} {
  if (typeof window === 'undefined') {
    return { online: true }
  }

  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection

  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt
  }
}

// Listen for network changes
export function onNetworkChange(callback: (online: boolean) => void): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

// Background sync
export async function registerBackgroundSync(
  registration: ServiceWorkerRegistration,
  tag: string
): Promise<void> {
  if ('sync' in registration) {
    try {
      await (registration as any).sync.register(tag)
      console.log('Background sync registered:', tag)
    } catch (error) {
      console.error('Error registering background sync:', error)
    }
  }
}

// Periodic background sync
export async function registerPeriodicBackgroundSync(
  registration: ServiceWorkerRegistration,
  tag: string,
  minInterval: number
): Promise<void> {
  if ('periodicSync' in registration) {
    try {
      await (registration as any).periodicSync.register(tag, {
        minInterval
      })
      console.log('Periodic background sync registered:', tag)
    } catch (error) {
      console.error('Error registering periodic background sync:', error)
    }
  }
}
