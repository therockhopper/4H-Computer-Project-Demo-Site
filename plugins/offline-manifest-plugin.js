import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';

/**
 * Walks `public/` and emits `offline-manifest.json`: the list of heavy assets
 * that are cached at runtime rather than precached, each with a content hash.
 *
 * Two jobs:
 *  - it is the download list for the "save for offline" control
 *  - the content hashes become `?v=` query strings, which is how these files get
 *    invalidated. They are served straight from `public/` so Vite never
 *    fingerprints them; without a rev, a replaced model keeps its filename and
 *    would be served from cache forever.
 *
 * Generated from the filesystem rather than hand-maintained so it cannot drift
 * from what is actually on disk.
 */

// Assets matching these are runtime-cached + downloadable. Everything else in
// public/ is small enough to precache, where Workbox handles its own revisioning.
const HEAVY = /\.(stl|gltf|bbmodel|mp4|gif)$/i;
const HEAVY_DIRS = ['games'];

const GROUP_LABELS = {
  2024: '2024 Projects',
  2025: '2025 Projects',
  2026: '2026 Projects',
  games: 'Scratch Games',
};

function walk(dir, base, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, base, out);
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

function isHeavy(urlPath) {
  const top = urlPath.split('/')[1];
  return HEAVY.test(urlPath) || HEAVY_DIRS.includes(top);
}

export function buildManifest(publicDir) {
  const files = walk(publicDir, publicDir);
  const groups = new Map();
  let totalBytes = 0;

  for (const file of files) {
    const urlPath = '/' + relative(publicDir, file).split(sep).join(posix.sep);
    if (!isHeavy(urlPath)) continue;

    const bytes = statSync(file).size;
    const rev = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8);
    const id = urlPath.split('/')[1] || 'shell';

    if (!groups.has(id)) {
      groups.set(id, { id, label: GROUP_LABELS[id] ?? id, bytes: 0, items: [] });
    }
    const group = groups.get(id);
    group.items.push({ url: urlPath, rev, bytes });
    group.bytes += bytes;
    totalBytes += bytes;
  }

  const ordered = [...groups.values()].sort((a, b) => b.id.localeCompare(a.id));
  const version = createHash('sha256')
    .update(ordered.flatMap((g) => g.items.map((i) => i.url + i.rev)).join('|'))
    .digest('hex')
    .slice(0, 8);

  return { version, totalBytes, groups: ordered };
}

export default function offlineManifest() {
  let publicDir;

  return {
    name: 'offline-manifest',

    configResolved(config) {
      publicDir = config.publicDir;
    },

    // Serve it in dev so the offline UI works under `npm run dev`.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/offline-manifest.json')) return next();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(buildManifest(publicDir), null, 2));
      });
    },

    // Emit before VitePWA globs `dist/`, so the manifest itself gets precached.
    generateBundle() {
      const manifest = buildManifest(publicDir);
      this.emitFile({
        type: 'asset',
        fileName: 'offline-manifest.json',
        source: JSON.stringify(manifest),
      });
      const mb = (manifest.totalBytes / 1024 / 1024).toFixed(1);
      const counts = manifest.groups.map((g) => `${g.id}:${g.items.length}`).join(' ');
      console.log(`\noffline-manifest  ${mb} MB across ${counts}`);
    },
  };
}
