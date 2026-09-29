// Service Worker for Gold Payments Bank (GPB)
// Browser Push Notifications & Real-Time Transaction Alerts

const CACHE_NAME = 'gpb-cache-v1';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clean up old caches if any
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              return caches.delete(cache);
            }
          })
        );
      }),
    ])
  );
});

// Push notification event listener (for remote Web Push)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Gold Payments Bank', body: event.data.text() };
    }
  } else {
    data = {
      title: 'Gold Payments Bank',
      body: 'Nuevo movimiento financiero registrado en su cuenta.',
    };
  }

  const options = {
    body: data.body || 'Alerta de movimiento bancario en tiempo real.',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'gpb-tx-' + Date.now(),
    vibrate: [200, 100, 200, 100, 250],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
      ...data,
    },
    actions: [
      { action: 'open', title: 'Ver Movimiento' },
      { action: 'close', title: 'Cerrar' },
    ],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Gold Payments Bank', options)
  );
});

// Listen for message from client to trigger local/simulated push notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_PUSH_NOTIFICATION') {
    const { title, body, icon, data, tag } = event.data.payload || {};
    const options = {
      body: body || 'Nuevo movimiento registrado en Gold Payments Bank.',
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || 'gpb-notification-' + Date.now(),
      vibrate: [200, 100, 200],
      data: {
        url: '/',
        timestamp: Date.now(),
        ...data,
      },
      actions: [
        { action: 'view', title: 'Ver Detalles' },
        { action: 'dismiss', title: 'Descartar' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(title || 'Gold Payments Bank - Notificación Push', options)
    );
  }
});

// Handle clicking on notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close' || event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
