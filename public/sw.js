/* Checkmate & Twist service worker: saves lessons, kits, tools and the engine for offline use. */
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const CACHE = "ct-" + VERSION;
const NO_CACHE = /^\/(auth|admin|api|forum|friends|battle|play\/online|u\/|challenges|league|leaderboard|settings)/;
const STATIC = /^\/(_next\/static|stockfish|vendor|workers|icons)\//;

async function precache() {
  const cache = await caches.open(CACHE);
  const res = await fetch("/offline-urls", { cache: "reload" });
  const { pages, files } = await res.json();
  const assets = new Set(files);
  const queue = [...pages];
  const work = async () => {
    while (queue.length) {
      const url = queue.shift();
      try {
        const r = await fetch(url, { cache: "reload", credentials: "same-origin" });
        if (!r.ok) continue;
        const html = await r.clone().text();
        await cache.put(url, r);
        for (const m of html.matchAll(/\/_next\/static\/[^"'\s)\\]+/g)) assets.add(m[0]);
      } catch { /* skip; it will be cached on the next visit */ }
    }
  };
  await Promise.all([work(), work(), work(), work()]);
  const list = [...assets];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (list.length) {
      const url = list.shift();
      if (await cache.match(url)) continue;
      try { const r = await fetch(url); if (r.ok) await cache.put(url, r); } catch { /* ignore */ }
    }
  }));
}

self.addEventListener("install", (e) => { e.waitUntil(precache().then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith("ct-") && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // App-router data requests: let them fail offline so Next falls back to a full page load (served below).
  if (req.headers.get("RSC") === "1" || url.searchParams.has("_rsc")) return;

  if (STATIC.test(url.pathname) || url.pathname === "/manifest.webmanifest") {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req, { ignoreSearch: url.pathname.startsWith("/_next/static") });
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok && r.type === "basic") cache.put(req, r.clone());
      return r;
    })());
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const r = await fetch(req);
        if (r.ok && !NO_CACHE.test(url.pathname) && !url.search) cache.put(url.pathname, r.clone());
        return r;
      } catch {
        return (await cache.match(url.pathname)) || (await cache.match("/offline")) || Response.error();
      }
    })());
  }
});
