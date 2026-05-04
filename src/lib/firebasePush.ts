// lib/firebasePush.ts
import { messaging } from './firebase';
import { getToken, onMessage, deleteToken } from 'firebase/messaging';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';

/**
 * Solicita permiso y obtiene token FCM
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  console.log('🔍 [FCM] Iniciando...');

  if (typeof window === 'undefined') {
    console.warn('⚠️ [FCM] SSR detectado');
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    console.error('❌ [FCM] ServiceWorker no soportado');
    return null;
  }

  try {
    // Solicitar permiso si es necesario
    let permission = Notification.permission;
    console.log(`📋 [FCM] Permiso: ${permission}`);

    if (permission === 'default') {
      console.log('🔔 [FCM] Solicitando permiso...');
      permission = await Notification.requestPermission();
      console.log(`📋 [FCM] Permiso después: ${permission}`);
    }

    if (permission !== 'granted') {
      console.error('❌ [FCM] Permiso denegado');
      return null;
    }

    // Registrar Service Worker
    console.log('🔧 [FCM] Registrando SW...');
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
      { scope: '/', updateViaCache: 'none' }
    );

    console.log('✅ [FCM] SW registrado');

    if (!messaging) {
      console.error('❌ [FCM] Messaging no inicializado');
      return null;
    }

    // Obtener token
    console.log('🔧 [FCM] Obteniendo token...');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('✅ [FCM] Token obtenido:', token.substring(0, 30) + '...');
      localStorage.setItem('fcm_token', token);
      return token;
    }

    console.warn('⚠️ [FCM] Token vacío');
    return null;

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ [FCM] Error:', msg);
    return null;
  }
};

/**
 * Escucha mensajes en foreground (app abierta)
 */
export const onMessageListener = (callback: (payload: unknown) => void): (() => void) => {
  if (!messaging) {
    console.warn('⚠️ [FCM] Messaging no inicializado');
    return () => {};
  }

  console.log('👁️ [FCM] Listener configurado');
  return onMessage(messaging, (payload) => {
    console.log('📬 [FCM] Mensaje recibido:', payload);
    callback(payload);
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
    console.log('✅ [FCM] Token eliminado');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ [FCM] Error al eliminar:', msg);
  }
};

/**
 * Obtiene el token actual sin solicitar permiso
 */
export const getCurrentToken = async (): Promise<string | null> => {
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
      console.warn('⚠️ [FCM] SW no registrado');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('✅ [FCM] Token:', token.substring(0, 30) + '...');
      return token;
    }

    console.warn('⚠️ [FCM] No se obtuvo token');
    return null;

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ [FCM] Error:', msg);
    return null;
  }
};