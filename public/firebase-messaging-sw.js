// public/firebase-messaging-sw.js
/* eslint-disable no-restricted-globals */

self.addEventListener('push', (event) => {
  console.log('[SW] Push recibido:', event.data);

  if (event.data) {
    const data = event.data.json();
    const { notification = {} } = data;

    const title = notification.title || 'Nueva notificación';
    const options = {
      body: notification.body || '',
      icon: notification.icon || '/icon-192x192.png',
      badge: '/badge-72x72.png',
      image: notification.image,
      data: {
        url: notification.clickAction || '/',
      },
      tag: 'firebase-notif',
      requireInteraction: false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notificación clickeada');
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});