/* eslint-disable no-restricted-globals */

// Cargar Firebase desde CDN (método clásico, sin ES6)
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js');

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBj0jAwQnYAVYbdWmoi3OqE58Q9_4hzDEc",
  authDomain: "dantoniano-63e05.firebaseapp.com",
  projectId: "dantoniano-63e05",
  storageBucket: "dantoniano-63e05.firebasestorage.app",
  messagingSenderId: "750254370850",
  appId: "1:750254370850:web:44465c36d8250c6b2d9a7b",
};

// Inicializar Firebase en el Service Worker
firebase.initializeApp(firebaseConfig);

// Obtener instancia de messaging
const messaging = firebase.messaging();

// Escuchar mensajes en segundo plano
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Mensaje en background:', payload);

  const notificationTitle = payload.notification?.title || 'Nueva notificación';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
    image: payload.notification?.image,
    data: {
      url: payload.notification?.clickAction || '/',
    },
    tag: 'firebase-notif',
    requireInteraction: false,
  };

  // Mostrar notificación
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notificación clickeada');
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Buscar si ya existe una ventana abierta
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no existe, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});