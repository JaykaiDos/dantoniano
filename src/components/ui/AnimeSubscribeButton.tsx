'use client';

import { useState, useEffect } from 'react';
import { subscribeToAnime, getUserTags, unsubscribeFromAnime } from '@/lib/onesignal';

interface Props {
  animeSlug: string;
  animeTitle: string;
}

export function AnimeSubscribeButton({ animeSlug, animeTitle }: Props) {
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
  }, []);

  useEffect(() => {
    // Verificar estado de suscripción
    const checkStatus = async () => {
      try {
        const tags = await getUserTags();
        setSubscribed((tags as any)?.seguimiento_anime === animeSlug);
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
  }, [animeSlug, available]);

  const handleToggle = async () => {
    if (subscribed) {
      await unsubscribeFromAnime();
      setSubscribed(false);
    } else {
      await subscribeToAnime(animeSlug);
      setSubscribed(true);
    }
  };

  if (!available) {
    return null; // No mostrar si OneSignal no está disponible
  }

  if (loading) {
    return (
      <button disabled className="vh-btn vh-btn--ghost" style={{ cursor: 'not-allowed', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
        ⏳
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={subscribed ? 'vh-btn vh-btn--danger' : 'vh-btn vh-btn--ghost'}
      style={{
        fontSize: '0.75rem',
        padding: '0.2rem 0.6rem',
        border: '1px solid currentColor',
        borderRadius: 'var(--vh-radius-full)',
        cursor: 'pointer',
      }}
    >
      {subscribed ? '🔕 Dejar de seguir' : '🔔 Seguir este anime'}
    </button>
  );
}
