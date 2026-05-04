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
  console.log('🔍 [FCM] Iniciando solicitud de permisos...');
  
  if (typeof window === 'undefined') {
    console.error('❌ [FCM] window no está definido');
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.error('❌ [FCM] Service Workers no soportados en este navegador');
    return null;
  }

  try {
    // 1. Verificar permisos actuales
    const permission = Notification.permission;
    console.log(`🔍 [FCM] Permiso actual: ${permission}`);
    
    if (permission === 'denied') {
      console.error('❌ [FCM] Permiso denegado por el usuario');
      return null;
    }

    // 2. Si ya está concedido, intentar obtener token
    if (permission === 'granted') {
      console.log('✅ [FCM] Permiso ya concedido, obteniendo token...');
      try {
        const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
        console.log('🔍 [FCM] Service Worker registration:', registration ? 'Encontrado' : 'No encontrado');
        
        if (registration && messaging) {
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
          });
          console.log('✅ [FCM] Token obtenido:', token);
          return token;
        } else {
          if (!messaging) {
            console.error('❌ [FCM] messaging es null o undefined');
          }
          if (!registration) {
            console.error('❌ [FCM] No se pudo registrar el Service Worker');
          }
        }
      } catch (error) {
        console.error('❌ [FCM] Error al obtener token:', error);
      }
      
      // Fallback para localhost
      if (isLocalhost) {
        console.log('🔧 [FCM] Modo desarrollo: generando token fake');
        return generateFakeToken();
      }
    }

    // 3. Si no está concedido, pedir permiso
    if (permission !== 'granted') {
      console.log('🔔 [FCM] Solicitando permiso al usuario...');
      const newPermission = await Notification.requestPermission();
      console.log(`🔍 [FCM] Nueva permiso: ${newPermission}`);
      
      if (newPermission !== 'granted') {
        console.error('❌ [FCM] Usuario denegó el permiso');
        return null;
      }

      // 4. Registrar Service Worker
      try {
        console.log('🔧 [FCM] Registrando Service Worker...');
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ [FCM] Service Worker registrado:', registration.scope);
        
        // 5. Obtener token
        if (messaging) {
          console.log('🔧 [FCM] Obteniendo token de Firebase...');
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: registration,
          });
          console.log('✅ [FCM] Token obtenido:', token);
          return token;
        } else {
          console.error('❌ [FCM] messaging es null después de registrar SW');
        }
      } catch (swError) {
        console.error('❌ [FCM] Error al registrar Service Worker:', swError);
        
        // Fallback para localhost
        if (isLocalhost) {
          console.log('🔧 [FCM] Modo desarrollo: usando token fake');
          return generateFakeToken();
        }
      }
    }
    
    // Último fallback para localhost
    if (isLocalhost) {
      console.log('🔧 [FCM] Modo desarrollo: token fake de último recurso');
      return generateFakeToken();
    }
    
    console.error('❌ [FCM] No se pudo obtener token por ninguna vía');
    return null;
  } catch (error) {
    console.error('❌ [FCM] Error general:', error);
    // Fallback final para localhost
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
  if (!messaging) {
    console.warn('⚠️ [FCM] messaging no disponible, no se pueden escuchar mensajes');
    return () => {};
  }

  console.log('🔔 [FCM] Escuchando mensajes en primer plano...');
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('📨 [FCM] Mensaje recibido:', payload);
    callback(payload);
  });
  
  return unsubscribe;
};

/**
 * Elimina el token del usuario
 */
export const deleteNotificationToken = async () => {
  if (!messaging) {
    console.warn('⚠️ [FCM] messaging no disponible, no se puede eliminar token');
    return;
  }
  
  try {
    await deleteToken(messaging);
    console.log('✅ [FCM] Token eliminado correctamente');
  } catch (error) {
    console.error('❌ [FCM] Error al eliminar token:', error);
  }
};

/**
 * Obtiene el token actual
 */
export const getCurrentToken = async (): Promise<string | null> => {
  const permission = Notification.permission;
  if (permission !== 'granted') {
    return null;
  }

  if (!messaging) return null;
  
  try {
    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      return isLocalhost ? 'fake-token-localhost-existing' : null;
    }
    
    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration 
    });
    return token;
  } catch (error) {
    console.error('❌ [FCM] Error al obtener token actual:', error);
    if (isLocalhost) {
      return 'fake-token-localhost-existing';
    }
    return null;
  }
};
