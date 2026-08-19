import { useEffect, useState } from 'react';

/**
 * Access to the generated offline manifest.
 *
 * Heavy assets are served straight from `public/`, so Vite never fingerprints
 * them. We append the manifest's content hash as `?v=` to make the URL
 * content-addressed: replacing a model changes its hash, which changes the URL,
 * which is a guaranteed cache miss. Every consumer must go through `assetUrl`,
 * because the cache key is the full URL including the query — a bare path is a
 * silent cache miss, which at an event looks like a blank card.
 */

let manifest = null;
let inflight = null;
const listeners = new Set();

export function loadManifest() {
  if (manifest) return Promise.resolve(manifest);
  if (inflight) return inflight;

  inflight = fetch('/offline-manifest.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((data) => {
      manifest = data;
      inflight = null;
      listeners.forEach((fn) => fn(manifest));
      return manifest;
    });

  return inflight;
}

export function getManifest() {
  return manifest;
}

export function subscribeManifest(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function findItem(path) {
  if (!manifest) return null;
  for (const group of manifest.groups) {
    const hit = group.items.find((i) => i.url === path);
    if (hit) return hit;
  }
  return null;
}

/** Content-addressed URL for a heavy asset. Falls back to the bare path. */
export function assetUrl(path) {
  const item = findItem(path);
  return item ? `${path}?v=${item.rev}` : path;
}

export function assetBytes(path) {
  return findItem(path)?.bytes ?? null;
}

export function formatBytes(bytes) {
  if (bytes == null) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Resolves a heavy asset: its revved URL, byte size, and whether it is already
 * in the cache (so the viewer can auto-load what costs nothing to show).
 */
export function useAssetUrl(path) {
  const [state, setState] = useState(() => ({
    url: assetUrl(path),
    bytes: assetBytes(path),
    cached: false,
  }));

  useEffect(() => {
    let alive = true;

    loadManifest().then(async () => {
      if (!alive) return;
      const url = assetUrl(path);
      const bytes = assetBytes(path);

      let cached = false;
      if ('caches' in window) {
        try {
          cached = Boolean(await caches.match(url, { ignoreVary: true }));
        } catch {
          cached = false;
        }
      }
      if (alive) setState({ url, bytes, cached });
    });

    return () => {
      alive = false;
    };
  }, [path]);

  return state;
}
