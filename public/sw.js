/* Road Truth India service worker: lets the report form open and work without signal.
 * Queued reports are stored by the page (IndexedDB outbox) and sent by the page when it's back online. */
const CACHE = "rti-v1"
const PAGES = ["/report-issue", "/track", "/offline"]
const NAV_TIMEOUT_MS = 4000

async function precache() {
  const cache = await caches.open(CACHE)
  await Promise.all(
    PAGES.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok) return
        await cache.put(url, res.clone())
        // Also cache the scripts and styles each page needs to hydrate.
        const html = await res.text()
        const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])]
        await Promise.all(assets.map((a) => cache.add(a).catch(() => undefined)))
      } catch {
        // Offline during install: pages get cached as they're visited instead.
      }
    }),
  )
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
}

async function handleNavigation(request) {
  const cache = await caches.open(CACHE)
  const url = new URL(request.url)
  const network = fetch(request).then((res) => {
    if (res.ok && res.type === "basic") cache.put(url.pathname, res.clone())
    return res
  })
  try {
    // On patchy signal, don't hang: fall back to the cached copy quickly, and let the network refresh the cache.
    return await Promise.race([network, timeout(NAV_TIMEOUT_MS)])
  } catch {
    network.catch(() => undefined)
    return (await cache.match(url.pathname)) || (await cache.match("/offline")) || Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const hit = await cache.match(request)
  if (hit) return hit
  const res = await fetch(request)
  if (res.ok) cache.put(request, res.clone())
  return res
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return // Supabase, maps, analytics: always network
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return

  if (request.mode === "navigate") event.respondWith(handleNavigation(request))
  else if (url.pathname.startsWith("/_next/static/")) event.respondWith(cacheFirst(request)) // content-hashed, never changes
})
