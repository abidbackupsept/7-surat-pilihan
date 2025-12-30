
// Based off of https://github.com/pwa-builder/PWABuilder/blob/main/docs/sw.js

/*
  Enhanced Service Worker for 7 Surat Pilihan
  Supports offline functionality for Quran API data
*/

const HOSTNAME_WHITELIST = [
    self.location.hostname,
    'fonts.gstatic.com',
    'fonts.googleapis.com',
    'cdn.jsdelivr.net',
    'api.quran.com',
    'verses.quran.com',
    'audio.quran.com'
]

// Cache names
const CACHE_NAME = 'pwa-cache-v2';
const QURAN_CACHE_NAME = 'quran-cache-v1';

// Target Surahs for pre-caching
const TARGET_CHAPTER_IDS = [18, 31, 32, 36, 55, 56, 67];

// Audio domains for caching
const AUDIO_DOMAINS = ['verses.quran.com', 'audio.quran.com'];

// The Util Function to hack URLs of intercepted requests
const getFixedUrl = (req) => {
    var now = Date.now()
    var url = new URL(req.url)

    // 1. fixed http URL
    url.protocol = self.location.protocol

    // 2. add query for caching-busting.
    if (url.hostname === self.location.hostname) {
        url.search += (url.search ? '&' : '?') + 'cache-bust=' + now
    }
    return url.href
}

/**
 * Pre-cache Quran data for target surahs
 */
