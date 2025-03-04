const CACHE_NAME = 'eroerodub-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/img/logo.png',
  '/img/avatar.png',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }

        // Clone the request to make a network request while the request can be used later
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response to store it in cache and return it to the browser
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // Exclude certain requests from caching
                if (event.request.url.includes('chrome-extension://') || 
                    event.request.method !== 'GET') {
                  return response;
                }
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // For navigation requests, return the offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // For image requests, you might want to return a default offline image
            if (event.request.destination === 'image') {
              return caches.match('/img/offline.png');
            }
            
            // Return whatever error was caught
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

async function syncFavorites() {
  // This would normally send favorite updates to a server
  // For now, we'll just update the local storage
  const actions = await getActionsFromDB();
  
  if (actions && actions.length > 0) {
    // Process actions
    console.log('Syncing favorites');
    // Clear actions after processing
    await clearActionsFromDB();
  }
}

// Function placeholders for background sync
async function getActionsFromDB() {
  // In a real app, this would fetch from IndexedDB
  return [];
}

async function clearActionsFromDB() {
  // In a real app, this would clear processed actions from IndexedDB
  return true;
}
