const CACHE = "edusaas-v1"
const OFFLINE_URLS = ["/", "/login", "/icon-192.png", "/icon-512.png"]
const PROTECTED_ROUTES = ["/settings", "/dashboard", "/students", "/fees", 
  "/attendance", "/exams", "/teachers", "/reports", "/marksheet", 
  "/certificates", "/transport", "/promote", "/notices", "/timetable", "/admissions"]

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(OFFLINE_URLS)))
  self.skipWaiting()
})

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return
  if (e.request.url.includes("/api/")) return
  const url = new URL(e.request.url)
  if (PROTECTED_ROUTES.some((r) => url.pathname.startsWith(r))) return
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return res
      })
      .catch(() => caches.match(e.request))
  )
})