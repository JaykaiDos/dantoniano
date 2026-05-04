import { messaging } from './firebase';
import { getToken, onMessage, deleteToken } from 'firebase/messaging';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const generateFakeToken = () => `fake-token-${Date.now()}`;

export const requestNotificationPermission = async (): Promise<string | null> => {
  console.log('🔍 [FCM] Iniciando...');
  
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) {
    console.error('❌ [FCM] No soportado');
    return null;
  }

  try {
    const permission = Notification.permission;
    console.log(`🔍 [FCM] Permiso: ${permission}`);
    
    if (permission === 'denied') {
      console.error('❌ [FCM] Denegado');
      return null;
    }

    // Registrar SW
    console.log('🔧 [FCM] Registrando SW...');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      type: 'module',
      updateViaCache: 'none'
    });
    
    console.log('✅ [FCM] SW registrado');
    
    if (!messaging) {
      console.error('❌ [FCM] messaging null');
      return isLocalhost ? generateFakeToken() : null;
    }

    // Obtener token
    console.log('🔧 [FCM] Obteniendo token...');
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    
    console.log('✅ [FCM] Token:', token ? token.substring(0, 20) + '...' : 'null');
    return token;
    
  } catch (error) {
    console.error('❌ [FCM] Error:', error);
    if (isLocalhost) return generateFakeToken();
    return null;
  }
};

export const onMessageListener = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => callback(payload));
};

export const deleteNotificationToken = async () => {
  if (!messaging) return;
  try {
    await deleteToken(messaging);
  } catch (error) {
    console.error('❌ [FCM] Error:', error);
  }
};

export const getCurrentToken = async (): Promise<string | null> => {
  if (!messaging || Notification.permission !== 'granted') return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) return isLocalhost ? 'fake-token' : null;
    return await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  } catch {
    return isLocalhost ? 'fake-token' : null;
  }
};
