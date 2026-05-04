import { initializeApp, getApps, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getMessaging, Messaging } from 'firebase/messaging';

// Validar que todas las variables estén presentes
const requiredEnvVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasAllEnvVars = Object.values(requiredEnvVars).every(Boolean);

if (!hasAllEnvVars) {
  console.warn('⚠️ [Firebase] Faltan variables de entorno. Firebase no se inicializará correctamente.');
  console.log('Variables requeridas:', requiredEnvVars);
}

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

// Inicializar Firebase solo en el cliente
if (typeof window !== 'undefined') {
  try {
    if (!getApps().length) {
      console.log('🔥 [Firebase] Inicializando app...');
      app = initializeApp(firebaseConfig);
      console.log('✅ [Firebase] App inicializada:', app.name);
    } else {
      app = getApps()[0];
      console.log('✅ [Firebase] App ya existe');
    }

    // Inicializar messaging
    if (app) {
      try {
        console.log('🔔 [Firebase Messaging] Inicializando messaging...');
        messaging = getMessaging(app);
        console.log('✅ [Firebase Messaging] Messaging inicializado');
      } catch (error) {
        console.error('❌ [Firebase Messaging] Error al inicializar:', error);
      }
    }
  } catch (error) {
    console.error('❌ [Firebase] Error fatal:', error);
  }
}

export { app, messaging };
export default app;
