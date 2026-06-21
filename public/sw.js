// LocalSetu Service Worker — Web Push Notifications
// Handles push events and notification clicks

const APP_NAME = 'LocalSetu'
const ICON = '/icon-192.png'

// ── Push event: show notification ──
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: APP_NAME, body: event.data.text() }
  }

  const { title, body, url, tag, icon } = payload

  const options = {
    body: body || '',
    icon: icon || ICON,
    badge: ICON,
    tag: tag || 'localsetu-default',
    data: { url: url || '/' },
    requireInteraction: false,
    vibrate: [200, 100, 200]
  }

  event.waitUntil(
    self.registration.showNotification(title || APP_NAME, options)
  )
})

// ── Notification click: open the relevant URL ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If app is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

// ── Install + activate: skip waiting for instant updates ──
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})
