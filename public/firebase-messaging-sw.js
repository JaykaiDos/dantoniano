/* eslint-disable no-restricted-globals */
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// Configuración hardcodeada de Firebase para el service worker
// Esto es necesario porque los service workers no pueden acceder a process.env
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
  console.log('[firebase-messaging-sw.js] Mensaje en segundo plano recibido:', payload);

  const { title, body, icon, image, url, ...customData } = payload.notification || {};

  // Mostrar notificación
  self.registration?.showNotification(title || 'Nueva notificación', {
    body: body || '',
    icon: icon || '/icon.png',
    image: image,
    data: {
      url: url || '/',
      ...customData
    },
    click: (event) => {
      event.target.focus();
      const clientData = (event.target as any).client?.data || event.target;
      if (clientData.url) {
        event.target.clients.openWindow(clientData.url);
      }
    },
  });
});
