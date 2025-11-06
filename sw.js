const CACHE_NAME = 'nam-radio-live-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/services/geminiService.ts',
  '/services/newsService.ts',
  '/services/azuracastService.ts',
  '/components/Header.tsx',
  '/components/NowPlaying.tsx',
  '/components/Schedule.tsx',
  '/components/Djs.tsx',
  '/components/Footer.tsx',
  '/components/MyStation.tsx',
  '/components/ContentHub.tsx',
  '/components/SongRequest.tsx',
  '/components/LiveChat.tsx',
  '/components/UpcomingShows.tsx',
  '/components/About.tsx',
  '/components/ContactPage.tsx',
  '/components/ScrollToTopButton.tsx',
  '/components/LoginModal.tsx',
  '/components/ShareModal.tsx',
  '/components/VibeCheck.tsx',
  '/components/DailyRewindModal.tsx',
  '/components/Toast.tsx',
  '/components/AdminDashboard.tsx',
  'logo192.svg',
  'logo512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use addAll for atomic caching
        return cache.addAll(urlsToCache).catch(err => {
            console.error('Failed to cache files:', err);
        });
      })
  );
});

self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Return from cache if found
        if (response) {
          return response;
        }

        // Otherwise, fetch from network
        return fetch(event.request).then(networkResponse => {
          // Check if we received a valid response
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
             // IMPORTANT: Clone the response. A response is a stream
             // and because we want the browser to consume the response
             // as well as the cache consuming the response, we need
             // to clone it so we have two streams.
             const responseToCache = networkResponse.clone();
             cache.put(event.request, responseToCache);
          }
          return networkResponse;
        });
      });
    })
  );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});