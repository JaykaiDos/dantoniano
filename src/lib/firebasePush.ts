import { messaging } from './firebase';
import { getToken, onMessage, deleteToken } from 'firebase/messaging';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

// Verificar si estamos en localhost (desarrollo)
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname === '');

/**
 * Genera un token falso para testing en localhost
 */
const generateFakeToken = () => `fake-token-localhost-${Date.now()}-${Math.random().toString(36).substring(7)}`;

/**
 * Solicita permisos y obtiene el token del usuario
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Verificar si ya tenemos permisos
    const permission = Notification.permission;
    
    if (permission === 'denied') {
      console.log('❌ Permiso de notificación denegado por el usuario');
      return null;
    }

    // Si ya está concedido, intentar obtener el token real
    if (permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        if (registration && messaging) {
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
          });
          console.log('✅ Token real obtenido:', token);
          return token;
        }
      } catch (error) {
        console.warn('⚠️ Error al obtener token real, usando fallback:', error);
      }
      
      // Fallback: si falló pero tenemos permisos, generar token fake en localhost
      if (isLocalhost) {
        console.log('🔧 Modo desarrollo: token fake generado');
        return generateFakeToken();
      }
    }

    // Si no está concedido, pedimos permiso
    if (permission !== 'granted') {
      // Solicitar permiso
      const newPermission = await Notification.requestPermission();
      
      if (newPermission !== 'granted') {
        console.log('❌ Permiso de notificación denegado');
        return null;
      }

      // Intentar registrar el service worker
      try {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Obtener token
        if (messaging) {
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
          });
          console.log('✅ Token real obtenido:', token);
          return token;
        }
      } catch (swError) {
        console.warn('⚠️ Service Worker falló:', swError);
        // Fallback para localhost: generar token fake
        if (isLocalhost) {
          console.log('🔧 Modo desarrollo: Service Worker falló, usando token fake');
          return generateFakeToken();
        }
      }
    }
    
    // Si llegamos acá sin token, en localhost generamos uno fake
    if (isLocalhost) {
      console.log('🔧 Modo desarrollo: token fake de respaldo');
      return generateFakeToken();
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error general:', error);
    // Último fallback para localhost
    if (isLocalhost) {
      return generateFakeToken();
    }
    return null;
  }
};

/**
 * Escucha mensajes en primer plano
 */
export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('📨 Mensaje recibido en primer plano:', payload);
    callback(payload);
  });
  
  return unsubscribe;
};

/**
 * Elimina el token del usuario (darse de baja)
 */
export const deleteNotificationToken = async () => {
  if (!messaging) return;
  
  try {
    await deleteToken(messaging);
    console.log('✅ Token eliminado correctamente');
  } catch (error) {
    console.error('❌ Error al eliminar token:', error);
  }
};

/**
 * Obtiene el token actual (si existe)
 */
export const getCurrentToken = async (): Promise<string | null> => {
  // Solo intentar obtener token si ya tenemos permisos
  const permission = Notification.permission;
  if (permission !== 'granted') {
    return null;
  }

  if (!messaging) return null;
  
  try {
    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      // Fallback para localhost
      if (isLocalhost) {
        const existingFake = localStorage.getItem('fake-firebase-token');
        return existingFake || null;
      }
      return null;
    }
    
    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration 
    });
    return token;
  } catch (error) {
    console.error('❌ Error al obtener token actual:', error);
    // Fallback para localhost
    if (isLocalhost) {
      const existingFake = localStorage.getItem('fake-firebase-token');
      return existingFake || generateFakeToken();
    }
    return null;
  }
};
