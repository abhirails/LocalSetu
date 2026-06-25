import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192.png', 'pwa-512.png', 'apple-touch-icon.png'],
      manifest: {
        name:             'LocalSetu — Your Neighbourhood App',
        short_name:       'LocalSetu',
        description:      'Real-time updates, verified helpers, and urgent needs from people near you.',
        theme_color:      '#FF6B35',
        background_color: '#FFFFFF',
        display:          'standalone',
        orientation:      'portrait',
        scope:            '/',
        start_url:        '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['social', 'utilities'],
        lang:       'en-IN',
        shortcuts: [
          {
            name:       'Right Now',
            short_name: 'Right Now',
            url:        '/right-now',
            description:'Live local updates',
          },
          {
            name:       'Post Update',
            short_name: 'Post',
            url:        '/create',
            description:'Share a local update',
          },
        ],
      },
      workbox: {
        // Cache-first for static assets; network-first for API calls
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler:    'NetworkFirst',
            options: {
              cacheName:          'supabase-cache',
              expiration:         { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/checkout\.razorpay\.com\/.*/i,
            handler:    'NetworkOnly',
          },
          {
            urlPattern: /\.(js|css|woff2?|png|jpg|svg|ico)$/i,
            handler:    'CacheFirst',
            options: {
              cacheName:  'static-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
        // Don't cache API routes
        navigateFallback:         '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  build: {
    emptyOutDir: false,
  },
  server: {
    port: 3000,
    open: true,
  },
})
