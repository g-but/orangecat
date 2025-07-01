/**
 * OrangeCat Service Worker
 * Provides offline functionality, caching, and push notifications
 */

const CACHE_NAME = 'orangecat-v1.0.0'
const OFFLINE_URL = '/offline'

// Static assets to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/discover',
  '/auth',
  '/about',
  '/offline',
  '/manifest.json',
  '/images/orange-cat-logo.svg',
]

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /^\/api\/health/,
  /^\/api\/profile/,
  /^\/api\/funding/,
]

// Image patterns to cache
const IMAGE_CACHE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
  /^\/images\//,
  /^\/icons\//,
]

// Network-first patterns (always try network, fallback to cache)
const NETWORK_FIRST_PATTERNS = [
  /^\/api\//,
  /^\/auth/,
]

// Cache-first patterns (use cache if available)
const CACHE_FIRST_PATTERNS = [
  ...IMAGE_CACHE_PATTERNS,
  /\.(?:js|css|woff|woff2|ttf|eot)$/,
]

// =====================================================================
// INSTALL EVENT - Cache static assets
// =====================================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      
      // Cache static URLs
      try {
        await cache.addAll(STATIC_CACHE_URLS)
        console.log('[SW] Static assets cached successfully')
      } catch (error) {
        console.warn('[SW] Failed to cache some static assets:', error)
        // Cache individually to avoid failing on single broken URL
        for (const url of STATIC_CACHE_URLS) {
          try {
            await cache.add(url)
          } catch (urlError) {
            console.warn(`[SW] Failed to cache ${url}:`, urlError)
          }
        }
      }
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    })()
  )
})

// =====================================================================
// ACTIVATE EVENT - Clean up old caches
// =====================================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          })
      )
      
      // Take control of all pages
      self.clients.claim()
      console.log('[SW] Service worker activated and ready!')
    })()
  )
})

// =====================================================================
// FETCH EVENT - Handle requests with caching strategies
// =====================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return
  }
  
  // Skip requests to different origins (unless API)
  if (url.origin !== self.location.origin && !url.pathname.startsWith('/api')) {
    return
  }
  
  event.respondWith(handleRequest(request))
})

// =====================================================================
// REQUEST HANDLING STRATEGIES
// =====================================================================

async function handleRequest(request) {
  const url = new URL(request.url)
  
  try {
    // 1. Network-first strategy (APIs, auth)
    if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await networkFirst(request)
    }
    
    // 2. Cache-first strategy (static assets)
    if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await cacheFirst(request)
    }
    
    // 3. Stale-while-revalidate for navigation
    if (request.mode === 'navigate') {
      return await staleWhileRevalidate(request)
    }
    
    // 4. Default: network-first
    return await networkFirst(request)
    
  } catch (error) {
    console.warn('[SW] Request failed:', url.pathname, error)
    return await getOfflineFallback(request)
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    throw error
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }
  
  // If not in cache, fetch and cache
  try {
    const response = await fetch(request)
    if (response.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    throw error
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request)
  
  // Always try to revalidate in background
  const fetchPromise = fetch(request).then(response => {
    if (response.status === 200) {
      const cache = caches.open(CACHE_NAME)
      cache.then(c => c.put(request, response.clone()))
    }
    return response
  }).catch(() => null)
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse
  }
  
  // If no cache, wait for network
  return await fetchPromise || getOfflineFallback(request)
}

// Offline fallback
async function getOfflineFallback(request) {
  if (request.mode === 'navigate') {
    // Return offline page for navigation requests
    const offlineResponse = await caches.match(OFFLINE_URL)
    if (offlineResponse) {
      return offlineResponse
    }
    
    // Fallback offline page if not cached
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>OrangeCat - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: system-ui, -apple-system, sans-serif; 
              padding: 2rem; 
              text-align: center; 
              background: linear-gradient(135deg, #f7931a20 0%, #00d4aa20 100%);
              min-height: 100vh;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 1rem;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              max-width: 400px;
            }
            h1 { color: #f7931a; margin-bottom: 1rem; }
            p { color: #666; margin-bottom: 2rem; }
            button { 
              background: #f7931a; 
              color: white; 
              border: none; 
              padding: 0.75rem 1.5rem; 
              border-radius: 0.5rem; 
              cursor: pointer;
              font-size: 1rem;
            }
            button:hover { background: #e8830f; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🟠 OrangeCat</h1>
            <h2>You're Offline</h2>
            <p>It looks like you're not connected to the internet. Some features may not be available.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
      `,
      {
        headers: { 'Content-Type': 'text/html' },
        status: 200
      }
    )
  }
  
  // For other requests, return a simple error response
  return new Response(
    JSON.stringify({ error: 'Offline', message: 'This feature requires an internet connection' }),
    {
      headers: { 'Content-Type': 'application/json' },
      status: 503
    }
  )
}

// =====================================================================
// PUSH NOTIFICATIONS
// =====================================================================
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  try {
    const data = event.data.json()
    const options = {
      body: data.body || 'New update from OrangeCat',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag || 'orangecat-notification',
      requireInteraction: true,
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
      data: {
        url: data.url || '/',
        timestamp: Date.now()
      }
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'OrangeCat', options)
    )
  } catch (error) {
    console.error('[SW] Push notification error:', error)
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'dismiss') {
    return
  }
  
  const url = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if there's already a window open with this URL
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// =====================================================================
// BACKGROUND SYNC (for when connection is restored)
// =====================================================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  console.log('[SW] Background sync triggered')
  // Implement any background sync logic here
  // e.g., upload pending transactions, sync profile data, etc.
}

// =====================================================================
// PERIODIC BACKGROUND SYNC (for updates)
// =====================================================================
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-sync') {
    event.waitUntil(doPeriodicSync())
  }
})

async function doPeriodicSync() {
  console.log('[SW] Periodic sync triggered')
  // Implement periodic sync logic here
  // e.g., check for campaign updates, fetch new featured projects
}

console.log('[SW] Service worker script loaded') 
