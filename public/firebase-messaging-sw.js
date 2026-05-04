/* eslint-disable no-restricted-globals */
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBj0jAwQnYAVYbdWmoi3OqE58Q9_4hzDEc",
  authDomain: "dantoniano-63e05.firebaseapp.com",
  projectId: "dantoniano-63e05",
  storageBucket: "dantoniano-63e05.firebasestorage.app",
  messagingSenderId: "750254370850",
  appId: "1:750254370850:web:44465c36d8250c6b2d9a7b",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Escuchar mensajes en segundo plano
onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Mensaje recibido:', payload);

  const notification = payload.notification || {};
  const title = notification.title || 'Nueva notificación';
  const body = notification.body || '';
  const icon = notification.icon || '/icon.png';
  const image = notification.image;
  const url = notification.data?.url || '/';

  // Mostrar notificación
  self.registration?.showNotification(title, {
    body: body,
    icon: icon,
    image: image,
    data: { url: url },
    click: function(event) {
      event.target.focus();
      if (url) {
        event.target.clients.openWindow(url);
      }
    }
  });
});
