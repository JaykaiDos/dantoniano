'use client';

import { useState, useEffect } from 'react';
import { subscribeToGlobal, getUserTags } from '@/lib/onesignal';

export function GlobalSubscribeButton() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // Verificar si OneSignal está disponible
    const checkAvailability = () => {
      if (typeof window !== 'undefined' && window.OneSignalDeferred) {
        setAvailable(true);
      }
    };
    
    checkAvailability();
    
    // Verificar estado de suscripción
    const checkStatus = async () => {
      try {
        const tags = await getUserTags();
        setSubscribed((tags as any)?.interes === 'todos');
      } catch {
        console.error('Error checking OneSignal tags');
      } finally {
        setLoading(false);
      }
    };
    
    if (available) {
      checkStatus();
    } else {
      setLoading(false);
    }
  }, [available]);

  const handleSubscribe = async () => {
    await subscribeToGlobal();
    setSubscribed(true);
  };

  if (!available) {
    return null; // No mostrar si OneSignal no está disponible
  }

  if (loading) {
    return (
      <button disabled className="vh-btn vh-btn--ghost" style={{ cursor: 'not-allowed' }}>
        ⏳ Cargando...
      </button>
    );
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={subscribed}
      className={subscribed ? 'vh-btn vh-btn--success' : 'vh-btn vh-btn--primary'}
      style={{
        cursor: subscribed ? 'default' : 'pointer',
        opacity: subscribed ? 0.7 : 1,
      }}
    >
      {subscribed ? '🔔 Siguiendo globalmente' : '🔔 Activar notificaciones'}
    </button>
  );
}