const precacheQuranData = async () => {
    console.log('Service Worker: Pre-caching Quran data for target surahs...');
    
    try {
        const quranCache = await caches.open(QURAN_CACHE_NAME);
        
        // Pre-cache chapters info
        const chaptersResponse = await fetch('https://api.quran.com/api/v4/chapters?language=id');
        if (chaptersResponse.ok) {
            await quranCache.put(chaptersResponse.url, chaptersResponse.clone());
        }
        
        // Pre-cache verses for each target surah
        for (const chapterId of TARGET_CHAPTER_IDS) {
            try {
                const versesUrl = `https://api.quran.com/api/v4/verses/by_chapter/${chapterId}?language=id&words=true&word_fields=text_uthmani,translation,transliteration&translations=33&audio=1&per_page=50&word_translation_language=id`;
                const versesResponse = await fetch(versesUrl);
                
                if (versesResponse.ok) {
                    await quranCache.put(versesUrl, versesResponse.clone());
                    console.log(`Service Worker: Cached verses for chapter ${chapterId}`);
                    
                    // Pre-cache audio files for this chapter
                    const versesData = await versesResponse.json();
                    for (const verse of versesData.verses) {
                        if (verse.audio && verse.audio.url) {
                            let audioUrl = verse.audio.url;
                            if (!audioUrl.startsWith('http')) {
                                audioUrl = `https://verses.quran.com/${audioUrl}`;
                            }
                            
                            try {
                                const audioResponse = await fetch(audioUrl);
                                if (audioResponse.ok) {
                                    await quranCache.put(audioUrl, audioResponse.clone());
                                    console.log(`Service Worker: Cached audio for verse ${verse.verse_key}`);
                                }
                            } catch (audioError) {
                                console.log(`Service Worker: Failed to cache audio for verse ${verse.verse_key}:`, audioError);
                            }
                        }
                    }
                }
                
                // Check if there are more pages
                const versesData = await versesResponse.json();
                if (versesData.pagination && versesData.pagination.total_pages > 1) {
                    for (let page = 2; page <= versesData.pagination.total_pages; page++) {
                        const nextPageUrl = `${versesUrl}&page=${page}`;
                        const nextPageResponse = await fetch(nextPageUrl);
                        if (nextPageResponse.ok) {
                            await quranCache.put(nextPageUrl, nextPageResponse.clone());
                            
                            // Cache audio for additional pages too
                            const nextPageData = await nextPageResponse.json();
                            for (const verse of nextPageData.verses) {
                                if (verse.audio && verse.audio.url) {
                                    let audioUrl = verse.audio.url;
                                    if (!audioUrl.startsWith('http')) {
                                        audioUrl = `https://verses.quran.com/${audioUrl}`;
                                    }
                                    
                                    try {
                                        const audioResponse = await fetch(audioUrl);
                                        if (audioResponse.ok) {
                                            await quranCache.put(audioUrl, audioResponse.clone());
                                        }
                                    } catch (audioError) {
                                        console.log(`Service Worker: Failed to cache audio for page ${page} verse ${verse.verse_key}:`, audioError);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Service Worker: Failed to cache chapter ${chapterId}:`, error);
            }
        }
        
        console.log('Service Worker: Quran data pre-caching completed');
    } catch (error) {
        console.error('Service Worker: Error during pre-caching:', error);
    }
}

/**
 *  @Lifecycle Install
 *  Pre-cache essential assets and Quran data
 */
self.addEventListener('install', event => {
    console.log('Service Worker: Install event');
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(CACHE_NAME).then(cache => {
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/manifest.json',
                    '/icon_192.png',
                    '/icon_512.png',
                    '/icon_180.png'
                ]);
            }),
            // Pre-cache Quran data
            precacheQuranData()
        ])
    );
});

/**
 *  @Lifecycle Activate
 *  Clean up old caches
 */
self.addEventListener('activate', event => {
    console.log('Service Worker: Activate event');
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && cacheName !== QURAN_CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

/**
 *  @Functional Fetch
 *  Handle network requests with offline support
 */
self.addEventListener('fetch', event => {
    // Log untuk debugging
    console.log('Service Worker: Fetch event for', event.request.url);
    
    // Skip development server requests
    if (event.request.url.includes('localhost:3000') ||
        event.request.url.includes('@react-refresh') ||
        event.request.url.includes('env.mjs') ||
        event.request.url.includes('cache-bust=')) {
        console.log('Service Worker: Skipping development request', event.request.url);
        return;
    }
    
    const requestUrl = new URL(event.request.url);
    
    // Handle Quran API and Audio requests
    if (requestUrl.hostname === 'api.quran.com' ||
        requestUrl.hostname === 'verses.quran.com' ||
        requestUrl.hostname === 'audio.quran.com') {
        event.respondWith(
            caches.open(QURAN_CACHE_NAME).then(cache => {
                return cache.match(event.request).then(cachedResponse => {
                    // If cached response exists, return it immediately
                    if (cachedResponse) {
                        if (requestUrl.hostname === 'verses.quran.com' || requestUrl.hostname === 'audio.quran.com') {
                            console.log('Service Worker: Serving audio from cache:', event.request.url);
                        } else {
                            console.log('Service Worker: Serving Quran data from cache:', event.request.url);
                        }
                        
                        // Try to fetch fresh data in background (only for API, not audio to save bandwidth)
                        if (requestUrl.hostname === 'api.quran.com') {
                            fetch(event.request).then(freshResponse => {
                                if (freshResponse.ok) {
                                    cache.put(event.request, freshResponse.clone());
                                    console.log('Service Worker: Updated Quran cache:', event.request.url);
                                }
                            }).catch(error => {
                                console.log('Service Worker: Failed to fetch fresh Quran data:', error);
                            });
                        }
                        
                        return cachedResponse;
                    }
                    
                    // If no cached response, try to fetch
                    return fetch(event.request).then(fetchResponse => {
                        if (fetchResponse.ok) {
                            cache.put(event.request, fetchResponse.clone());
                            if (requestUrl.hostname === 'verses.quran.com' || requestUrl.hostname === 'audio.quran.com') {
                                console.log('Service Worker: Cached new audio:', event.request.url);
                            } else {
                                console.log('Service Worker: Cached new Quran data:', event.request.url);
                            }
                        }
                        return fetchResponse;
                    }).catch(error => {
                        console.error('Service Worker: Failed to fetch Quran data/audio:', error);
                        
                        // Return appropriate offline response
                        if (requestUrl.hostname === 'verses.quran.com' || requestUrl.hostname === 'audio.quran.com') {
                            // For audio, return empty audio response
                            return new Response('', {
                                status: 503,
                                statusText: 'Service Unavailable'
                            });
                        } else {
                            // For API, return JSON error response
                            return new Response(
                                JSON.stringify({
                                    error: 'Offline - No cached data available',
                                    message: 'Data Quran tidak tersedia saat offline. Silakan hubungkan ke internet untuk mengambil data terbaru.'
                                }),
                                {
                                    status: 503,
                                    statusText: 'Service Unavailable',
                                    headers: { 'Content-Type': 'application/json' }
                                }
                            );
                        }
                    });
                });
            })
        );
        return;
    }
    
    // Handle other whitelisted requests
    if (HOSTNAME_WHITELIST.indexOf(requestUrl.hostname) > -1) {
        // Stale-while-revalidate strategy for static assets
        const cached = caches.match(event.request);
        const fixedUrl = getFixedUrl(event.request);
        const fetched = fetch(fixedUrl, { cache: 'no-store' });
        const fetchedCopy = fetched.then(resp => resp.clone());

        event.respondWith(
            Promise.race([fetched.catch(_ => cached), cached])
                .then(resp => resp || fetched)
                .catch(_ => {
                    console.log('Service Worker: Network request failed, serving from cache or offline page');
                    // Return offline page for HTML requests
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('/index.html');
                    }
                    return new Response('Offline - Content not available', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                })
        );

        // Update the cache with the version we fetched
        event.waitUntil(
            Promise.all([fetchedCopy, caches.open(CACHE_NAME)])
                .then(([response, cache]) => response.ok && cache.put(event.request, response))
                .catch(_ => { /* eat any errors */ })
        );
    }
});
