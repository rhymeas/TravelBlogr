// TravelBlogr Service Worker
// Provides offline functionality, caching, and push notifications

const CACHE_NAME = 'travelblogr-v1.0.0'
const STATIC_CACHE = 'travelblogr-static-v1.0.0'
const DYNAMIC_CACHE = 'travelblogr-dynamic-v1.0.0'
const IMAGE_CACHE = 'travelblogr-images-v1.0.0'

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/trips',
  '/dashboard/social',
  '/dashboard/media',
  '/offline',
  '/manifest.json',
  // Add critical CSS and JS files here
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /^\/api\/trips/,
  /^\/api\/posts/,
  /^\/api\/users/,
  /^\/api\/media/
]

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /^https:\/\/.*\.supabase\.co\/storage/,
  /^https:\/\/images\.unsplash\.com/
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('[SW] Service worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return
  }

  // Handle different types of requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request))
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request))
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request))
  } else {
    event.respondWith(handleStaticRequest(request))
  }
})

// Check if request is for an image
function isImageRequest(request) {
  return IMAGE_PATTERNS.some(pattern => pattern.test(request.url))
}

// Check if request is for API
function isAPIRequest(request) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(request.url))
}

// Check if request is navigation
function isNavigationRequest(request) {
  return request.mode === 'navigate'
}

// Handle image requests - Cache First strategy
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('[SW] Serving cached image:', request.url)
      return cachedResponse
    }

    console.log('[SW] Fetching and caching image:', request.url)
    const response = await fetch(request)
    
    if (response.ok) {
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('[SW] Image request failed:', error)
    // Return a placeholder image or fallback
    return new Response('', { status: 404 })
  }
}

// Handle API requests - Network First with fallback
async function handleAPIRequest(request) {
  try {
    console.log('[SW] Fetching API request:', request.url)
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('[SW] API request failed, checking cache:', request.url)
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(JSON.stringify({
      error: 'Offline',
      message: 'This request is not available offline'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Handle navigation requests - Network First with offline fallback
async function handleNavigationRequest(request) {
  try {
    console.log('[SW] Fetching navigation request:', request.url)
    const response = await fetch(request)
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.log('[SW] Navigation request failed, checking cache:', request.url)
    
    // Try to serve from cache
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Try to serve from static cache
    const staticCache = await caches.open(STATIC_CACHE)
    const staticResponse = await staticCache.match(request)
    
    if (staticResponse) {
      return staticResponse
    }
    
    // Fallback to offline page
    return staticCache.match('/offline')
  }
}

// Handle static requests - Cache First strategy
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      console.log('[SW] Serving cached static asset:', request.url)
      return cachedResponse
    }

    console.log('[SW] Fetching static asset:', request.url)
    const response = await fetch(request)
    
    if (response.ok) {
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('[SW] Static request failed:', error)
    return new Response('', { status: 404 })
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received')
  
  if (!event.data) {
    return
  }

  const data = event.data.json()
  const options = {
    body: data.body || 'New notification from TravelBlogr',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    data: data.data || {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    tag: data.tag || 'general',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    silent: false,
    vibrate: [200, 100, 200]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'TravelBlogr', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag)
  
  event.notification.close()

  if (event.action === 'dismiss') {
    return
  }

  const urlToOpen = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If no existing window/tab, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

// Background sync function
async function doBackgroundSync() {
  try {
    console.log('[SW] Performing background sync...')
    
    // Sync any pending data when connection is restored
    // This could include:
    // - Uploading queued media files
    // - Syncing offline posts
    // - Updating user location
    // - Fetching latest content
    
    const cache = await caches.open(DYNAMIC_CACHE)
    // Add background sync logic here
    
    console.log('[SW] Background sync completed')
  } catch (error) {
    console.error('[SW] Background sync failed:', error)
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
})

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync triggered:', event.tag)
  
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent())
  }
})

async function syncContent() {
  try {
    console.log('[SW] Syncing content in background...')
    // Sync latest trips, posts, and social updates
    // This helps keep the app fresh even when not actively used
  } catch (error) {
    console.error('[SW] Content sync failed:', error)
  }
}
