'use client';

import { useState, useEffect } from 'react';
import { subscribeToGlobal, getUserTags } from '@/lib/onesignal';

export function GlobalSubscribeButton() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    checkStatus();
  }, []);

  const handleSubscribe = async () => {
    await subscribeToGlobal();
    setSubscribed(true);
  };

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
