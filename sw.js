

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
  '/components/Contact.tsx',
  '/components/ScrollToTopButton.tsx',
  '/components/LoginModal.tsx',
  '/components/ShareModal.tsx',
  '/components/VibeCheck.tsx',
  '/components/DailyRewindModal.tsx',
  '/components/Toast.tsx',
  '/components/AdminDashboard.tsx',
  '/components/InstallPwaButton.tsx',
  '/components/CommunityCountdown.tsx',
  '/components/StationChart.tsx',
  '/components/ListeningDNA.tsx',
  '/components/ListenerStoryModal.tsx',
  '/components/ListenerQuests.tsx',
  '/components/RecommendationModal.tsx',
  '/components/GoldenHourBanner.tsx',
  '/components/ShowLeaderboards.tsx',
  '/components/LocalSceneMap.tsx',
  '/logo192.svg',
  '/logo512.svg'
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
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    // Try to find a match in the cache first
    caches.match(event.request).then(response => {
      // If a response is found in cache, return it
      if (response) {
        return response;
      }

      // If not in cache, fetch from the network
      return fetch(event.request).then(
        networkResponse => {
          // Check if we received a valid response to cache
          if (networkResponse && networkResponse.status === 200) {
             // Clone the response because it's a stream and can only be consumed once.
             const responseToCache = networkResponse.clone();
             caches.open(CACHE_NAME).then(cache => {
               cache.put(event.request, responseToCache);
             });
          }
          return networkResponse;
        }
      ).catch(() => {
        // If the network request fails (e.g., user is offline)
        // and it's a navigation request, serve the main app shell as a fallback.
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        // For other failed requests (like API calls), let the browser handle the error.
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