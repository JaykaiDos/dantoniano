'use client';

import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission, onMessageListener, deleteNotificationToken, getCurrentToken } from '@/lib/firebasePush';

// Tipos de topics disponibles
export type NotificationTopic = 
  | 'global'
  | `anime:${string}`;

interface UseFirebasePushOptions {
  defaultTopic?: NotificationTopic;
}

export function useFirebasePush(options?: UseFirebasePushOptions) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribedTopics, setSubscribedTopics] = useState<NotificationTopic[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Verificar permisos y suscripciones al montar
  useEffect(() => {
    const checkSubscriptions = async () => {
      try {
        // Solo verificamos si el usuario ya dio permisos
        if (Notification.permission === 'granted') {
          setPermissionGranted(true);
          const currentToken = await getCurrentToken();
          if (currentToken) {
            setToken(currentToken);
            // Cargar topics desde localStorage
            const savedTopics = localStorage.getItem('firebase-topics');
            if (savedTopics) {
              try {
                setSubscribedTopics(JSON.parse(savedTopics));
              } catch {
                console.error('Error al parsear topics guardados');
              }
            }
          }
        } else if (Notification.permission === 'denied') {
          setError('Los permisos de notificación están bloqueados');
        }
      } catch (error) {
        console.error('Error al verificar suscripciones:', error);
      } finally {
        setInitialized(true);
      }
    };
    checkSubscriptions();
  }, []);

  // Suscribirse a un topic
  const subscribeToTopic = useCallback(async (topic: NotificationTopic) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔔 Intentando suscribirse a:', topic);
      
      // 1. Obtener token de FCM (esto pide permisos si no están dados)
      const newToken = await requestNotificationPermission();
      
      console.log('Token obtenido:', newToken);
      
      if (!newToken) {
        if (Notification.permission === 'denied') {
          throw new Error('Permiso de notificación denegado. Actívalo en la configuración de tu navegador.');
        }
        throw new Error('No se pudo obtener el token de FCM. Verifica la consola para más detalles.');
      }

      setToken(newToken);

      // 2. Registrar en la BD (si no es token fake)
      const isFakeToken = newToken.startsWith('fake-token-');
      if (!isFakeToken) {
        const response = await fetch('/api/admin/firebase-subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: newToken, topic }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al suscribirse');
        }
        
        console.log('✅ Suscripción guardada en BD');
      } else {
        console.log('🔧 Modo desarrollo: suscripción local simulada');
        // Guardar token fake en localStorage para persistencia
        localStorage.setItem('fake-firebase-token', newToken);
      }

      // 3. Actualizar estado local
      setSubscribedTopics((prev) => {
        const newTopics = prev.includes(topic) ? prev : [...prev, topic];
        localStorage.setItem('firebase-topics', JSON.stringify(newTopics));
        return newTopics;
      });

      console.log(`✅ Suscrito a ${topic}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al suscribirse';
      setError(errorMessage);
      console.error('❌ Error al suscribirse:', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Desuscribirse de un topic
  const unsubscribeFromTopic = useCallback(async (topic: NotificationTopic) => {
    setLoading(true);
    setError(null);

    try {
      const currentToken = token || await getCurrentToken();
      if (!currentToken) {
        throw new Error('No hay token de FCM');
      }

      // 1. Eliminar de la BD (si no es token fake)
      const isFakeToken = currentToken.startsWith('fake-token-');
      if (!isFakeToken) {
        const response = await fetch('/api/admin/firebase-subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken, topic }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error al desuscribirse');
        }
      } else {
        console.log('🔧 Modo desarrollo: desuscripción local simulada');
      }

      // 2. Actualizar estado local
      setSubscribedTopics((prev) => {
        const newTopics = prev.filter((t) => t !== topic);
        localStorage.setItem('firebase-topics', JSON.stringify(newTopics));
        return newTopics;
      });

      console.log(`✅ Desuscrito de ${topic}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al desuscribirse';
      setError(errorMessage);
      console.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Desuscribirse de todo
  const unsubscribeFromAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const currentToken = token || await getCurrentToken();
      if (!currentToken) {
        return false;
      }

      // Eliminar todas las suscripciones (si no es token fake)
      const isFakeToken = currentToken.startsWith('fake-token-');
      if (!isFakeToken) {
        const response = await fetch('/api/admin/firebase-subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken, topic: 'all' }),
        });

        if (!response.ok) {
          throw new Error('Error al desuscribirse de todo');
        }
      } else {
        console.log('🔧 Modo desarrollo: desuscripción total simulada');
      }

      // Eliminar token de FCM
      await deleteNotificationToken();

      setToken(null);
      setSubscribedTopics([]);
      localStorage.removeItem('firebase-topics');
      setPermissionGranted(false);

      console.log('✅ Desuscrito de todo');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al desuscribirse de todo';
      setError(errorMessage);
      console.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Escuchar mensajes en primer plano
  useEffect(() => {
    if (!permissionGranted) return;
    
    const cleanup = onMessageListener((payload) => {
      console.log('📩 Mensaje recibido:', payload);
    });
    
    return cleanup;
  }, [permissionGranted]);

  return {
    token,
    loading,
    error,
    subscribedTopics,
    initialized,
    permissionGranted,
    subscribeToTopic,
    unsubscribeFromTopic,
    unsubscribeFromAll,
    isSubscribedTo: (topic: NotificationTopic) => subscribedTopics.includes(topic),
  };
}
