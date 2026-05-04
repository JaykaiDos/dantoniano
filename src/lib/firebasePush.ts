// lib/firebasePush.ts
import { messaging } from './firebase';
import { getToken, onMessage, deleteToken } from 'firebase/messaging';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
const isLocalhost = 
  typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const generateFakeToken = (): string => `fake-token-${Date.now()}`;

/**
 * Solicita permiso de notificación y obtiene el token FCM
 * @returns Token FCM o null si falla
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  console.log('🔍 [FCM] Iniciando solicitud de permiso...');
  
  // Validaciones previas
  if (typeof window === 'undefined') {
    console.warn('⚠️ [FCM] SSR detectado, saltando');
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.error('❌ [FCM] ServiceWorker no soportado');
    return null;
  }

  if (!('Notification' in window)) {
    console.error('❌ [FCM] Notifications API no soportada');
    return null;
  }

  try {
    // Verificar permiso actual
    let permission = Notification.permission;
    console.log(`📋 [FCM] Permiso actual: ${permission}`);
    
    // Si no está definido, solicitar
    if (permission === 'default') {
      console.log('🔔 [FCM] Solicitando permiso...');
      permission = await Notification.requestPermission();
      console.log(`📋 [FCM] Permiso después de solicitar: ${permission}`);
    }
    
    // Si está denegado, salir
    if (permission !== 'granted') {
      console.error('❌ [FCM] Permiso denegado por usuario');
      return null;
    }

    // ✅ CAMBIO CRÍTICO: Eliminar type: 'module'
    console.log('🔧 [FCM] Registrando Service Worker...');
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      {
        scope: '/',
        // ❌ ELIMINADO: type: 'module',
        updateViaCache: 'none',
      }
    );
    
    console.log('✅ [FCM] Service Worker registrado exitosamente');
    
    // Validar que messaging existe
    if (!messaging) {
      console.error('❌ [FCM] Objeto messaging no inicializado');
      return isLocalhost ? generateFakeToken() : null;
    }

    // Obtener token FCM
    console.log('🔧 [FCM] Obteniendo token...');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    
    if (token) {
      console.log('✅ [FCM] Token obtenido:', token.substring(0, 30) + '...');
      // Guardar en localStorage para persistencia
      if (typeof window !== 'undefined') {
        localStorage.setItem('fcm_token', token);
      }
      return token;
    } else {
      console.warn('⚠️ [FCM] Token es vacío');
      return null;
    }
    
  } catch (error) {
    // Manejo de error sin usar 'any'
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ [FCM] Error:', errorMessage);
    if (error instanceof Error) {
      console.error('   Stack:', error.stack);
    }
    
    // En localhost, retornar token falso para desarrollo
    if (isLocalhost) {
      console.log('ℹ️ [FCM] Usando token falso en localhost');
      return generateFakeToken();
    }
    
    return null;
  }
};

/**
 * Escucha mensajes en foreground (app abierta)
 * @param callback Función a ejecutar cuando llega un mensaje
 * @returns Función para desuscribirse
 */
// Opción 1: Aceptar cualquier tipo (más flexible)
export const onMessageListener = (
  callback: (payload: unknown) => void
): (() => void) => {
  if (!messaging) {
    console.warn('⚠️ [FCM] Messaging no inicializado');
    return () => {};
  }

  console.log('👁️ [FCM] Configurando listener para mensajes en foreground');
  
  return onMessage(messaging, (payload) => {
    console.log('📬 [FCM] Mensaje recibido (foreground):', payload);
    callback(payload); // ✅ Sin casteo
  });
};

/**
 * Elimina el token FCM actual
 */
export const deleteNotificationToken = async (): Promise<void> => {
  if (!messaging) {
    console.warn('⚠️ [FCM] Messaging no inicializado');
    return;
  }

  try {
    await deleteToken(messaging);
    localStorage.removeItem('fcm_token');
    console.log('✅ [FCM] Token eliminado exitosamente');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ [FCM] Error al eliminar token:', errorMessage);
  }
};

/**
 * Obtiene el token actual sin solicitar permiso nuevamente
 * @returns Token existente o null
 */
export const getCurrentToken = async (): Promise<string | null> => {
  // Verificaciones previas
  if (typeof window === 'undefined') {
    console.warn('⚠️ [FCM] SSR detectado');
    return null;
  }

  if (!messaging) {
    console.warn('⚠️ [FCM] Messaging no inicializado');
    return null;
  }

  if (Notification.permission !== 'granted') {
    console.warn('⚠️ [FCM] Permiso no concedido');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration(
      '/firebase-messaging-sw.js'
    );
    
    if (!registration) {
      console.warn('⚠️ [FCM] Service Worker no registrado');
      return isLocalhost ? generateFakeToken() : null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('✅ [FCM] Token obtenido:', token.substring(0, 30) + '...');
      return token;
    } else {
      console.warn('⚠️ [FCM] No se pudo obtener token');
      return null;
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ [FCM] Error al obtener token:', errorMessage);
    return isLocalhost ? generateFakeToken() : null;
  }
};