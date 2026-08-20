import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import offlineManifest from './plugins/offline-manifest-plugin.js'

export default defineConfig({
  plugins: [
    react(),
    // Must run before VitePWA so the emitted manifest is picked up by the glob.
    offlineManifest(),
    VitePWA({
      // injectManifest, not generateSW: the bulk download runs inside the worker
      // so it survives the visitor navigating between year pages mid-download,
      // and generateSW cannot host a custom message handler.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt',
      injectRegister: null,

      injectManifest: {
        globPatterns: [
          '**/*.{js,css,html,woff2}',
          'images/favicon.ico',
          // Source for the runnable Python cards — fetched at runtime, tiny,
          // and the cards are blank offline without them.
          '2026/python/*.py',
          '2026/pdf/*.pdf',
          'qr.png',
          'icons/*.png',
          'offline-manifest.json',
        ],
        globIgnores: [
          '**/*.stl',   // 50MB — runtime + bulk download only
          'games/**',   // packaged Scratch games, same
          '**/*.{gif,mp4}',
          // Must NEVER be precached — it is the reachability probe, and a cached
          // copy would report "online" on captive-portal WiFi.
          'ping.txt',
        ],
        // Above the 3D chunk, deliberately below the smallest STL so a model can
        // never sneak into the precache.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        dontCacheBustURLsMatching: /\/assets\//,
      },

      manifest: {
        name: '4H Computer Project Showcase',
        short_name: '4H Showcase',
        description: 'Port Hood Island View 4H club project showcase',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f4f9f6',
        theme_color: '#0f3322',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      devOptions: { enabled: false },
    }),
  ],
})
