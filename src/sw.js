/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { RangeRequestsPlugin } from 'workbox-range-requests';

const MEDIA_CACHE = '4h-media';
const GAMES_CACHE = '4h-games';

// Cache names deliberately carry NO version token. A shell redeploy bumps the
// precache and leaves the media caches untouched — versioning these names would
// silently cost every visitor a full re-download on any deploy, which they would
// discover at the event. Media is invalidated per-URL via ?v=<contenthash>.

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Routing ─────────────────────────────────────────────────────────────────

// Reachability probe. Must never be answered from cache, or it always reports
// "online" — including on captive-portal WiFi, where navigator.onLine lies.
registerRoute(({ url }) => url.pathname === '/ping.txt', new NetworkOnly());

// SPA fallback. The denylist matters: /games/*.html are real documents loaded
// into iframes, and an iframe load is a navigation request — without this the
// packaged games would each be served index.html and render the app recursively.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/games\//, /^\/2026\//, /\/[^/?]+\.[^/?]+$/],
  })
);

registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    (/\.(stl|gltf|bbmodel)$/i.test(url.pathname) || request.destination === 'video'),
  new CacheFirst({
    cacheName: MEDIA_CACHE,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      // purgeOnQuotaError:false is deliberate and inverts the usual advice — near
      // quota we want the write to fail loudly, not to silently delete models the
      // user downloaded last week.
      new ExpirationPlugin({ maxEntries: 60, purgeOnQuotaError: false }),
      // Safari issues Range requests for <video>; returning a cached full 200 to
      // one produces silent playback failure.
      new RangeRequestsPlugin(),
    ],
  })
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/games/'),
  new CacheFirst({
    cacheName: GAMES_CACHE,
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 40, purgeOnQuotaError: false }),
    ],
  })
);

// ── Bulk download ───────────────────────────────────────────────────────────
// This runs in the worker, not the page, so it survives the visitor navigating
// between year pages mid-download.

const CONCURRENCY = 2;
let abort = null;

const cacheFor = (url) => (url.startsWith('/games/') ? GAMES_CACHE : MEDIA_CACHE);

async function broadcast(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((c) => c.postMessage(message));
}

async function loadManifest() {
  // A fetch issued from inside the worker does not pass through its own fetch
  // handler, so it would fail offline. Fall back to the precached copy.
  try {
    const res = await fetch('/offline-manifest.json', { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch {
    /* offline — fall through */
  }
  const cached = await caches.match('/offline-manifest.json', { ignoreSearch: true });
  if (!cached) throw new Error('offline manifest unavailable');
  return cached.json();
}

const revved = (item) => `${item.url}?v=${item.rev}`;

async function isCached(item) {
  const cache = await caches.open(cacheFor(item.url));
  return Boolean(await cache.match(revved(item)));
}

async function reportStatus() {
  const manifest = await loadManifest().catch(() => null);
  if (!manifest) return;

  const groups = [];
  for (const group of manifest.groups) {
    let cachedCount = 0;
    let cachedBytes = 0;
    for (const item of group.items) {
      if (await isCached(item)) {
        cachedCount++;
        cachedBytes += item.bytes;
      }
    }
    groups.push({
      id: group.id,
      label: group.label,
      bytes: group.bytes,
      count: group.items.length,
      cachedCount,
      cachedBytes,
    });
  }

  let estimate = null;
  if (navigator.storage?.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    estimate = { usage, quota };
  }

  await broadcast({ type: 'OFFLINE_STATUS', groups, estimate });
}

async function runDownload(groupIds) {
  const manifest = await loadManifest();
  const selected = manifest.groups.filter((g) => groupIds.includes(g.id));
  const items = selected.flatMap((g) => g.items);

  const totalBytes = items.reduce((n, i) => n + i.bytes, 0);
  let doneBytes = 0;
  let doneCount = 0;
  const failed = [];

  // Refuse to start rather than fail halfway with a half-populated cache.
  if (navigator.storage?.estimate) {
    const { usage, quota } = await navigator.storage.estimate();
    if (quota && quota - usage < totalBytes * 1.3) {
      await broadcast({
        type: 'OFFLINE_QUOTA',
        needed: totalBytes,
        available: quota - usage,
      });
      return;
    }
  }

  abort = new AbortController();
  const queue = [...items];

  async function worker() {
    while (queue.length) {
      if (abort.signal.aborted) return;
      const item = queue.shift();
      const url = revved(item);
      const cache = await caches.open(cacheFor(item.url));

      try {
        // Skip-if-present is what makes this resumable: re-running after a
        // failure or a closed tab picks up where it left off, no bookkeeping.
        if (!(await cache.match(url))) {
          const res = await fetch(url, { signal: abort.signal });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          await cache.put(url, res.clone());
        }
        doneBytes += item.bytes;
        doneCount++;
      } catch (err) {
        if (err?.name === 'AbortError') return;
        failed.push({ url: item.url, reason: String(err?.message ?? err) });
        doneBytes += item.bytes;
        doneCount++;
      }

      await broadcast({
        type: 'OFFLINE_PROGRESS',
        doneBytes,
        totalBytes,
        doneCount,
        totalCount: items.length,
        currentUrl: item.url,
      });
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  if (!abort.signal.aborted) {
    if (navigator.storage?.persist) await navigator.storage.persist().catch(() => {});
    await broadcast({ type: 'OFFLINE_COMPLETE', failed });
  }
  abort = null;
  await reportStatus();
}

async function purge(groupIds) {
  const manifest = await loadManifest();
  for (const group of manifest.groups.filter((g) => groupIds.includes(g.id))) {
    for (const item of group.items) {
      const cache = await caches.open(cacheFor(item.url));
      await cache.delete(revved(item));
    }
  }
  await reportStatus();
}

/** Drops cached media that is no longer in the manifest (e.g. a replaced model). */
async function removeOrphans() {
  const manifest = await loadManifest().catch(() => null);
  if (!manifest) return;

  const live = new Set(manifest.groups.flatMap((g) => g.items.map(revved)));
  for (const name of [MEDIA_CACHE, GAMES_CACHE]) {
    const cache = await caches.open(name);
    for (const request of await cache.keys()) {
      const path = new URL(request.url).pathname + new URL(request.url).search;
      if (!live.has(path)) await cache.delete(request);
    }
  }
}

self.addEventListener('message', (event) => {
  const { type, groupIds } = event.data ?? {};
  if (type === 'OFFLINE_STATUS') event.waitUntil(reportStatus());
  if (type === 'OFFLINE_DOWNLOAD') event.waitUntil(runDownload(groupIds));
  if (type === 'OFFLINE_PURGE') event.waitUntil(purge(groupIds));
  if (type === 'OFFLINE_CANCEL') abort?.abort();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(removeOrphans());
});
